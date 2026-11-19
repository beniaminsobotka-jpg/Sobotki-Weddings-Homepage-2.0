import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './portrait-style-picker.css';

const styles = [
    { key: 'classic', label: 'Klasyczna', title: 'Fotostacja klasyczna', text: 'Ponadczasowe portrety na białym tle ze studyjnym oświetleniem.' },
    { key: 'spotlight', label: 'Filmowe kółko', title: 'Filmowe kółko', text: 'Opcja do fotostacji klasycznej w stylu Jamesa Bonda — portret w kręgu światła.' },
    { key: 'editorial', label: 'Edytorialna', title: 'Fotostacja edytorialna', text: 'Miękkie światło na tle z tkaninami. Zdjęcia jak z Vogue.' },
];

const FRAMES = [1, 2, 3];
const START_OFFSET = 1; // opens with the second (strongest) photo in front
const COMMIT_AT = 0.28; // share of a card step the finger must travel to rotate the fan
const photo = (key: string, n: number, size: 480 | 840) => `/media/portraits-wedding-styles/${key}-${n}-${size}.webp`;

/**
 * A light tap of haptic feedback. Android supports the Vibration API; iOS Safari
 * does not, but toggling a native switch control produces the system haptic (iOS 18+).
 */
let hapticSwitch: HTMLLabelElement | null = null;
const haptic = () => {
    if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
        return;
    }
    if (!hapticSwitch) {
        hapticSwitch = document.createElement('label');
        hapticSwitch.setAttribute('aria-hidden', 'true');
        hapticSwitch.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        input.tabIndex = -1;
        hapticSwitch.appendChild(input);
        document.body.appendChild(hapticSwitch);
    }
    hapticSwitch.click();
};

/** Where a card sits in the fan: 0 centre, -1 left, 1 right; wraps so cards loop round behind. */
const slotOf = (frame: number, offset: number, drag: number) => {
    let slot = ((frame - offset + 4) % 3) - 1 + drag;
    if (slot > 1.5) slot -= 3;
    if (slot < -1.5) slot += 3;
    return slot;
};

/** Three-way style switcher with a fan of example portraits you can spin with a finger. */
export function PortraitStylePicker() {
    const [active, setActive] = useState(0);
    const [offset, setOffset] = useState(START_OFFSET);
    const [drag, setDrag] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [narrow, setNarrow] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const fanRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
    const gesture = useRef<{ id: number; x: number; y: number; step: number; horizontal: boolean | null; moved: boolean; crossed: boolean } | null>(null);
    const style = styles[active];

    const select = (index: number, focus = false) => {
        const next = (index + styles.length) % styles.length;
        setActive(next);
        setOffset(START_OFFSET);
        setDrag(0);
        if (focus) tabsRef.current[next]?.focus();
    };

    const rotate = (by: number) => {
        setOffset((current) => (current + by + 3) % 3);
        haptic();
    };

    useEffect(() => {
        const query = window.matchMedia('(max-width: 767px)');
        const update = () => setNarrow(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    // Warm every style's photos once the section is near, so switching never shows an empty fan.
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            const size = window.innerWidth < 768 ? 480 : 840;
            styles.forEach(({ key }) => FRAMES.forEach((n) => { new Image().src = photo(key, n, size); }));
            observer.disconnect();
        }, { rootMargin: '600px 0px' });
        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
        const moves: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: styles.length - 1 };
        if (!(event.key in moves)) return;
        event.preventDefault();
        select(moves[event.key], true);
    };

    const onFanKey = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        rotate(event.key === 'ArrowRight' ? 1 : -1);
    };

    // The cards follow the finger horizontally; vertical movement stays page scroll.
    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const card = fanRef.current?.querySelector('img');
        gesture.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            step: (card?.getBoundingClientRect().width ?? 240) * 0.8,
            horizontal: null,
            moved: false,
            crossed: false,
        };
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const g = gesture.current;
        if (!g || g.id !== event.pointerId) return;
        const dx = event.clientX - g.x;
        const dy = event.clientY - g.y;
        if (g.horizontal === null) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            g.horizontal = Math.abs(dx) > Math.abs(dy);
            if (!g.horizontal) {
                gesture.current = null;
                return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
        }
        g.moved = true;
        const next = Math.max(-1, Math.min(1, dx / g.step));
        // A tick as the next card passes the point where letting go would land it in front.
        if (Math.abs(next) >= COMMIT_AT !== g.crossed) {
            g.crossed = !g.crossed;
            if (g.crossed) haptic();
        }
        setDrag(next);
    };

    const endGesture = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
        const g = gesture.current;
        if (!g || g.id !== event.pointerId) return;
        gesture.current = null;
        setDragging(false);
        if (!g.moved) return;
        if (!cancelled && Math.abs(drag) >= COMMIT_AT) {
            // Dragging right pulls the left card into the centre, and vice versa.
            setOffset((current) => (current + (drag > 0 ? -1 : 1) + 3) % 3);
        }
        setDrag(0);
        // Swallow the click that follows a drag so it does not also rotate the fan.
        const swallow = (click: MouseEvent) => { click.stopPropagation(); click.preventDefault(); };
        window.addEventListener('click', swallow, { capture: true, once: true });
        window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
    };

    const spread = narrow ? 40 : 46;
    const shrink = narrow ? 0.14 : 0.12;

    return (
        <section className="style-picker" ref={sectionRef} aria-labelledby="style-picker-title">
            <header className="style-picker__head">
                <p className="style-picker__kicker"><span aria-hidden="true" /> Trzy style</p>
                <h2 id="style-picker-title" className="font-serif font-black uppercase">
                    Wybierz <em className="font-playfair-italic font-light lowercase">swoje światło.</em>
                </h2>
            </header>

            <div
                className="style-picker__seg"
                role="tablist"
                aria-label="Styl fotostacji"
                style={{ '--i': active } as CSSProperties}
                onKeyDown={onTabKey}
            >
                <span className="style-picker__thumb" aria-hidden="true" />
                {styles.map((item, index) => (
                    <button
                        key={item.key}
                        ref={(node) => { tabsRef.current[index] = node; }}
                        type="button"
                        role="tab"
                        id={`style-tab-${item.key}`}
                        aria-selected={active === index}
                        aria-controls="style-picker-panel"
                        tabIndex={active === index ? 0 : -1}
                        onClick={() => select(index)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="style-picker__panel" id="style-picker-panel" role="tabpanel" aria-labelledby={`style-tab-${style.key}`}>
                <div
                    className="style-picker__stage"
                    tabIndex={0}
                    aria-label="Przykładowe zdjęcia. Strzałki w lewo i prawo obracają karty."
                    onKeyDown={onFanKey}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={(event) => endGesture(event)}
                    onPointerCancel={(event) => endGesture(event, true)}
                >
                    {/* Keyed by style so the fan replays its entrance on every switch. */}
                    <div className="style-picker__fan" ref={fanRef} key={style.key} data-dragging={dragging}>
                        {FRAMES.map((n) => {
                            const slot = slotOf(n - 1, offset, drag);
                            const distance = Math.abs(slot);
                            return (
                                <img
                                    key={n}
                                    src={photo(style.key, n, 840)}
                                    srcSet={`${photo(style.key, n, 480)} 480w, ${photo(style.key, n, 840)} 840w`}
                                    sizes="(max-width: 767px) 60vw, 320px"
                                    alt={`${style.title} — przykład ${n}`}
                                    decoding="async"
                                    draggable={false}
                                    className={distance > 0.5 ? 'is-side' : undefined}
                                    style={{
                                        '--n': n,
                                        transform: `translateX(calc(-50% + ${slot * spread}%)) rotate(${slot * 6}deg) scale(${1 - Math.min(distance, 1) ** 2 * shrink})`,
                                        zIndex: Math.round(30 - distance * 10),
                                        opacity: Math.max(0, Math.min(1, 1 - (distance - 1) * 2)),
                                    } as CSSProperties}
                                    // Tapping a side card spins it to the front.
                                    onClick={distance > 0.5 ? () => rotate(slot < 0 ? -1 : 1) : undefined}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="style-picker__info">
                    <div className="style-picker__text" key={`${style.key}-text`} aria-live="polite">
                        <h3 className="font-serif font-black uppercase">{style.title}</h3>
                        <p>{style.text}</p>
                    </div>
                    <div className="style-picker__nav">
                        <button type="button" onClick={() => select(active - 1)} aria-label={`Poprzedni styl: ${styles[(active + 2) % 3].label}`}>
                            <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                        <div className="style-picker__dots" aria-hidden="true">
                            {styles.map((item, index) => (
                                <span key={item.key} data-active={index === active} />
                            ))}
                        </div>
                        <button type="button" onClick={() => select(active + 1)} aria-label={`Następny styl: ${styles[(active + 1) % 3].label}`}>
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <p className="style-picker__hint" aria-hidden="true">Przesuń zdjęcia palcem, aby je obrócić</p>
                </div>
            </div>
        </section>
    );
}
