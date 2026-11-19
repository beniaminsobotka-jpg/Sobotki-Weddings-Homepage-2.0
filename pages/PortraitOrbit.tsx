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

/**
 * Radial fisheye: identity up to half the radius, then increasingly compressed.
 * Returns the moved point and a single local scale (weighted towards the
 * tangential squeeze, which keeps neighbours touching) so every photo keeps its
 * own aspect ratio.
 */
const LENS = 0.9;
const lens = (x: number, y: number, radius: number) => {
    const r = Math.hypot(x, y);
    const n = r / radius;
    if (n <= 0.5) return [x, y, 1];
    const u = n - 0.5;
    const mapped = 0.5 + u / (1 + LENS * u);
    const tangential = mapped / n;
    const radial = 1 / (1 + LENS * u) ** 2;
    return [x * tangential, y * tangential, tangential ** 0.75 * radial ** 0.25];
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
    const [zoomed, setZoomed] = useState(false);
    const zoomedRef = useRef(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    // Size each tile was last laid out at. Frames in between only scale from it on
    // the GPU; the real width/height (and a sharp re-raster) follow once motion stops.
    const committed = useRef<Array<{ w: number; h: number } | null>>([]);
    const direct = useRef(false);
    const lastFrame = useRef(0);
    const commitTimer = useRef(0);
    const [hintGone, setHintGone] = useState(false);

    const clampPan = () => {
        const v = view.current;
        const limit = EXTENT * v.tZoom * 0.85;
        v.tx = clamp(v.tx, -limit, limit);
        v.ty = clamp(v.ty, -limit, limit);
    };

    /** Where every tile sits for the current view, after the lens. */
    const layout = (stage: HTMLDivElement) => {
        const v = view.current;
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        const radius = Math.min(width, height) / 2;
        return tiles.map((tile) => {
            // Move the photo's centre through the lens and scale it uniformly, so it is
            // never stretched; a small gap absorbs the packing drift near the edge.
            const cx = (tile.x + tile.w / 2) * v.zoom + v.x;
            const cy = (tile.y + tile.h / 2) * v.zoom + v.y;
            const [mx, my, scale] = lens(cx, cy, radius);
            const w = tile.w * v.zoom * scale * 0.96;
            const h = tile.h * v.zoom * scale * 0.96;
            const distance = Math.hypot(cx, cy) / radius;
            return {
                x: width / 2 + mx - w / 2,
                y: height / 2 + my - h / 2,
                w,
                h,
                distance,
                opacity: clamp(2.2 - distance, 0, 1),
            };
        });
    };

    /** Lay tiles out at their real size and swap image resolution: only when still. */
    const commit = () => {
        const stage = stageRef.current;
        if (!stage) return;
        layout(stage).forEach((rect, index) => {
            const item = itemsRef.current[index];
            if (!item || rect.opacity < 0.02 || rect.w < 3) return;
            item.style.width = `${rect.w.toFixed(1)}px`;
            item.style.height = `${rect.h.toFixed(1)}px`;
            item.style.transform = `translate3d(${rect.x.toFixed(1)}px, ${rect.y.toFixed(1)}px, 0)`;
            committed.current[index] = { w: rect.w, h: rect.h };
            // Full-resolution photo only while a tile is shown large; swap back when it
            // shrinks so decoded images do not pile up in memory (the iOS black screen).
            const image = item.querySelector('img');
            const wantFull = rect.w > 300;
            if (image && wantFull !== (item.dataset.full === '1')) {
                item.dataset.full = wantFull ? '1' : '';
                const next = wantFull ? portraitsData[index].src : portraitsData[index].thumbnail;
                // Decode off-screen first so the swap never flashes an empty tile.
                const loader = new Image();
                loader.src = next;
                loader.decode().then(() => {
                    if (item.dataset.full === (wantFull ? '1' : '')) image.src = next;
                }).catch(() => undefined);
            }
        });
    };

    const render = (now: number) => {
        const stage = stageRef.current;
        if (!stage) return;
        const v = view.current;
        const dt = Math.min(64, now - (lastFrame.current || now - 16));
        lastFrame.current = now;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Fingers and the slider move the view 1:1; buttons and taps glide (frame-rate independent).
        const ease = reduced || direct.current ? 1 : 1 - Math.exp(-dt / 85);
        v.zoom += (v.tZoom - v.zoom) * ease;
        v.x += (v.tx - v.x) * ease;
        v.y += (v.ty - v.y) * ease;

        layout(stage).forEach((rect, index) => {
            const item = itemsRef.current[index];
            if (!item) return;
            const hidden = rect.opacity < 0.02 || rect.w < 3;
            item.style.visibility = hidden ? 'hidden' : '';
            item.tabIndex = rect.opacity < 0.4 ? -1 : 0;
            if (hidden) return;
            const base = committed.current[index];
            if (!base) {
                item.style.width = `${rect.w}px`;
                item.style.height = `${rect.h}px`;
                committed.current[index] = { w: rect.w, h: rect.h };
            }
            const from = committed.current[index]!;
            item.style.transform = `translate3d(${rect.x.toFixed(2)}px, ${rect.y.toFixed(2)}px, 0) scale(${(rect.w / from.w).toFixed(4)})`;
            item.style.opacity = rect.opacity.toFixed(3);
            item.style.zIndex = String(Math.round(1000 - rect.distance * 100));
        });

        const settled = Math.abs(v.tZoom - v.zoom) < 0.0005 && Math.abs(v.tx - v.x) < 0.2 && Math.abs(v.ty - v.y) < 0.2;
        window.clearTimeout(commitTimer.current);
        if (settled) {
            frame.current = 0;
            lastFrame.current = 0;
            commitTimer.current = window.setTimeout(commit, 140);
        } else {
            frame.current = requestAnimationFrame(render);
        }
    };

    const kick = () => {
        if (!frame.current) frame.current = requestAnimationFrame(render);
    };

    /** Zoom to `next`, keeping the point at (px, py) – relative to the centre – still. */
    const showLevel = (zoom: number) => {
        const slider = sliderRef.current;
        if (!slider) return;
        const level = clamp(toSlider(zoom), 0, 1);
        slider.style.setProperty('--level', level.toFixed(4));
        slider.setAttribute('aria-valuenow', String(Math.round(level * 100)));
    };

    const zoomTo = (next: number, px = 0, py = 0, immediate = false) => {
        direct.current = immediate;
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
        // Direct DOM updates: re-rendering 40 tiles per gesture step is what made it stutter.
        showLevel(target);
        const isZoomed = target > range.min * 1.08;
        if (isZoomed !== zoomedRef.current) {
            zoomedRef.current = isZoomed;
            setZoomed(isZoomed);
        }
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
            showLevel(v.tZoom);
            committed.current = [];
            kick();
        };
        const observer = new ResizeObserver(fit);
        observer.observe(stage);
        fit();

        // Plain wheel and two-finger trackpad scrolling belong to the page. Only a
        // trackpad pinch zooms: browsers report it as wheel + ctrlKey (Chrome, Edge,
        // Firefox) or as gesture events (Safari).
        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey) return;
            event.preventDefault();
            setHintGone(true);
            const rect = stage.getBoundingClientRect();
            const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
            zoomTo(view.current.tZoom * Math.exp(-delta * 0.01), event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2, true);
        };
        let gestureStart = 1;
        type SafariGesture = Event & { scale: number; clientX: number; clientY: number };
        const onGestureStart = (event: Event) => {
            // On iPhone the pointer handlers already pinch; this is for Safari on a Mac trackpad.
            if (pointers.current.size) return;
            event.preventDefault();
            gestureStart = view.current.tZoom;
        };
        const onGestureChange = (event: Event) => {
            if (pointers.current.size) return;
            event.preventDefault();
            setHintGone(true);
            const gesture = event as SafariGesture;
            const rect = stage.getBoundingClientRect();
            zoomTo(gestureStart * gesture.scale, gesture.clientX - rect.left - rect.width / 2, gesture.clientY - rect.top - rect.height / 2, true);
        };
        stage.addEventListener('gesturestart', onGestureStart);
        stage.addEventListener('gesturechange', onGestureChange);
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
            stage.removeEventListener('gesturestart', onGestureStart);
            stage.removeEventListener('gesturechange', onGestureChange);
            window.clearTimeout(commitTimer.current);
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
            zoomTo(g.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / g.pinch), mid.x, mid.y, true);
            setHintGone(true);
            return;
        }

        const dx = current.x - previous.x;
        const dy = current.y - previous.y;
        if (!g.moved && Math.hypot(dx, dy) < 2) return;
        // In the overview a vertical swipe belongs to the page (touch-action: pan-y).
        if (!g.moved) event.currentTarget.setPointerCapture(event.pointerId);
        g.moved = true;
        direct.current = true;
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
    const level = () => toSlider(view.current.tZoom);
    const dragSlider = (clientY: number) => {
        const rect = sliderRef.current!.getBoundingClientRect();
        zoomTo(fromSlider(1 - (clientY - rect.top) / rect.height), 0, 0, true);
        setHintGone(true);
    };
    const onSliderKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const steps: Record<string, number> = { ArrowUp: 0.08, ArrowRight: 0.08, ArrowDown: -0.08, ArrowLeft: -0.08, PageUp: 0.25, PageDown: -0.25 };
        if (event.key === 'Home') zoomTo(range.min);
        else if (event.key === 'End') zoomTo(range.max);
        else if (event.key in steps) zoomTo(fromSlider(level() + steps[event.key]));
        else return;
        event.preventDefault();
    };

    return (
        <section className="portrait-orbit" aria-label="Galeria portretów z Fotostacji">
            <div
                className="portrait-orbit__stage"
                ref={stageRef}
                data-zoomed={zoomed}
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
                            direct.current = false;
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
                <button type="button" onClick={() => zoomTo(fromSlider(level() + 0.18))} aria-label="Powiększ">
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
                    onKeyDown={onSliderKey}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        dragSlider(event.clientY);
                    }}
                    onPointerMove={(event) => {
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) dragSlider(event.clientY);
                    }}
                >
                    <span className="portrait-orbit__fill" aria-hidden="true" />
                    <span className="portrait-orbit__knob" aria-hidden="true" />
                </div>
                <button type="button" onClick={() => zoomTo(fromSlider(level() - 0.18))} aria-label="Pomniejsz">
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
                <span className="portrait-orbit__hint-desktop">Użyj suwaka lub rozsuń palce na gładziku, aby powiększyć</span>
                <span className="portrait-orbit__hint-touch">Rozsuń dwa palce lub użyj suwaka, aby powiększyć</span>
            </p>
        </section>
    );
}
