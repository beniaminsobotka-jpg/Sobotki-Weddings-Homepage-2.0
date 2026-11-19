import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { portraitsData } from './PortraitMasonry';
import './portrait-orbit.css';

// Watch-style zoomable gallery: the photos keep their own aspect ratio and are
// packed into a masonry whose column heights trace a circle. A radial fisheye
// squeezes everything past mid-radius, and the "crown" (wheel, slider, pinch)
// zooms the whole field in and out.

const COLUMN = 150; // column width at zoom 1, in world px
const GAP = 10;

type Tile = { x: number; y: number; w: number; h: number };

/** Masonry inside a circle: fill whichever column is furthest below its circular target height. */
function circularMasonry(): { tiles: Tile[]; radius: number } {
    const area = portraitsData.reduce((sum, photo) => sum + (COLUMN + GAP) * (COLUMN / photo.ratio + GAP), 0);
    const radius = Math.sqrt(area / Math.PI) * 1.04;
    let columns = Math.max(3, Math.round((2 * radius) / (COLUMN + GAP)));
    if (columns % 2 === 0) columns += 1;
    const centres = Array.from({ length: columns }, (_, i) => (i - (columns - 1) / 2) * (COLUMN + GAP));
    const targets = centres.map((x) => 2 * Math.sqrt(Math.max(radius * radius - x * x, (COLUMN * 0.8) ** 2)));
    const stacks: number[][] = centres.map(() => []);
    const filled = centres.map(() => 0);

    portraitsData.forEach((photo, index) => {
        let best = 0;
        centres.forEach((_, column) => {
            if (filled[column] / targets[column] < filled[best] / targets[best]) best = column;
        });
        stacks[best].push(index);
        filled[best] += COLUMN / photo.ratio + GAP;
    });

    const tiles: Tile[] = [];
    stacks.forEach((stack, column) => {
        // Centre each column vertically so the outline stays round.
        let y = -(filled[column] - GAP) / 2;
        stack.forEach((index) => {
            const h = COLUMN / portraitsData[index].ratio;
            tiles[index] = { x: centres[column] - COLUMN / 2, y, w: COLUMN, h };
            y += h + GAP;
        });
    });
    return { tiles, radius };
}

const { tiles, radius: EXTENT } = circularMasonry();

// The overview is the most zoomed-out state (the whole circle fits the stage),
// so scrolling down past the gallery never gets caught zooming out first.
// The range is fitted to the stage size on every resize.
const range = { min: 0.5, max: 3 };

/** Radial fisheye: identity up to half the radius, then increasingly compressed. */
const lens = (x: number, y: number, radius: number) => {
    const r = Math.hypot(x, y);
    const n = r / radius;
    if (n <= 0.5) return [x, y];
    const k = (radius * (0.5 + (n - 0.5) / (1 + 1.25 * (n - 0.5)))) / r;
    return [x * k, y * k];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toSlider = (zoom: number) => Math.log(zoom / range.min) / Math.log(range.max / range.min);
const fromSlider = (value: number) => range.min * (range.max / range.min) ** clamp(value, 0, 1);

export function PortraitOrbit({ onOpen }: { onOpen: (index: number) => void }) {
    const stageRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
    const view = useRef({ zoom: range.min, x: 0, y: 0, tZoom: range.min, tx: 0, ty: 0 });
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const gesture = useRef<{ moved: boolean; pinch: number; zoom: number } | null>(null);
    const frame = useRef(0);
    const [zoomLevel, setZoomLevel] = useState(toSlider(range.min));
    const [zoomed, setZoomed] = useState(false);
    const [hintGone, setHintGone] = useState(false);

    const clampPan = () => {
        const v = view.current;
        const limit = EXTENT * v.tZoom * 0.85;
        v.tx = clamp(v.tx, -limit, limit);
        v.ty = clamp(v.ty, -limit, limit);
    };

    const render = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const v = view.current;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const ease = reduced ? 1 : 0.2;
        v.zoom += (v.tZoom - v.zoom) * ease;
        v.x += (v.tx - v.x) * ease;
        v.y += (v.ty - v.y) * ease;

        const width = stage.clientWidth;
        const height = stage.clientHeight;
        const radius = Math.min(width, height) / 2;

        tiles.forEach((tile, index) => {
            const item = itemsRef.current[index];
            if (!item) return;
            // Map the tile's corners through the lens so neighbours stay packed.
            const x0 = tile.x * v.zoom + v.x;
            const y0 = tile.y * v.zoom + v.y;
            const x1 = x0 + tile.w * v.zoom;
            const y1 = y0 + tile.h * v.zoom;
            const corners = [lens(x0, y0, radius), lens(x1, y0, radius), lens(x0, y1, radius), lens(x1, y1, radius)];
            const left = Math.min(...corners.map((c) => c[0]));
            const right = Math.max(...corners.map((c) => c[0]));
            const top = Math.min(...corners.map((c) => c[1]));
            const bottom = Math.max(...corners.map((c) => c[1]));
            // A slight inset hides the overlap the lens adds between bounding boxes.
            const insetX = (right - left) * 0.03;
            const insetY = (bottom - top) * 0.03;
            const w = right - left - 2 * insetX;
            const distance = Math.hypot((x0 + x1) / 2, (y0 + y1) / 2) / radius;
            const opacity = clamp(2.2 - distance, 0, 1);
            const hidden = opacity < 0.02 || w < 3;

            item.style.visibility = hidden ? 'hidden' : '';
            item.tabIndex = opacity < 0.4 ? -1 : 0;
            if (hidden) return;
            // Real width/height, not a scale(): Safari then rasterises each tile at the
            // size it is shown, which keeps GPU memory small on phones.
            item.style.transform = `translate3d(${(width / 2 + left + insetX).toFixed(1)}px, ${(height / 2 + top + insetY).toFixed(1)}px, 0)`;
            item.style.width = `${w.toFixed(1)}px`;
            item.style.height = `${(bottom - top - 2 * insetY).toFixed(1)}px`;
            item.style.opacity = String(opacity);
            item.style.zIndex = String(Math.round(1000 - distance * 100));

            // Full-resolution photo only while a tile is shown large; swap back when it
            // shrinks so decoded images do not pile up in memory.
            const image = item.querySelector('img');
            if (!image) return;
            const wantFull = w > 300;
            if (wantFull !== (item.dataset.full === '1')) {
                item.dataset.full = wantFull ? '1' : '';
                image.src = wantFull ? portraitsData[index].src : portraitsData[index].thumbnail;
            }
        });

        const settled = Math.abs(v.tZoom - v.zoom) < 0.001 && Math.abs(v.tx - v.x) < 0.3 && Math.abs(v.ty - v.y) < 0.3;
        frame.current = settled ? 0 : requestAnimationFrame(render);
    };

    const kick = () => {
        if (!frame.current) frame.current = requestAnimationFrame(render);
    };

    /** Zoom to `next`, keeping the point at (px, py) – relative to the centre – still. */
    const zoomTo = (next: number, px = 0, py = 0) => {
        const v = view.current;
        const target = clamp(next, range.min, range.max);
        const ratio = target / v.tZoom;
        v.tx = px - (px - v.tx) * ratio;
        v.ty = py - (py - v.ty) * ratio;
        v.tZoom = target;
        if (target <= range.min + 0.001) {
            v.tx = 0;
            v.ty = 0;
        }
        clampPan();
        setZoomLevel(toSlider(target));
        setZoomed(target > range.min * 1.08);
        kick();
    };

    useEffect(() => {
        const stage = stageRef.current!;
        const fit = () => {
            const v = view.current;
            const atOverview = v.tZoom <= range.min + 0.001;
            const radius = Math.min(stage.clientWidth, stage.clientHeight) / 2;
            range.min = clamp((radius * 1.08) / EXTENT, 0.25, 1.2);
            range.max = Math.max(2.4, range.min * 4.5);
            if (atOverview) {
                v.tZoom = range.min;
                v.zoom = range.min;
            }
            setZoomLevel(toSlider(v.tZoom));
            kick();
        };
        const observer = new ResizeObserver(fit);
        observer.observe(stage);

        // The wheel acts as the crown. At either end of the range it hands the
        // scroll back to the page, so the section never traps the visitor.
        const onWheel = (event: WheelEvent) => {
            const v = view.current;
            const zoomingIn = event.deltaY < 0;
            if ((zoomingIn && v.tZoom >= range.max - 0.001) || (!zoomingIn && v.tZoom <= range.min + 0.001)) return;
            event.preventDefault();
            setHintGone(true);
            const rect = stage.getBoundingClientRect();
            const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
            zoomTo(v.tZoom * Math.exp(-delta * 0.0012), event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
        };
        stage.addEventListener('wheel', onWheel, { passive: false });

        // iOS Safari does not reliably honour touch-action changes made after load,
        // so block page scrolling directly while zoomed in or pinching.
        const onTouchMove = (event: TouchEvent) => {
            if (event.touches.length > 1 || view.current.tZoom > range.min * 1.08) event.preventDefault();
        };
        stage.addEventListener('touchmove', onTouchMove, { passive: false });
        kick();
        return () => {
            observer.disconnect();
            stage.removeEventListener('wheel', onWheel);
            stage.removeEventListener('touchmove', onTouchMove);
            cancelAnimationFrame(frame.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const relative = (x: number, y: number) => {
        const rect = stageRef.current!.getBoundingClientRect();
        return { x: x - rect.left - rect.width / 2, y: y - rect.top - rect.height / 2 };
    };

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 1) gesture.current = { moved: false, pinch: 0, zoom: view.current.tZoom };
        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            gesture.current = { moved: true, pinch: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.current.tZoom };
            event.currentTarget.setPointerCapture(event.pointerId);
        }
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const previous = pointers.current.get(event.pointerId);
        const g = gesture.current;
        if (!previous || !g) return;
        const current = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, current);
        const v = view.current;

        if (pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()];
            const mid = relative((a.x + b.x) / 2, (a.y + b.y) / 2);
            zoomTo(g.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / g.pinch), mid.x, mid.y);
            setHintGone(true);
            return;
        }

        const dx = current.x - previous.x;
        const dy = current.y - previous.y;
        if (!g.moved && Math.hypot(dx, dy) < 2) return;
        // In the overview a vertical swipe belongs to the page (touch-action: pan-y).
        if (!g.moved) event.currentTarget.setPointerCapture(event.pointerId);
        g.moved = true;
        v.tx += dx;
        v.ty += v.tZoom > range.min * 1.08 || event.pointerType === 'mouse' ? dy : 0;
        clampPan();
        kick();
    };

    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        pointers.current.delete(event.pointerId);
        if (pointers.current.size === 0) {
            const g = gesture.current;
            // Swallow the click after a drag or pinch so it does not open a photo. iOS Safari
                // fires that click a few hundred ms after the touch ends.
            if (g?.moved) {
                const swallow = (click: MouseEvent) => { click.stopPropagation(); click.preventDefault(); };
                window.addEventListener('click', swallow, { capture: true, once: true });
                window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 400);
            }
            gesture.current = null;
        }
    };

    // Vertical "crown" on the right: drag along the track to zoom.
    const sliderRef = useRef<HTMLDivElement>(null);
    const dragSlider = (clientY: number) => {
        const rect = sliderRef.current!.getBoundingClientRect();
        zoomTo(fromSlider(1 - (clientY - rect.top) / rect.height));
        setHintGone(true);
    };
    const onSliderKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const steps: Record<string, number> = { ArrowUp: 0.08, ArrowRight: 0.08, ArrowDown: -0.08, ArrowLeft: -0.08, PageUp: 0.25, PageDown: -0.25 };
        if (event.key === 'Home') zoomTo(range.min);
        else if (event.key === 'End') zoomTo(range.max);
        else if (event.key in steps) zoomTo(fromSlider(zoomLevel + steps[event.key]));
        else return;
        event.preventDefault();
    };

    return (
        <section className="portrait-orbit" aria-label="Galeria portretów z Fotostacji">
            <div
                className="portrait-orbit__stage"
                ref={stageRef}
                data-zoomed={zoomed}
                data-lenis-prevent
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={(event) => {
                    const point = relative(event.clientX, event.clientY);
                    zoomTo(view.current.tZoom * 1.8, point.x, point.y);
                }}
            >
                {portraitsData.map((photo, index) => (
                    <button
                        key={photo.id}
                        ref={(node) => { itemsRef.current[index] = node; }}
                        type="button"
                        className="portrait-orbit__tile"
                        style={{ '--i': index } as CSSProperties}
                        onClick={() => onOpen(index)}
                        onFocus={() => {
                            // Keyboard focus brings the photo to the centre.
                            const v = view.current;
                            const tile = tiles[index];
                            v.tx = -(tile.x + tile.w / 2) * v.tZoom;
                            v.ty = -(tile.y + tile.h / 2) * v.tZoom;
                            clampPan();
                            kick();
                        }}
                        aria-label={`Powiększ zdjęcie: ${photo.alt}`}
                    >
                        <img src={photo.thumbnail} alt="" draggable={false} decoding="async" />
                    </button>
                ))}
            </div>

            <div className="portrait-orbit__crown" aria-label="Powiększenie galerii">
                <button type="button" onClick={() => zoomTo(fromSlider(zoomLevel + 0.18))} aria-label="Powiększ">
                    <Plus size={16} aria-hidden="true" />
                </button>
                <div
                    ref={sliderRef}
                    className="portrait-orbit__track"
                    role="slider"
                    tabIndex={0}
                    aria-orientation="vertical"
                    aria-label="Powiększenie zdjęć"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(zoomLevel * 100)}
                    onKeyDown={onSliderKey}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        dragSlider(event.clientY);
                    }}
                    onPointerMove={(event) => {
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) dragSlider(event.clientY);
                    }}
                    style={{ '--level': zoomLevel } as CSSProperties}
                >
                    <span className="portrait-orbit__fill" aria-hidden="true" />
                    <span className="portrait-orbit__knob" aria-hidden="true" />
                </div>
                <button type="button" onClick={() => zoomTo(fromSlider(zoomLevel - 0.18))} aria-label="Pomniejsz">
                    <Minus size={16} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="portrait-orbit__reset"
                    data-visible={zoomed}
                    onClick={() => zoomTo(range.min)}
                    aria-label="Wróć do widoku całej galerii"
                    tabIndex={zoomed ? 0 : -1}
                >
                    <RotateCcw size={14} aria-hidden="true" />
                </button>
            </div>

            <p className="portrait-orbit__hint" data-gone={hintGone} aria-hidden="true">
                <span className="portrait-orbit__hint-desktop">Przewiń kółkiem nad zdjęciami lub użyj suwaka, aby je powiększyć</span>
                <span className="portrait-orbit__hint-touch">Rozsuń dwa palce lub użyj suwaka, aby powiększyć</span>
            </p>
        </section>
    );
}
