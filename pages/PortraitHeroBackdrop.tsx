import { useEffect, useRef, useState } from 'react';
import { portraitsData } from './PortraitMasonry';

const scenes = [
    [7, 29, 12],
    [79, 26, 71],
    [5, 96, 19],
].map((ids) => ids.map((id) => portraitsData.find((photo) => photo.id === id)!));

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
            const images = [...backdrop.children[index].querySelectorAll('img')]
                .filter((image) => image.getClientRects().length);
            loading = true;
            try {
                // Let the incoming photos decode before fading them over the previous scene.
                await Promise.all(images.map((image) => image.decode()));
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
            {scenes.map((photos, index) => (
                <div
                    className="portraits-hero__photos"
                    key={index}
                    data-scene={index === scene.current ? 'current' : index === scene.previous ? 'previous' : 'waiting'}
                >
                    {photos.map((photo) => (
                        <img
                            key={photo.id}
                            src={photo.thumbnail}
                            alt=""
                            decoding="async"
                            fetchPriority={index === 0 ? 'auto' : 'low'}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
