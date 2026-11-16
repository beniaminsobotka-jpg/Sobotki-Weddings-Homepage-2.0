import { useEffect, useRef, useState } from 'react';
import { portraitsData } from './PortraitMasonry';

const scenes = [
    [12, 79],
    [29, 35],
    [77, 7],
    [19, 48],
].map(([wideId, tallId]) => ({
    wide: portraitsData.find((photo) => photo.id === wideId)!,
    tall: portraitsData.find((photo) => photo.id === tallId)!,
}));

export function PortraitHeroBackdrop() {
    const backdropRef = useRef<HTMLDivElement>(null);
    const [scene, setScene] = useState({ current: 0, previous: -1 });

    useEffect(() => {
        const backdrop = backdropRef.current!;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        let next = 1;
        let loading = false;
        let stopped = false;

        const advance = async () => {
            const bounds = backdrop.getBoundingClientRect();
            if (loading || reduced.matches || document.hidden || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;

            const index = next;
            next = (next + 1) % scenes.length;
            const image = backdrop.children[index].querySelector('img')!;
            loading = true;
            try {
                // Never reveal a frame before its responsive source has decoded.
                await image.decode();
                if (!stopped && !reduced.matches) {
                    setScene((old) => index === old.current ? old : { current: index, previous: old.current });
                }
            } catch {
                // Keep the current scene if one of the next photos is unavailable.
            } finally {
                loading = false;
            }
        };

        const timer = window.setInterval(advance, 1000);
        return () => {
            stopped = true;
            window.clearInterval(timer);
        };
    }, []);

    return (
        <div className="portraits-hero__backdrop" ref={backdropRef} aria-hidden="true">
            {scenes.map(({ wide, tall }, index) => (
                <picture
                    className="portraits-hero__photos"
                    key={wide.id}
                    data-scene={index === scene.current ? 'current' : index === scene.previous ? 'previous' : 'waiting'}
                >
                    <source media="(max-width: 639px)" srcSet={tall.src} />
                    <img src={wide.src} alt="" decoding="async" fetchPriority={index === 0 ? 'high' : 'low'} />
                </picture>
            ))}
        </div>
    );
}
