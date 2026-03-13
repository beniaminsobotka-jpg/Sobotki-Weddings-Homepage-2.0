import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const films = [
  {
    id: "-MYnjqez4kE",
    title: "Ada & Marcin",
    subtitle: "02.08.2025",
    date: "2024",
    description: "Ślub w stylu południowej siesty w hotelu Jakubus! Było wzruszająco, kolorowo i pięknie!",
    thumbnail: "https://sobotkiweddings.pl/wp-content/uploads/2026/03/AdaxMarcin-miniaturka-www.avif",
    videoScale: 3.2,
    startAt: 8
  },
  {
    id: "AbTSmEjpWmw",
    title: "Julia & Szymon",
    subtitle: "10.10.2025",
    date: "2024",
    description: "Dworzyszcze Wola wybrzmiało przepięknymi przysięgami Julii i Szymona. Miłość, którą czuć w każdym kadrze z tego dnia!",
    thumbnail: "https://sobotkiweddings.pl/wp-content/uploads/2026/03/JuliaxSzymon-miniaturka-www.avif",
    videoScale: 3.2
  },
  {
    id: "sZmDE76u_K8",
    title: "Agnieszka & Chris",
    subtitle: "29.06.2024",
    date: "2024",
    description: "Międzynarodowe wesele polsko-norweskiej pary, która po 7 latach od poznania wraca do Krakowa, aby powiedzieć sobie magiczne \"tak\"",
    thumbnail: "https://sobotkiweddings.pl/wp-content/uploads/2026/03/AgnieszkaxChris-miniaturka-www.avif",
    videoScale: 3.5
  }
];

export const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section id="portfolio" className="py-8 md:py-32 bg-brand-paper px-4 md:px-8 relative overflow-hidden">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gray-200/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none mix-blend-multiply"></div>

        <div className="max-w-[1600px] mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 md:mb-24 relative z-10 gap-4 md:gap-16">
                <h2 className="flex flex-col leading-[0.85] shrink-0">
                    <span className="font-serif font-black text-6xl md:text-8xl uppercase tracking-tighter text-brand-black">
                        Wasze Historie
                    </span>
                    <span className="font-playfair-italic text-5xl md:text-7xl text-gray-400 ml-2 md:ml-4 mt-2">
                        na filmie
                    </span>
                </h2>
                
                <p className="font-sans text-sm md:text-base leading-relaxed text-brand-black/60 max-w-xl md:pt-4 md:border-l md:border-brand-black/10 md:pl-10">
                    Tworzymy dwa filmy ślubne: krótki film kreatywny (3–5 min) oraz dłuższy film rodzinny (15–20 min). Zależy nam, by opowiadały nie tylko o samym dniu ślubu, ale przede wszystkim o Was — o Waszej relacji, energii i sposobie, w jaki jesteście razem. Nie tworzymy ani typowych, niemych teledysków ślubnych, ani wielogodzinnych reportaży. Nasze filmy są romantyczne, poruszające i naturalne — bez sztuczności i patosu.
                </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 lg:gap-10">
                {films.map((film, index) => (
                    <motion.div
                        key={film.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className="group relative aspect-[16/9] md:aspect-[3/4] lg:aspect-[4/5] rounded-[20px] overflow-hidden cursor-pointer bg-black shadow-lg"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${film.id}`, '_blank')}
                    >
                        {/* 1. Thumbnail Image (Hidden on hover) */}
                        <div className="absolute inset-0 z-0 transition-opacity duration-500 group-hover:opacity-0">
                            <img 
                                src={film.thumbnail} 
                                alt={film.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>

                        {/* 2. Video Preview (Visible on Hover) */}
                        <AnimatePresence>
                            {hoveredIndex === index && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 18, scale: 1.03 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 1.01 }}
                                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
                                >
                                    <iframe 
                                        style={{ 
                                            width: `${(isMobile ? 1.2 : film.videoScale) * 100}%`, 
                                            height: `${(isMobile ? 1.2 : film.videoScale) * 100}%`, 
                                            marginLeft: `-${((isMobile ? 1.2 : film.videoScale) - 1) * 50}%`, 
                                            marginTop: `-${((isMobile ? 1.2 : film.videoScale) - 1) * 50}%` 
                                        }}
                                        className="object-cover pointer-events-none max-w-none"
                                        src={`https://www.youtube.com/embed/${film.id}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${film.id}${film.startAt ? `&start=${film.startAt}` : ''}`} 
                                        title={film.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    ></iframe>
                                    <motion.div
                                        initial={{ opacity: 0.24 }}
                                        animate={{ opacity: 0 }}
                                        exit={{ opacity: 0.18 }}
                                        transition={{ duration: 0.45, ease: "easeOut" }}
                                        className="absolute inset-0 bg-black/20"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 3. Play Icon (Centered) */}
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                            <motion.div 
                                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-white"
                                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <Play size={24} fill="white" className="ml-1" />
                            </motion.div>
                        </div>

                        {/* 4. Text Content (Bottom - Reveals on Hover) */}
                        <div className="absolute bottom-0 left-0 w-full p-6 z-30 flex flex-col justify-end">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={hoveredIndex === index ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="flex flex-col items-center text-center"
                            >
                                <span className="font-sans text-[10px] uppercase tracking-widest text-white/70 mb-2">{film.subtitle}</span>
                                <h3 className="font-serif font-black text-3xl text-white uppercase leading-none mb-3">{film.title}</h3>
                                <p className="font-sans text-xs text-white/60 line-clamp-2 max-w-[80%]">
                                    {film.description}
                                </p>
                            </motion.div>
                            
                            {/* Static Title (Visible when NOT hovered - Optional, keeping it clean for now or maybe just show title always?) 
                                User asked for "opisy na dole niech się wyswietlają po hoverze dopiero".
                                So initially it should be clean or maybe just the title?
                                Let's keep it clean initially as requested, or maybe just a small hint.
                                Actually, user said "mówię tu o tym Liz&Christian i podpis nizej" -> so title and subtitle should be hidden initially.
                            */}
                             <motion.div
                                initial={{ opacity: 1 }}
                                animate={hoveredIndex === index ? { opacity: 0 } : { opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="absolute bottom-6 left-0 w-full text-center pointer-events-none"
                            >
                                <h3 className="font-serif font-bold text-xl text-white uppercase tracking-wider opacity-80">{film.title}</h3>
                            </motion.div>
                        </div>

                    </motion.div>
                ))}
            </div>

            {/* Mobile View More Button */}
            <div className="mt-4 flex md:hidden justify-center">
                 <button 
                    onClick={() => {
                        navigate('/portfolio');
                        window.scrollTo(0,0);
                    }}
                    className="flex items-center gap-3 px-6 py-3 rounded-full border border-brand-black/20 text-brand-black uppercase text-xs font-bold tracking-widest"
                >
                    Zobacz więcej
                </button>
            </div>

        </div>
    </section>
  );
};
