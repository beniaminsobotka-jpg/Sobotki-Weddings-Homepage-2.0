import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

const frameNumbers = [1, 2, 3];
const portraitStyles = [
  {
    key: 'classic',
    title: 'Fotostacja klasyczna',
    description: 'Klasyczne, ponadczasowe zdjęcia na białym tle ze studyjnym oświetleniem.',
    position: 'center 34%',
    alts: ['Roześmiana gościni na białym tle', 'Trzy osoby na bliskim portrecie na białym tle', 'Para pozuje przy fotelu na białym tle'],
  },
  {
    key: 'spotlight',
    title: 'Filmowe kółko',
    description: 'Opcja do fotostacji klasycznej w stylu Jamesa Bonda!',
    position: 'center 40%',
    alts: ['Para pozuje w kręgu światła', 'Dwie gościnie posyłają pocałunki w kręgu światła', 'Gość w garniturze poprawia krawat w kręgu światła'],
  },
  {
    key: 'editorial',
    title: 'Fotostacja edytorialna',
    description: 'Miękkie światło na tle z tkaninami. Zdjęcia jak z Vogue!',
    position: 'center 33%',
    alts: ['Gość w okularach pozuje na tle tkanin', 'Uśmiechnięta para na tle draperii', 'Gość w garniturze i okularach na tle draperii'],
  },
];

export function WeddingPortraitStyles() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [slide, setSlide] = useState({ current: 1, previous: 0 });

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || reduceMotion) return;
    // On mobile the cards form a longer stack. Load the entire set once any
    // card is visible so an off-screen lazy image cannot block the shared clock.
    sectionRef.current?.querySelectorAll('img').forEach((image) => { image.loading = 'eager'; });
    const next = (slide.current % frameNumbers.length) + 1;
    let cancelled = false;
    let decoding = false;
    const timer = window.setInterval(async () => {
      if (document.hidden || decoding) return;
      const images = sectionRef.current?.querySelectorAll<HTMLImageElement>(`img[data-frame="${next}"]`);
      if (!images?.length) return;
      decoding = true;
      try {
        await Promise.all(Array.from(images, (image) => image.decode()));
        if (!cancelled) setSlide({ current: next, previous: slide.current });
      } catch {
        // Leave the last complete row on screen if an incoming image fails.
      } finally {
        decoding = false;
      }
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [paused, reduceMotion, slide.current, visible]);

  return (
    <section
      ref={sectionRef}
      id="style-fotostacji"
      aria-labelledby="wedding-portrait-styles-title"
      className="scroll-mt-28 text-white md:rounded-[30px] md:border md:border-white/5 md:bg-[#111] md:px-10 md:py-14 md:shadow-2xl"
    >
      <div className="mb-6 flex items-end justify-between gap-4 px-2 md:mb-9 md:px-0">
        <h2 id="wedding-portrait-styles-title" className="font-serif text-3xl uppercase leading-[0.93] sm:text-4xl md:text-5xl">
          Trzy style <span className="font-playfair-italic lowercase text-[#ff0000]">fotostacji.</span>
        </h2>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? 'Wznów zmianę zdjęć' : 'Wstrzymaj zmianę zdjęć'}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hidden"
        >
          {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {portraitStyles.map((style) => (
          <figure key={style.key} className="min-w-0 rounded-[24px] border border-white/5 bg-[#111] p-3 pb-5 md:rounded-none md:border-0 md:bg-transparent md:p-0">
            <div className="relative isolate aspect-[4/3] overflow-hidden rounded-[16px] bg-[#1a1a1a] ring-1 ring-inset ring-white/10 md:aspect-square md:rounded-[18px]">
              {frameNumbers.map((number) => {
                const active = number === slide.current;
                const stem = `/media/portraits-wedding-styles/${style.key}-${number}`;
                return (
                  <img
                    key={number}
                    data-frame={number}
                    data-active={active ? 'true' : undefined}
                    src={`${stem}-480.webp`}
                    srcSet={`${stem}-480.webp 480w, ${stem}-840.webp 840w`}
                    sizes={style.key === 'spotlight' && number < 3
                      ? '(min-width: 1500px) 655px, (min-width: 768px) 44vw, 110vw'
                      : '(min-width: 1500px) 435px, (min-width: 768px) 29vw, 90vw'}
                    alt={style.alts[number - 1]}
                    aria-hidden={!active}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: style.key === 'classic' ? `center ${number === 3 ? 12 : 20}%` : style.position }}
                    className={`absolute inset-0 h-full w-full object-cover ${active ? 'z-20 opacity-100 transition-opacity duration-300 motion-reduce:transition-none' : number === slide.previous ? 'z-10 opacity-100' : 'opacity-0'}`}
                  />
                );
              })}
            </div>
            <figcaption className="px-2 pt-4 md:px-0">
              <h3 className="text-balance font-serif text-2xl leading-[1.1] lg:text-3xl">
                {style.title}
              </h3>
              <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-gray-300 md:max-w-xs md:text-base">
                {style.description}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
