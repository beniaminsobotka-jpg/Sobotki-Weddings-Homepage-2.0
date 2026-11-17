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
      className="scroll-mt-28 rounded-[24px] border border-white/5 bg-[#111] px-3 py-8 text-white shadow-2xl sm:rounded-[30px] sm:px-6 md:px-10 md:py-14"
    >
      <div className="mb-6 flex items-end justify-between gap-3 md:mb-9">
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
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
        {portraitStyles.map((style) => (
          <figure key={style.key} className="min-w-0">
            <div className="relative isolate aspect-square overflow-hidden rounded-[10px] bg-[#1a1a1a] ring-1 ring-inset ring-white/10 md:rounded-[18px]">
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
                      ? '(min-width: 1500px) 655px, (min-width: 768px) 44vw, 45vw'
                      : '(min-width: 1500px) 435px, (min-width: 768px) 29vw, 30vw'}
                    alt={style.alts[number - 1]}
                    aria-hidden={!active}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: style.position }}
                    className={`absolute inset-0 h-full w-full object-cover ${active ? 'z-20 opacity-100 transition-opacity duration-300 motion-reduce:transition-none' : number === slide.previous ? 'z-10 opacity-100' : 'opacity-0'}`}
                  />
                );
              })}
            </div>
            <figcaption className="pt-3 sm:pt-4">
              <h3 className="min-h-[2.2em] text-balance font-serif text-[13px] leading-[1.1] sm:text-lg md:min-h-0 md:text-2xl lg:text-3xl">
                {style.title}
              </h3>
              <p className="mt-1.5 hyphens-auto font-sans text-[11px] leading-[1.45] text-gray-300 [overflow-wrap:anywhere] sm:text-sm md:mt-2 md:max-w-xs md:text-base">
                {style.description}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
