import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Camera, Check, Clock, Heart, Printer, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const galleryImages = [
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Basia-x-Szymon_-2-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Kamila-x-Konrad_-76-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2025/07/IsmenaxTomasz_Fotostacja_-37-1024x683.avif',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Marta-x-Alfred_-124-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2025/07/OlgaxFranek_Fotostacja_-136-1024x683.avif',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Kamila-x-Konrad_-54-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2025/07/IsmenaxTomasz_Fotostacja_-134-e1752095442720-1024x789.avif',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Basia-x-Szymon_-22-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Marta-x-Alfred_-42-1024x683.webp',
];

export const PortraitsStationaryPage: React.FC = () => {
  const navigate = useNavigate();

  const galleryColumns = useMemo(
    () => [
      galleryImages.filter((_, index) => index % 3 === 0),
      galleryImages.filter((_, index) => index % 3 === 1),
      galleryImages.filter((_, index) => index % 3 === 2),
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#050505] pt-32 text-brand-black selection:bg-white selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.05),transparent_20%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-24 px-4 pb-24 md:px-8 md:pb-32">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#090909] border border-white/5 text-[#F3F2ED] shadow-2xl">
          <img
            src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/AgnieszkaxJakub_Fotostacja_-119-min-1024x683.avif"
            alt="Fotostacja stacjonarna hero"
            className="absolute inset-0 h-full w-full object-cover filter grayscale contrast-110 opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="relative grid min-h-[92vh] md:min-h-[84vh] gap-0 md:gap-12 px-6 pb-6 pt-10 md:px-10 md:py-14 lg:grid-cols-[1fr_1fr] lg:items-end lg:px-14 lg:py-16">
            
            {/* Left side - Title and Text */}
            <div className="max-w-3xl flex flex-col justify-end pt-40 mt-32 md:mt-0 lg:pt-32">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md self-start">
                <Star size={12} className="fill-white text-white" />
                <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-white/80">
                  Sobotki Portraits / Stacjonarna
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-[11vw] sm:text-6xl font-black leading-[0.84] tracking-tight text-white md:text-8xl lg:text-[7rem] flex flex-col items-start"
              >
                <span className="uppercase">Fotostacja</span>
                <span className="font-playfair-italic font-light text-[#d42929] -mt-1 md:-mt-6 lg:-mt-8">
                  w Gliwicach
                </span>
              </motion.h1>

              <p className="mt-6 max-w-xl font-sans text-sm leading-8 text-gray-400 md:text-base">
                Nie musisz czekać na wesele ani firmowy event, żeby skorzystać z naszej Fotostacji – teraz jesteśmy dostępni na co dzień! Uruchomiliśmy fotostację stacjonarną, gdzie możesz przyjść z rodziną, partnerem lub samodzielnie, aby wykonać elegancki, czarno-biały portret w minimalistycznym stylu.
              </p>
            </div>

            {/* Right side - Buttons */}
            <div className="flex flex-col lg:items-end justify-end pb-2 lg:pb-0 -mt-2 md:mt-0 w-full">
              <div className="flex flex-col sm:flex-row gap-4 justify-start lg:justify-end w-full sm:w-auto">
                <a
                  href="https://calendly.com/sobotki-portraits/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex justify-center group items-center gap-3 rounded-full bg-white px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-200"
                >
                  Zapisz się online
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>

                <button
                  onClick={() => {
                      navigate('/portraits');
                      window.scrollTo(0,0);
                  }}
                  className="hidden sm:flex justify-center items-center rounded-full border border-white/20 bg-transparent px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-white/5"
                >
                  Wszystkie usługi
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* INFO CARDS */}
        <section className="grid gap-8 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[0.92fr_1.08fr] lg:items-center md:px-10 md:py-14">
          <div className="rounded-[24px] border border-white/10 bg-black/40 p-8 md:p-10">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Szybka sesja studyjna
            </span>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white">
              Portret 
              <span className="ml-2 font-playfair-italic lowercase text-[#d42929]">
                w 15 minut
              </span>
            </h2>
            <div className="mt-8 space-y-5 font-sans text-sm md:text-base leading-relaxed text-gray-400">
              <p>
                To szybka, kameralna sesja zdjęciowa w naszym studiu, która trwa zaledwie 15–20 minut, a mimo to pozwala uchwycić piękne, dopracowane kadry.
              </p>
              <p>
                Nie pozujesz sztucznie – tylko przychodzisz i jesteś sobą. My zadbamy o światło, kadry i retusz.
              </p>
              <p>
                W tym czasie robimy kilka portretów, które następnie selekcjonujemy i drukujemy na miejscu. Dzięki temu wychodzisz z gotowymi odbitkami w ręku – w formacie 10×15 cm lub 15×23 cm – zapakowanymi w naszą charakterystyczną, czerwoną kopertę.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: Clock,
                title: 'Krótki format',
                text: 'Bez zmęczenia i sztucznego pozowania, sesja trwa krótko i przebiega w luźnej atmosferze.',
              },
              {
                icon: Heart,
                title: 'Ponadczasowość',
                text: 'Piękne, czarno-białe zdjęcia, które będą miały jeszcze większą wartość za 5, 10 czy 30 lat.',
              },
              {
                icon: Printer,
                title: 'Odbitki od ręki',
                text: 'Wychodzisz ze studia z gotowymi, fantastycznie opakowanymi fizycznymi zdjęciami.',
              },
              {
                icon: Users,
                title: 'Pokolenia',
                text: 'Od par na rocznicę, przez maluchy, aż po portrety dziadków z wnukami.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="rounded-[24px] border border-white/5 bg-[#0a0a0a] p-6 text-white"
              >
                <div className="p-3 bg-white/5 inline-block rounded-full mb-4">
                   <item.icon size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-2xl mb-2">{item.title}</h3>
                <p className="font-sans text-sm leading-relaxed text-gray-400">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* DLA KOGO ORAZ JAK SIĘ ZAPISAĆ */}
        <section className="grid gap-10 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[1fr_1fr] md:px-10 md:py-14">
            <div className="rounded-[24px] border border-white/5 bg-[#0a0a0a] p-8 md:p-10">
              <div className="mb-6 inline-flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                  <Star size={14} className="text-[#d42929]" />
                </div>
                <h3 className="font-serif text-3xl text-gray-200">Dla kogo?</h3>
              </div>
              <div className="space-y-4">
                {[
                    'Dla rodzin z dziećmi',
                    'Dla par, narzeczonych i małżeństw',
                    'Dla osób starszych – np. portret z wnukami',
                    'Na rocznice, urodziny i Dzień Babci / Mamy',
                    'Dla każdego, kto chce mieć ponadczasowe zdjęcie'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-4 text-gray-400">
                    <Check size={18} className="mt-[2px] shrink-0 text-white/40" />
                    <p className="font-sans text-[15px] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/40 p-8 md:p-10 shadow-2xl flex flex-col justify-center">
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 mb-4 block">
                Zasady
              </span>
              <h3 className="font-serif text-3xl md:text-5xl text-white mb-6 uppercase">
                Tylko po
                <span className="ml-2 font-playfair-italic lowercase text-[#d42929]">
                    umówieniu
                </span>
              </h3>
              <p className="font-sans text-gray-400 text-sm md:text-base leading-relaxed mb-8">
                Aby zapewnić komfort, sesje odbywają się <strong>wyłącznie po wcześniejszym umówieniu się</strong> w półgodzinnych blokach czasowych. Dzięki temu każdy gość ma czas dla siebie, nie ma pośpiechu, a my pracujemy w kameralnej atmosferze. Po zapisaniu otrzymasz maila z instrukcją co wziąć i w co się ubrać.
              </p>
              <a
                href="https://calendly.com/sobotki-portraits/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="self-start rounded-full bg-white px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:bg-gray-200 inline-flex items-center gap-3"
              >
                  Wybierz termin na Calendly
                  <ArrowUpRight size={16} />
              </a>
            </div>
        </section>

        {/* GALERIA */}
        <section className="overflow-hidden rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl md:px-10 md:py-14">
          <div className="mb-12 max-w-2xl">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Galeria</span>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white">
              Minimalizm
              <span className="ml-3 font-playfair-italic lowercase text-[#d42929]">
                i emocja
              </span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {galleryColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="grid gap-4">
                {column.map((src, imageIndex) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.6, delay: imageIndex * 0.06 }}
                    className="overflow-hidden bg-[#050505] border border-white/5"
                  >
                    <img
                      src={src}
                      alt="Fotostacja stacjonarna - galeria"
                      className="w-full object-cover grayscale transition-all duration-700 hover:scale-[1.02] hover:grayscale-0"
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM LINKS */}
        <section className="grid gap-6 md:grid-cols-2">
          {[
            {
              eyebrow: 'Dla nowożeńców',
              title: 'Fotostacja Ślubna',
              subtitle: 'Luksusowe portrety weselne',
              href: '/portraits/wedding',
            },
            {
              eyebrow: 'Wizerunek z klasą',
              title: 'Fotostacja Eventowa',
              subtitle: 'Doświadczenie premium dla firm',
              href: '/portraits/event',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-white/5 bg-[#111] p-8 text-white shadow-2xl cursor-pointer hover:bg-[#1a1a1a] transition-colors group" onClick={() => {
                navigate(item.href);
                window.scrollTo(0,0);
            }}>
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-gray-500">{item.eyebrow}</span>
              <h3 className="mt-5 font-serif text-3xl">{item.title}</h3>
              <p className="mt-2 font-playfair-italic text-xl text-gray-400 mb-8">{item.subtitle}</p>
              <div className="flex items-center gap-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 transition-colors duration-300 group-hover:text-white">
                Zobacz
                <ArrowUpRight size={15} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
