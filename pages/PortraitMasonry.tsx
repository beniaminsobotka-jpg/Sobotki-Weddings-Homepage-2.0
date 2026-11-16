import { useLayoutEffect, useRef, useState } from 'react';
import mosaicPhotos from './portrait-mosaic-data.json';
import './portrait-mosaic.css';

const filmIds = new Set([1, 26, 29, 30, 35, 96]);
const editorialIds = new Set([3, 4, 5, 7, 9, 10]);
const portraitIds = new Set([3, 4, 5, 7, 9, 10, 35, 48, 79]);
const shorterPortraitIds = new Set([4, 9, 48, 79]);
const tallerLandscapeIds = new Set([12, 18, 19, 27, 32, 56, 60, 66, 98]);

export const portraitsData = mosaicPhotos.map((photo) => {
    const path = `/media/portraits-best-of/${String(photo.id).padStart(3, '0')}`;
    return {
        ...photo,
        src: `${path}.webp`,
        thumbnail: `${path}-460.webp`,
        style: filmIds.has(photo.id) ? 'film' : editorialIds.has(photo.id) ? 'editorial' : 'classic',
        ratio: portraitIds.has(photo.id)
            ? (shorterPortraitIds.has(photo.id) ? 4 / 5 : 2 / 3)
            : (tallerLandscapeIds.has(photo.id) ? 4 / 3 : 3 / 2),
    };
});

type Tile = {
    index: number;
    column: number;
    top: number;
    height: number;
};

function buildMasonry(width: number, columns: number, gap: number) {
    const tileWidth = (width - (columns - 1) * gap) / columns;
    const offsets = Array.from({ length: columns }, () => 0);
    const pending = portraitsData.map((_, index) => index);
    const tiles: Tile[] = [];

    while (pending.length) {
        const top = Math.min(...offsets);
        const column = offsets.indexOf(top);
        // Fill the shortest column. Pull forward a different style when an
        // editorial or spotlight frame would touch one of its own kind.
        const candidate = pending.findIndex((index) => {
            const photo = portraitsData[index];
            if (photo.style === 'classic') return true;
            const bottom = top + tileWidth / photo.ratio;
            return !tiles.some((tile) =>
                portraitsData[tile.index].style === photo.style &&
                Math.abs(tile.column - column) <= 1 &&
                tile.top + tile.height >= top - gap - 1 &&
                tile.top <= bottom + gap + 1,
            );
        });
        const [index] = pending.splice(Math.max(0, candidate), 1);
        const height = tileWidth / portraitsData[index].ratio;
        tiles.push({ index, column, top, height });
        offsets[column] = top + height + gap;
    }

    return { tiles, tileWidth, stride: tileWidth + gap, height: Math.max(...offsets) - gap };
}

export function PortraitMasonry({ onOpen }: { onOpen: (index: number) => void }) {
    const sectionRef = useRef<HTMLElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const syncRef = useRef<(() => void) | null>(null);
    const [layout, setLayout] = useState<ReturnType<typeof buildMasonry> | null>(null);

    useLayoutEffect(() => {
        const section = sectionRef.current!;
        const viewport = viewportRef.current!;
        const track = trackRef.current!;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;
        let lastMeasurement = '';

        const sync = () => {
            const start = parseFloat(getComputedStyle(viewport).top) || 0;
            const max = Math.max(0, track.offsetHeight - viewport.clientHeight);
            const shift = reduced.matches ? 0 : Math.min(max, Math.max(0, start - section.getBoundingClientRect().top));
            track.style.transform = shift ? `translateY(${-shift}px)` : '';
        };
        syncRef.current = sync;
        const schedule = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                sync();
            });
        };
        const measure = () => {
            const width = viewport.clientWidth;
            const style = getComputedStyle(viewport);
            const columns = Number(style.getPropertyValue('--mosaic-columns'));
            const gap = parseFloat(style.columnGap);
            const measurement = `${width}/${columns}/${gap}`;
            if (width > 0 && columns > 0 && measurement !== lastMeasurement) {
                lastMeasurement = measurement;
                setLayout(buildMasonry(width, columns, gap));
            }
            schedule();
        };

        const observer = new ResizeObserver(measure);
        observer.observe(viewport);
        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', schedule, { passive: true });
        reduced.addEventListener('change', schedule);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
            window.removeEventListener('scroll', schedule);
            reduced.removeEventListener('change', schedule);
            window.cancelAnimationFrame(frame);
            syncRef.current = null;
        };
    }, []);

    useLayoutEffect(() => {
        syncRef.current?.();
    }, [layout]);

    function revealFocusedTile(button: HTMLButtonElement, tile: Tile) {
        if (!button.matches(':focus-visible') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const viewport = viewportRef.current!;
        const section = sectionRef.current!;
        const top = parseFloat(getComputedStyle(viewport).top) || 0;
        const bounds = button.getBoundingClientRect();
        const windowBounds = viewport.getBoundingClientRect();
        if (bounds.top >= windowBounds.top + 40 && bounds.bottom <= windowBounds.bottom) return;
        const max = Math.max(0, trackRef.current!.offsetHeight - viewport.clientHeight);
        const shift = Math.min(max, Math.max(0, tile.top - 56));
        window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - top + shift, behavior: 'instant' });
        syncRef.current?.();
    }

    return (
        <section className="portrait-mosaic" aria-label="Galeria portretów z Fotostacji" ref={sectionRef} style={{ minHeight: layout?.height }}>
            <div className="portrait-mosaic__window" ref={viewportRef}>
                <div className="portrait-mosaic__tiles" ref={trackRef} style={{ height: layout?.height }}>
                    {layout?.tiles.map((tile, order) => {
                        const photo = portraitsData[tile.index];
                        return (
                            <button
                                key={photo.id}
                                type="button"
                                onClick={() => onOpen(tile.index)}
                                onFocus={(event) => revealFocusedTile(event.currentTarget, tile)}
                                className="portrait-mosaic__tile"
                                data-style={photo.style}
                                style={{ left: tile.column * layout.stride, top: tile.top, width: layout.tileWidth, height: tile.height }}
                                aria-label={`Powiększ zdjęcie: ${photo.alt}`}
                            >
                                <img
                                    src={photo.thumbnail}
                                    srcSet={`${photo.thumbnail} 460w, ${photo.src} 1080w`}
                                    sizes="(min-width: 1280px) 400px, (min-width: 640px) 32vw, 47vw"
                                    alt={photo.alt}
                                    loading={order < 10 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    className="portrait-mosaic__image"
                                />
                            </button>
                        );
                    })}
                </div>
                <div className="portrait-mosaic__veil" aria-hidden="true" />
                <div className="portrait-mosaic__veil portrait-mosaic__veil--bottom" aria-hidden="true" />
            </div>
        </section>
    );
}
