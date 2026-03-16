import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const About: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section id="o-nas" className="py-8 md:py-24 bg-brand-paper relative overflow-hidden px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Sekcji - Mobilny (na desktopie jest w środkowej kolumnie) */}
        <div className="md:hidden text-center mb-4">
            <h2 className="font-serif font-black text-5xl uppercase tracking-tighter">
                Ania & Benek
            </h2>
            <p className="font-playfair-italic text-gray-500 mt-2">Duet w życiu i w pracy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 lg:gap-12 items-stretch">
          
          {/* KOLUMNA LEWA - ANIA */}
          <motion.article 
            className="group relative aspect-[4/5] md:aspect-auto md:h-full overflow-hidden rounded-[30px] shadow-lg cursor-pointer"
            initial="initial"
            whileHover="hover"
          >
             {/* Image Layer */}
             <motion.div 
                className="absolute inset-0 w-full h-full"
                variants={{
                    initial: { scale: 1 },
                    hover: { scale: 1.05 }
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <img 
                    src="/uploads/2026/03/O-Nas_compressed_1.webp" 
                    alt="Ania, fotografka i współtwórczyni Sobotki Weddings" 
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    className="w-full h-full object-cover grayscale md:grayscale-0 transition-all duration-700 md:group-hover:grayscale-[0.5]"
                />
            </motion.div>

            {/* Liquid Glass Card */}
            {/* Mobile: Scroll Reveal | Desktop: Hover Reveal */}
            <motion.div 
                className="absolute bottom-2 left-2 right-2 md:bottom-6 md:left-6 md:right-6"
                {...(isMobile 
                    ? {
                        initial: { opacity: 0, y: 30 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true, margin: "-10%" },
                        transition: { duration: 0.6, delay: 0.1 }
                      }
                    : {
                        variants: {
                            initial: { opacity: 0, y: 20 },
                            hover: { opacity: 1, y: 0 }
                        },
                        transition: { duration: 0.4, ease: "easeOut" }
                      }
                )}
            >
                <div className="liquid-glass backdrop-blur-xl bg-white/30 border border-white/40 p-4 rounded-2xl shadow-lg">
                    <div className="flex flex-col items-start mb-3">
                        <h3 className="font-serif font-black text-2xl md:text-3xl uppercase text-brand-black leading-none mb-1">Ania</h3>
                        <p className="font-sans text-[9px] uppercase tracking-widest text-brand-black/60 font-bold">Fotograf</p>
                    </div>
                    <p className="font-serif italic text-xs md:text-sm leading-relaxed text-brand-black/80">
                        Ta, która dba o atmosferę i drobne rzeczy, które robią wielką różnicę. Miłośniczka dobrej kawy z przelewu i rozmów — zwłaszcza tych o swoim synu. Przy niej łatwo zapomnieć o stresie i być sobą.
                    </p>
                </div>
            </motion.div>
          </motion.article>


          {/* KOLUMNA ŚRODKOWA - WSPÓLNE (STATYCZNE) */}
          <div className="flex flex-col justify-center items-center text-center py-0 md:py-0 order-first md:order-none pb-1 md:pb-0">
             
             {/* Desktop Header */}
             <div className="hidden md:block mb-6 md:mb-8">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center leading-none"
                >
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-3">Poznajcie Nas</span>
                    <span className="font-serif font-black text-5xl lg:text-7xl uppercase tracking-tighter text-brand-black">
                        Razem
                    </span>
                    <span className="font-playfair-italic font-light text-4xl lg:text-6xl text-gray-500 -mt-2 md:-mt-3">
                        Tworzymy
                    </span>
                </motion.h2>
             </div>

             {/* Zdjęcie środkowe - Zmniejszone (85% szerokości na desktopie) */}
             <div className="relative w-[90%] md:w-[85%] aspect-[4/5] mb-5 md:mb-8 overflow-hidden rounded-2xl shadow-xl mx-auto">
                <img 
                    src="/uploads/2026/03/O-Nas_compressed_2.webp" 
                    alt="Ania i Benek, duet Sobotki Weddings" 
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    className="w-full h-full object-cover"
                />
             </div>

             {/* Opis wspólny */}
             <div className="max-w-md px-4 pb-2 md:pb-0">
                <p className="font-serif text-sm md:text-base leading-relaxed text-brand-black/80">
                   Jesteśmy nierozłącznym duetem już od 14 lat. Kochamy dobry design, harmonię i spokój w życiu, nasze dziecko, psiecko oraz tworzenie dla Was autentycznych zdjęć i filmów pełnych emocji!
                </p>
                <div className="w-12 h-[1px] bg-brand-black/20 mx-auto mt-4 md:mt-6"></div>
             </div>
          </div>


          {/* KOLUMNA PRAWA - BENEK */}
          <motion.article 
            className="group relative aspect-[4/5] md:aspect-auto md:h-full overflow-hidden rounded-[30px] shadow-lg cursor-pointer"
            initial="initial"
            whileHover="hover"
          >
            {/* Image Layer */}
            <motion.div 
                className="absolute inset-0 w-full h-full"
                variants={{
                    initial: { scale: 1 },
                    hover: { scale: 1.05 }
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <img 
                    src="/uploads/2026/03/O-Nas_compressed_3.webp" 
                    alt="Benek, filmowiec i współtwórca Sobotki Weddings" 
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    className="w-full h-full object-cover grayscale md:grayscale-0 transition-all duration-700 md:group-hover:grayscale-[0.5]"
                />
            </motion.div>
            
            {/* Liquid Glass Card */}
            {/* Mobile: Scroll Reveal | Desktop: Hover Reveal */}
            <motion.div 
                className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6"
                {...(isMobile 
                    ? {
                        initial: { opacity: 0, y: 30 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true, margin: "-10%" },
                        transition: { duration: 0.6, delay: 0.2 }
                      }
                    : {
                        variants: {
                            initial: { opacity: 0, y: 20 },
                            hover: { opacity: 1, y: 0 }
                        },
                        transition: { duration: 0.4, ease: "easeOut" }
                      }
                )}
            >
                <div className="liquid-glass backdrop-blur-xl bg-white/30 border border-white/40 p-6 rounded-2xl shadow-lg">
                     <div className="flex flex-col items-start mb-3">
                        <h3 className="font-serif font-black text-2xl md:text-3xl uppercase text-brand-black leading-none mb-1">Benek</h3>
                        <div className="flex flex-col">
                            <p className="font-sans text-[9px] uppercase tracking-widest text-brand-black/60 font-bold">Filmowiec</p>
                            <p className="font-sans text-[7px] uppercase tracking-widest text-brand-black/40 font-bold mt-0.5">(nie mówić kamerzysta!)</p>
                        </div>
                    </div>
                    <p className="font-serif italic text-xs md:text-sm leading-relaxed text-brand-black/80">
                        Ten, który w duecie trzyma kamerę i składa historię w całość. Miłośnik burgerów i niewymuszonych emocji. Na ślubach najbardziej ceni luz, szczere chwile i dobrze zaopatrzony słodki stół.
                    </p>
                </div>
            </motion.div>
          </motion.article>

        </div>
      </div>
    </section>
  );
};
