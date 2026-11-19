import { useState } from 'react';
import type { CSSProperties } from 'react';
import './portrait-style-picker.css';

const styles = [
    { key: 'classic', label: 'Klasyczna', title: 'Fotostacja klasyczna', text: 'Ponadczasowe portrety na białym tle ze studyjnym oświetleniem.' },
    { key: 'spotlight', label: 'Filmowe kółko', title: 'Filmowe kółko', text: 'Opcja do fotostacji klasycznej w stylu Jamesa Bonda — portret w kręgu światła.' },
    { key: 'editorial', label: 'Edytorialna', title: 'Fotostacja edytorialna', text: 'Miękkie światło na tle z tkaninami. Zdjęcia jak z Vogue.' },
];

/** Three-way style switcher: a sliding glass control and a fan of example portraits. */
export function PortraitStylePicker() {
    const [active, setActive] = useState(0);
    const style = styles[active];

    return (
        <section className="style-picker" aria-labelledby="style-picker-title">
            <header className="style-picker__head">
                <p className="style-picker__kicker"><span aria-hidden="true" /> Trzy style</p>
                <h2 id="style-picker-title" className="font-serif font-black uppercase">
                    Wybierz <em className="font-playfair-italic font-light lowercase">swoje światło.</em>
                </h2>
            </header>

            <div className="style-picker__seg" role="tablist" aria-label="Styl fotostacji" style={{ '--i': active } as CSSProperties}>
                <span className="style-picker__thumb" aria-hidden="true" />
                {styles.map((item, index) => (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        id={`style-tab-${item.key}`}
                        aria-selected={active === index}
                        aria-controls="style-picker-panel"
                        onClick={() => setActive(index)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="style-picker__panel" id="style-picker-panel" role="tabpanel" aria-labelledby={`style-tab-${style.key}`}>
                {/* Keyed by style so the fan replays its entrance on every switch. */}
                <div className="style-picker__fan" key={style.key}>
                    {[1, 2, 3].map((n) => (
                        <img
                            key={n}
                            src={`/media/portraits-wedding-styles/${style.key}-${n}-840.webp`}
                            srcSet={`/media/portraits-wedding-styles/${style.key}-${n}-480.webp 480w, /media/portraits-wedding-styles/${style.key}-${n}-840.webp 840w`}
                            sizes="(max-width: 767px) 50vw, 280px"
                            alt={`${style.title} — przykład ${n}`}
                            loading="lazy"
                            decoding="async"
                            style={{ '--n': n } as CSSProperties}
                        />
                    ))}
                </div>
                <div className="style-picker__text" key={`${style.key}-text`}>
                    <h3 className="font-serif font-black uppercase">{style.title}</h3>
                    <p>{style.text}</p>
                </div>
            </div>
        </section>
    );
}
