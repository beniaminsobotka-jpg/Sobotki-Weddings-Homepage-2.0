import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { portraitsData } from './PortraitMasonry';
import './portrait-orbit.css';

// Apple Watch–style honeycomb: round thumbnails packed in rings around the centre.
// Photos shrink and pull inward towards the edge (a fisheye), and the "crown"
// (wheel, slider, pinch) zooms the whole field in and out.

const BUBBLE = 132; // bubble diameter at zoom 1, in px
const MAX_SIZE = 320; // rendered element size; bubbles are scaled down from this
// The overview is the most zoomed-out state (the whole honeycomb fits the stage),
// so scrolling down past the gallery never gets caught zooming out first.
// The range is fitted to the stage size on every resize.
const range = { min: 0.5, max: 2.6 };

/** Axial hex coordinates in a spiral: centre, then ring 1, ring 2… */
function spiral(count: number) {
    const directions = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    const cells: Array<[number, number]> = [[0, 0]];
    for (let ring = 1; cells.length < count; ring++) {
        let q = -ring;
        let r = ring;
        for (const [dq, dr] of directions) {
            for (let step = 0; step < ring && cells.length < count; step++) {
                cells.push([q, r]);
                q += dq;
                r += dr;
            }
        }
    }
    return cells;
}

// Centre-to-centre spacing leaves a small gap between neighbouring bubbles.
const cells = spiral(portraitsData.length).map(([q, r]) => ({
    x: (q + r / 2) * BUBBLE * 1.1,
    y: r * BUBBLE * 1.1 * (Math.sqrt(3) / 2),
}));
const EXTENT = Math.max(...cells.map(({ x, y }) => Math.hypot(x, y))) + BUBBLE / 2;

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

        cells.forEach((cell, index) => {
            const item = itemsRef.current[index];
            if (!item) return;
            const dx = cell.x * v.zoom + v.x;
            const dy = cell.y * v.zoom + v.y;
            const distance = Math.hypot(dx, dy) / radius;
            // Fisheye: past ~half the radius bubbles shrink and slide towards the centre.
            const pull = 1 / (1 + 0.45 * Math.max(0, distance - 0.45));
            const size = BUBBLE * v.zoom * clamp(1.08 - 0.62 * distance * distance, 0.18, 1.08);
            const scale = size / MAX_SIZE;
            const opacity = clamp(2.1 - distance, 0, 1);
            item.style.transform = `translate3d(${width / 2 + dx * pull - MAX_SIZE / 2}px, ${height / 2 + dy * pull - MAX_SIZE / 2}px, 0) scale(${scale})`;
            item.style.opacity = String(opacity);
            item.style.zIndex = String(Math.round(1000 - distance * 100));
            item.style.visibility = opacity < 0.02 ? 'hidden' : '';
            item.tabIndex = opacity < 0.4 ? -1 : 0;
            // Swap to the full photo once a bubble is shown large.
            if (size > 230 && !item.dataset.full) {
                item.dataset.full = '1';
                const image = item.querySelector('img');
                if (image) image.src = portraitsData[index].src;
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
            range.min = clamp((radius * 1.05) / EXTENT, 0.28, 1.1);
            range.max = Math.max(2.6, range.min * 4);
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
        kick();
        return () => {
            observer.disconnect();
            stage.removeEventListener('wheel', onWheel);
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
        v.ty += zoomed || event.pointerType === 'mouse' ? dy : 0;
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
                        className="portrait-orbit__bubble"
                        style={{ width: MAX_SIZE, height: MAX_SIZE, '--i': index } as CSSProperties}
                        onClick={() => onOpen(index)}
                        onFocus={() => {
                            // Keyboard focus brings the photo to the centre.
                            const v = view.current;
                            v.tx = -cells[index].x * v.tZoom;
                            v.ty = -cells[index].y * v.tZoom;
                            clampPan();
                            kick();
                        }}
                        aria-label={`Powiększ zdjęcie: ${photo.alt}`}
                    >
                        <img src={photo.thumbnail} alt="" draggable={false} loading={index < 19 ? 'eager' : 'lazy'} decoding="async" />
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
