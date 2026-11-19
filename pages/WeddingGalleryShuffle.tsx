import { useEffect, useRef, useState } from 'react';
import './wedding-gallery-shuffle.css';

// The nine photos the grid opens with, then a pool from the Best Of gallery.
const startPhotos = [1, 2, 3, 11, 5, 6, 7, 8, 9].map((n) => ({
    src: `/uploads/2026/03/Portraits_Wybrane_www_${n}.jpg`,
    srcSet: undefined as string | undefined,
}));
const bestOf = Array.from({ length: 47 }, (_, i) => {
    const base = `/media/portraits-wedding-gallery/${String(i + 1).padStart(2, '0')}`;
    return { src: `${base}-960.webp`, srcSet: `${base}-560.webp 560w, ${base}-960.webp 960w` };
});
const pool = [...startPhotos, ...bestOf];

const TILES = 9;
const HOLD = 1000; // roughly how long each photo stays
const JITTER = 450; // ± spread so tiles fall out of step
const TICK = 110;
const MAX_PER_TICK = 2;

const shuffle = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

type Layer = { photo: number; previous: number | null; key: number };

/**
 * A 3×3 photo grid whose tiles change on their own clocks: a couple at a time,
 * scattered at random, each photo for about a second.
 */
export function WeddingGalleryShuffle() {
    const gridRef = useRef<HTMLDivElement>(null);
    const [tiles, setTiles] = useState<Layer[]>(() => startPhotos.map((_, i) => ({ photo: i, previous: null, key: i })));
    const tilesRef = useRef(tiles);
    tilesRef.current = tiles;

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const wide = window.matchMedia('(min-width: 768px)');
        let visible = false;
        let keyCounter = TILES;
        const now = performance.now();
        // Each tile gets its own first deadline so they never start in sync.
        const due = Array.from({ length: TILES }, () => now + 600 + Math.random() * 1600);
        const pending = new Set<number>();
        let bag: number[] = [];

        const nextPhoto = () => {
            const showing = new Set(tilesRef.current.map((tile) => tile.photo));
            for (let attempt = 0; attempt < pool.length * 2; attempt++) {
                if (!bag.length) bag = shuffle(pool.map((_, i) => i));
                const candidate = bag.pop()!;
                if (!showing.has(candidate)) return candidate;
            }
            return null;
        };

        const change = (index: number, at: number) => {
            const photo = nextPhoto();
            if (photo === null) return;
            pending.add(index);
            due[index] = at + HOLD + (Math.random() * 2 - 1) * JITTER;
            const image = new Image();
            const { src, srcSet } = pool[photo];
            if (srcSet) {
                image.sizes = wide.matches ? '(min-width: 1500px) 480px, 31vw' : '92vw';
                image.srcset = srcSet;
            }
            image.src = src;
            // Only cross-fade once the next photo is decoded, so a tile never blinks empty.
            image.decode().catch(() => undefined).then(() => {
                pending.delete(index);
                setTiles((current) => current.map((tile, i) => (i === index ? { photo, previous: tile.photo, key: ++keyCounter } : tile)));
            });
        };

        const tick = () => {
            if (!visible || document.hidden || reduced.matches) return;
            const at = performance.now();
            // Tiles past their deadline change in random order, at most two per tick;
            // the rest roll over to the next tick, which keeps the grid out of step.
            const chosen = shuffle(Array.from({ length: TILES }, (_, i) => i))
                .filter((i) => due[i] <= at && !pending.has(i))
                .slice(0, MAX_PER_TICK);
            chosen.forEach((index) => change(index, at));
        };

        const timer = window.setInterval(tick, TICK);
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '100px 0px' });
        observer.observe(grid);
        return () => {
            window.clearInterval(timer);
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={gridRef} className="wedding-shuffle grid gap-4 md:grid-cols-3">
            {tiles.map((tile, index) => {
                const { src, srcSet } = pool[tile.photo];
                const previous = tile.previous === null ? null : pool[tile.previous];
                return (
                    <div key={index} className="wedding-shuffle__tile relative aspect-[3/2] overflow-hidden border border-white/5 bg-[#050505]">
                        {previous && (
                            <img
                                src={previous.src}
                                srcSet={previous.srcSet}
                                sizes="(min-width: 1500px) 480px, (min-width: 768px) 31vw, 92vw"
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full object-cover grayscale"
                            />
                        )}
                        {/* Keyed by change so the new photo fades in over the previous one. */}
                        <img
                            key={tile.key}
                            src={src}
                            srcSet={srcSet}
                            sizes="(min-width: 1500px) 480px, (min-width: 768px) 31vw, 92vw"
                            alt="Fotostacja ślubna - portret z galerii"
                            loading={index < 3 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="wedding-shuffle__image absolute inset-0 h-full w-full object-cover grayscale"
                        />
                    </div>
                );
            })}
        </div>
    );
}
