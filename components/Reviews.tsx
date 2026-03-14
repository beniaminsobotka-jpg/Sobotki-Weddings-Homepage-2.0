import React from 'react';
import { Review } from '../types';
import { motion } from 'framer-motion';

const reviews: Review[] = [
  {
    name: "Adrianna",
    role: "Pani Młoda",
    date: "2023",
    video: "https://sobotkiweddings.pl/wp-content/uploads/2026/02/Na-strone-testimonal-1-Ada-i-Marcin.mp4",
    content: "Z całego serca mogę polecić wszystkim Sobotki Weddings! Beniamin towarzyszył nam z kamerą w naszym wyjątkowym dniu. Ma niezwykłą umiejętność - był obecny, ale nie nachalnie. Potrafi wyczarować cudowne kadry."
  },
  {
    name: "Aleksandra & Patryk",
    role: "Para Młoda",
    date: "Czerwiec 2023",
    video: "https://sobotkiweddings.pl/wp-content/uploads/2024/01/wycinek-1080.mov",
    content: "Ania i Benek to strzał w dziesiątkę! Życzliwi, pomocni, wykonują swoją pracę 'po cichu', łapiąc najbardziej wzruszające momenty. Dziękujemy za wspaniałe zdjęcia i film."
  },
  {
    name: "Weronika",
    role: "Pani Młoda",
    date: "2024",
    video: "https://sobotkiweddings.pl/wp-content/uploads/2026/02/Na-strone-testimonal-2-Weronika-x-Felix.mp4",
    content: "Zdjęcia i filmy są tak naturalne i takie nasze, lepiej nie moglibyśmy ich sobie wyobrazić. No dobra, może mają jedną wadę - oglądając je nie ma szans wyjść z tego o suchych policzkach…"
  }
];

const ReviewVideo: React.FC<{ src: string; title: string }> = ({ src, title }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '280px 0px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_38%,rgba(255,255,255,0)_70%)]"
    >
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${isReady ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-black/10" />
        <div className="absolute inset-0 noise-texture opacity-[0.05]" />
      </div>

      {shouldLoad ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedData={() => setIsReady(true)}
          className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[opacity,filter] duration-700 mix-blend-multiply ${
            isReady ? 'opacity-90' : 'opacity-0'
          }`}
        />
      ) : null}
    </div>
  );
};

export const Reviews: React.FC = () => {
  return (
    <section className="pt-8 pb-8 md:pt-16 md:pb-32 px-4 md:px-8 relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-3 md:mb-24">
          <h2 className="text-brand-black flex flex-col items-center leading-none gap-2">
            <span className="font-serif font-black uppercase text-5xl md:text-7xl scale-x-[1.32] origin-center inline-block drop-shadow-sm">
              Miłe
            </span>
            <span className="font-playfair-italic font-normal normal-case tracking-normal text-gray-500/80 text-5xl md:text-7xl">
              Słowa
            </span>
          </h2>
          <p className="mt-8 font-sans text-xs md:text-sm tracking-[0.15em] uppercase text-gray-500 max-w-2xl mx-auto leading-relaxed mix-blend-multiply">
            Jesteśmy dumni ze 100% zadowolenia naszych par.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-10 items-stretch">
          {reviews.map((review, i) => (
            <motion.article 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              // GLASS CARD STYLE
              className="flex h-full flex-col group p-3 md:p-6 rounded-3xl backdrop-blur-md bg-white/40 border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all duration-500 hover:-translate-y-2"
            >
              {/* Video Container */}
              <div className="w-full aspect-[4/3] relative overflow-hidden mb-2 md:mb-6 rounded-2xl bg-white/50">
                {review.video ? (
                  <ReviewVideo src={review.video} title={review.name} />
                ) : null}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 border-b border-brand-black/10 pb-2 md:mb-4 md:pb-4">
                    <h3 className="font-serif font-bold text-xl uppercase text-brand-black">{review.name}</h3>
                    <span className="font-sans text-[9px] uppercase tracking-widest text-gray-500 mt-1 md:mt-0">{review.role}</span>
                </div>
                
                <p className="font-playfair-italic text-lg text-brand-black/80 leading-relaxed">
                  "{review.content}"
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
