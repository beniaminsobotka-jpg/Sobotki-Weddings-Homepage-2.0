import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star, Camera, Sparkles, Users, MonitorPlay, Check, ArrowRight, ArrowUpRight, MapPin, Calendar, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- DATA ---
const portraitsData = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  src: `https://sobotkiweddings.pl/wp-content/uploads/2026/02/Fotostacja-Strona-Glowna-kafalek_${i + 1}.avif`,
  title: `Portrait Session ${i + 1}`,
  client: "Guest Portrait"
}));

export const PortraitsPage: React.FC = () => {
  const [selectedindex, setSelectedIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  // --- LIGHTBOX LOGIC ---
  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedindex !== null) {
      setSelectedIndex((prev) => (prev! + 1) % portraitsData.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedindex !== null) {
      setSelectedIndex((prev) => (prev! - 1 + portraitsData.length) % portraitsData.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedindex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedindex]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F3F2ED] pt-32 pb-24 relative selection:bg-white selection:text-black">
       
       {/* Background Noise for Texture */}
       <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

       <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col items-center text-center mb-24 md:mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-gray-500 block mb-6 flex items-center justify-center gap-3">
                        <Star size={10} className="text-white" fill="white" />
                        FOTOSTACJA - NAJLEPSZA ATRAKCJA WESELNA
                        <Star size={10} className="text-white" fill="white" />
                    </span>
                    <h1 className="font-serif font-black text-6xl md:text-8xl lg:text-9xl uppercase tracking-tighter text-white leading-[0.85] mb-6">
                        Sobotki<br/>
                        <span className="font-playfair-italic font-light lowercase text-gray-400">portraits</span>
                    </h1>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="max-w-2xl font-serif text-lg md:text-xl text-gray-400 leading-relaxed"
                >
                    Eleganckie, czarno-białe portrety wykonywane podczas Waszego przyjęcia. 
                    Tworzymy profesjonalne mini-studio, w którym każdy gość czuje się jak gwiazda kina.
                </motion.p>
            </div>

            {/* --- GRID LAYOUT (SHARP CORNERS - 3x3) --- */}
            <div className="grid grid-cols-3 grid-rows-3 gap-0.5 bg-[#111] w-full max-w-5xl mx-auto h-[60vh] md:h-[80vh] border border-white/5 p-0.5">
                <AnimatePresence>
                    {portraitsData.map((item, index) => (
                        <motion.div
                            key={item.id + index}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            onClick={() => openLightbox(index)}
                            className="relative w-full h-full group cursor-pointer overflow-hidden bg-[#0a0a0a]"
                        >
                            <img 
                                src={item.src} 
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-[1s] ease-out group-hover:scale-105 filter grayscale contrast-110 group-hover:grayscale-0"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* --- DETAILED CONTENT SECTION --- */}
            <div className="mt-32 max-w-5xl mx-auto space-y-24">
                
                {/* 1. Hook / Intro */}
                <div className="text-center">
                    <h2 className="font-serif text-3xl md:text-5xl text-white mb-8 leading-tight">
                        Więcej niż fotobudka.<br/>
                        <span className="text-gray-500 italic font-serif">To doświadczenie Vanity Fair.</span>
                    </h2>
                    <div className="w-24 h-[1px] bg-white/20 mx-auto mb-8"></div>
                    <p className="font-sans text-gray-400 leading-loose tracking-wide text-sm md:text-base max-w-3xl mx-auto">
                        Wesele to elegancja, emocje i ludzie, których kochacie. Dlaczego więc pamiątką z niego miałyby być zdjęcia w kiczowatych perukach? 
                        <strong> Sobotki Portraits</strong> to alternatywa klasy premium. Tworzymy przestrzeń, w której Wasi goście czują się pięknie, swobodnie i wyjątkowo.
                        To połączenie rozrywki z profesjonalną sesją portretową.
                    </p>
                </div>

                {/* VIDEO INSERT */}
                <div className="relative w-full rounded-[30px] overflow-hidden shadow-2xl bg-[#111] group border border-white/5">
                    <video 
                        src="https://sobotkiweddings.pl/wp-content/uploads/2026/02/Na-strone-www-Fotostacja-wycinek-1.mp4" 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        className="w-full h-auto aspect-video md:aspect-[21/9] object-cover opacity-80 transition-transform duration-[3s] group-hover:scale-105"
                    />
                    
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none"></div>

                    {/* LIQUID GLASS OVERLAY */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-8 md:pb-12 px-4">
                        <div className="liquid-glass backdrop-blur-xl bg-white/10 border border-white/20 px-6 py-4 md:px-10 md:py-6 rounded-3xl md:rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-500 hover:scale-[1.02]">
                             <p className="font-playfair-italic text-lg md:text-2xl lg:text-3xl text-white text-center leading-relaxed drop-shadow-lg">
                                Atrakcja, którą goście pamiętają na długo po weselu
                             </p>
                        </div>
                    </div>
                </div>

                {/* 2. Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 border-t border-white/10 pt-16">
                    <div className="flex gap-6 items-start">
                        <div className="p-3 bg-white/5 rounded-full border border-white/10 shrink-0">
                            <Users size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl text-white mb-3">Fotograf, nie Maszyna</h3>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                Automat czeka na odliczanie. Nasz fotograf czeka na emocje. Pracujemy z Wami i Waszymi gośćmi – podpowiadamy jak stanąć, poprawiamy włosy, rozśmieszamy. To interakcja z człowiekiem sprawia, że na zdjęciach wyglądacie naturalnie i pewnie.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="p-3 bg-white/5 rounded-full border border-white/10 shrink-0">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl text-white mb-3">Signature Black & White</h3>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                Nasz autorski styl obróbki to hołd dla klasycznej fotografii portretowej. Wysoki kontrast, głębokie czernie i studyjne światło sprawiają, że zdjęcia nabierają szlachetności. To "instant beauty filter", który działa w rzeczywistości.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="p-3 bg-white/5 rounded-full border border-white/10 shrink-0">
                            <Camera size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl text-white mb-3">Mobilne Studio</h3>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                Przywozimy na salę profesjonalne oświetlenie, tło (czarne "black velvet" lub klasyczne białe) i system podglądu. Potrzebujemy tylko kawałka przestrzeni (ok. 3x3m), by stworzyć warunki jak w studiu fotograficznym.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="p-3 bg-white/5 rounded-full border border-white/10 shrink-0">
                            <MonitorPlay size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl text-white mb-3">Galeria Online 24h</h3>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                Nie musicie czekać tygodniami. Wyselekcjonowane i poddane autorskiej obróbce zdjęcia trafiają do prywatnej galerii online w ciągu 24-48 godzin od wesela. Linkiem możecie od razu podzielić się z gośćmi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- COMPARISON SECTION --- */}
                <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-t border-white/10 pt-16">
                    
                    {/* Video Column */}
                    <div className="relative h-[500px] md:h-[700px] rounded-[30px] overflow-hidden border border-white/10 bg-[#111] shadow-2xl order-1 lg:order-1 group">
                         <video 
                            src="https://sobotkiweddings.pl/wp-content/uploads/2026/02/Na-strone-www-2.mp4" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                         />
                         {/* Vignette Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>
                         
                         {/* Optional Badge on Video */}
                         <div className="absolute bottom-6 left-6 pointer-events-none">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
                                <span className="font-sans text-[10px] uppercase tracking-widest text-white">Backstage</span>
                            </div>
                         </div>
                    </div>

                    {/* Comparison Text Column */}
                    <div className="flex flex-col gap-12 px-2 md:px-8 order-2 lg:order-2">
                        
                        {/* FOTOBUDKA (Negative) */}
                        <div className="opacity-40 hover:opacity-80 transition-opacity duration-500 group">
                             <div className="mb-6 relative inline-block">
                                <h3 className="font-serif font-black text-3xl md:text-5xl text-gray-500 uppercase tracking-widest leading-none">
                                    Fotobudka
                                </h3>
                                {/* Red scratch line */}
                                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-600 -rotate-2 transform origin-center shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                             </div>
                             
                             <ul className="space-y-3 font-sans text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-500">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-800 mt-[1px] shrink-0"><X size={14} /></span>
                                    <span>Niska jakość drukowanych zdjęć</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-800 mt-[1px] shrink-0"><X size={14} /></span>
                                    <span>Nie pasuje do eleganckiej oprawy wesela</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-800 mt-[1px] shrink-0"><X size={14} /></span>
                                    <span>Brak dostępu do zdjęć w chmurze</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-800 mt-[1px] shrink-0"><X size={14} /></span>
                                    <span>Starsze pokolenie rzadko korzysta</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-800 mt-[1px] shrink-0"><X size={14} /></span>
                                    <span>Pamiątka, która cieszy tylko chwilę</span>
                                </li>
                             </ul>
                        </div>

                        {/* SEPARATOR */}
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                        {/* FOTOSTACJA (Positive) */}
                        <div>
                             <h3 className="font-playfair-italic text-5xl md:text-7xl text-white mb-8 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                                 Fotostacja
                             </h3>
                             
                             <ul className="space-y-5 font-sans text-[11px] md:text-xs tracking-[0.2em] uppercase text-white/90">
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-white/20 rounded-full mt-[-2px] shrink-0">
                                       <Check size={10} className="text-white" />
                                    </div>
                                    <span>Bardzo wysoka jakość drukowanych zdjęć</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-white/20 rounded-full mt-[-2px] shrink-0">
                                       <Check size={10} className="text-white" />
                                    </div>
                                    <span>Klasa, szyk i elegancja</span>
                                </li>
                                <li className="flex items-start gap-4">
                                     <div className="p-1 bg-white/20 rounded-full mt-[-2px] shrink-0">
                                       <Check size={10} className="text-white" />
                                    </div>
                                    <span>Zdjęcia w chmurze tego samego dnia</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-white/20 rounded-full mt-[-2px] shrink-0">
                                       <Check size={10} className="text-white" />
                                    </div>
                                    <span>Odpowiednie dla wszystkich pokoleń</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-1 bg-white/20 rounded-full mt-[-2px] shrink-0">
                                       <Check size={10} className="text-white" />
                                    </div>
                                    <span>Pamiątka na całe życie</span>
                                </li>
                             </ul>
                        </div>

                    </div>

                </div>

                {/* --- 3 OFFER TYPES SECTION --- */}
                <div className="mt-32 pt-16 border-t border-white/10">
                    <div className="text-center mb-16">
                         <h2 className="font-serif text-3xl md:text-5xl text-white mb-4 leading-tight">
                            Wybierz Swoje Doświadczenie
                         </h2>
                         <p className="font-sans text-gray-500 text-xs md:text-sm tracking-wide max-w-xl mx-auto">
                            Dopasuj format Fotostacji do charakteru Twojego wydarzenia.
                         </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* CARD 1: WEDDING */}
                        <div className="group relative h-[500px] rounded-[30px] overflow-hidden bg-[#111] border border-white/10 cursor-pointer">
                             {/* Background Image */}
                             <img 
                                src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/AgnieszkaxJakub_Fotostacja_-50-min.avif" 
                                alt="Oferta Ślubna" 
                                className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700 transform group-hover:scale-105"
                             />
                             {/* Gradient Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                             
                             {/* Content */}
                             <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                 <div className="mb-auto flex justify-end">
                                      <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 text-white transition-all duration-500 group-hover:bg-white group-hover:text-black">
                                          <ArrowRight size={20} className="transform transition-transform duration-500 group-hover:translate-x-1" />
                                      </div>
                                 </div>

                                 <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                     <div className="flex items-center gap-2 mb-3">
                                         <Star size={14} className="text-white fill-white" />
                                         <span className="font-sans text-[10px] uppercase tracking-widest text-white/80">Wesela i przyjęcia</span>
                                     </div>
                                     <h3 className="font-serif font-black text-3xl text-white mb-2 leading-none">Oferta Ślubna</h3>
                                     <p className="font-playfair-italic text-gray-400 text-lg mb-4">Elegancja i Emocje</p>
                                     <p className="font-sans text-xs text-gray-500 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 h-0 group-hover:h-auto overflow-hidden">
                                        Mobilne studio, białe tło i 3 godziny pracy. Goście otrzymują odbitki w eleganckich kopertach w kilka minut.
                                     </p>
                                 </div>
                             </div>
                             
                             {/* Click Area Link */}
                             <button
                                onClick={() => {
                                    navigate('/portraits/wedding');
                                    window.scrollTo(0, 0);
                                }}
                                className="absolute inset-0 z-20"
                                aria-label="Przejdz do Fotostacji Slubnej"
                             ></button>
                        </div>

                        {/* CARD 2: EVENT */}
                        <div className="group relative h-[500px] rounded-[30px] overflow-hidden bg-[#111] border border-white/10 cursor-pointer">
                             {/* Background Image */}
                             <img 
                                src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/MartynaxMichal_Fotostacja_-48-min.avif" 
                                alt="Oferta Eventowa" 
                                className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700 transform group-hover:scale-105"
                             />
                             {/* Gradient Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                             
                             {/* Content */}
                             <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                 <div className="mb-auto flex justify-end">
                                      <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 text-white transition-all duration-500 group-hover:bg-white group-hover:text-black">
                                          <ArrowRight size={20} className="transform transition-transform duration-500 group-hover:translate-x-1" />
                                      </div>
                                 </div>

                                 <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                     <div className="flex items-center gap-2 mb-3">
                                         <Briefcase size={14} className="text-white" />
                                         <span className="font-sans text-[10px] uppercase tracking-widest text-white/80">Imprezy firmowe</span>
                                     </div>
                                     <h3 className="font-serif font-black text-3xl text-white mb-2 leading-none">Oferta Eventowa</h3>
                                     <p className="font-playfair-italic text-gray-400 text-lg mb-4">Wizerunek i Marka</p>
                                     <p className="font-sans text-xs text-gray-500 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 h-0 group-hover:h-auto overflow-hidden">
                                        Gale, jubileusze i imprezy firmowe. Skuteczne narzędzie employer brandingowe z pełną personalizacją.
                                     </p>
                                 </div>
                             </div>

                             {/* Click Area Link */}
                             <button
                                onClick={() => {
                                    navigate('/portraits/event');
                                    window.scrollTo(0, 0);
                                }}
                                className="absolute inset-0 z-20"
                                aria-label="Przejdz do Fotostacji Eventowej"
                             ></button>
                        </div>

                        {/* CARD 3: STUDIO */}
                        <div className="group relative h-[500px] rounded-[30px] overflow-hidden bg-[#111] border border-white/10 cursor-pointer">
                             {/* Background Image */}
                             <img 
                                src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/OlgaxFranek_Fotostacja_-51-min.avif" 
                                alt="Studio Stacjonarne" 
                                className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700 transform group-hover:scale-105"
                             />
                             {/* Gradient Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                             
                             {/* Content */}
                             <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                 <div className="mb-auto flex justify-end">
                                      <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 text-white transition-all duration-500 group-hover:bg-white group-hover:text-black">
                                          <ArrowRight size={20} className="transform transition-transform duration-500 group-hover:translate-x-1" />
                                      </div>
                                 </div>

                                 <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                     <div className="flex items-center gap-2 mb-3">
                                         <MapPin size={14} className="text-white" />
                                         <span className="font-sans text-[10px] uppercase tracking-widest text-white/80">Gliwice</span>
                                     </div>
                                     <h3 className="font-serif font-black text-3xl text-white mb-2 leading-none">Studio Stacjonarne</h3>
                                     <p className="font-playfair-italic text-gray-400 text-lg mb-4">Dzień Portretu</p>
                                     <p className="font-sans text-xs text-gray-500 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 h-0 group-hover:h-auto overflow-hidden">
                                        Nie czekaj na okazję. Odwiedź nas w Gliwicach na krótką sesję indywidualną, rodzinną lub pokoleniową.
                                     </p>
                                 </div>
                             </div>

                             {/* Click Area Link */}
                             <button
                                onClick={() => {
                                    navigate('/portraits/stationary');
                                    window.scrollTo(0, 0);
                                }}
                                className="absolute inset-0 z-20"
                                aria-label="Przejdz do Fotostacji Stacjonarnej"
                             ></button>
                        </div>

                    </div>
                </div>

                {/* --- SEO CONTENT (READABLE TEXT SECTION) --- */}
                <div className="mt-32 pt-16 border-t border-white/10 space-y-24">
                    
                    {/* Header with Keywords */}
                    <div className="text-center space-y-6">
                        <h2 className="font-serif text-3xl md:text-5xl text-white uppercase tracking-widest flex flex-col items-center">
                            <span>Tworzymy pamiątki</span>
                            <span className="font-playfair-italic font-light lowercase text-[#d42929] tracking-normal text-4xl md:text-6xl -mt-2 md:-mt-4">
                                na całe życie
                            </span>
                        </h2>
                        {/* Infinite Marquee of Keywords */}
                        <div 
                            className="relative w-full overflow-hidden flex opacity-70"
                            style={{ maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" }}
                        >
                            <motion.div
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ ease: "linear", duration: 70, repeat: Infinity }}
                                className="flex min-w-max"
                            >
                                {/* Generating 4 identical blocks to fill the screen and allow seamless loop from 0 to -50% */}
                                {[...Array(4)].map((_, i) => (
                                    <span key={i} className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap pr-4">
                                        Wyjątkowe • Ponadczasowe • Eleganckie • Klasyczne • Prestiżowe • Luksusowe • Minimalistyczne • Czarno-Białe • Naturalne • Prawdziwe • Trwałe • Profesjonalne • Piękne •
                                    </span>
                                ))}
                            </motion.div>
                        </div>
                    </div>

                    {/* "Czym jest Fotostacja" Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="relative aspect-[3/2] rounded-[20px] overflow-hidden bg-[#111] shadow-2xl group">
                            <img 
                                src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/AgnieszkaxJakub_Fotostacja_-1-min-1024x683.avif" 
                                alt="Fotostacja portretowa" 
                                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-1000"
                            />
                            {/* Overlay Vignette */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[20px]"></div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="font-serif text-3xl md:text-4xl text-white uppercase leading-none">
                                Czym jest <span className="font-playfair-italic text-gray-500 lowercase normal-case">fotostacja?</span>
                            </h3>
                            <div className="space-y-4 font-sans text-sm md:text-base text-gray-400 leading-relaxed">
                                <p>
                                    Fotostacja na przyjęcia to mobilne studio portretowe. Pojawia się wszędzie tam, gdzie dzieje się coś ważnego — na weselach, imprezach firmowych, jubileuszach, a także innych wydarzeniach, które zasługują na wyjątkowe pamiątki.
                                </p>
                                <p>
                                    W ciągu kilku minut wykonujemy czarno-białe zdjęcia portretowe. Następnie drukujemy je od razu na miejscu. Dzięki temu każdy uczestnik otrzymuje profesjonalnie obrobioną odbitkę w formacie 10×15 cm. Zdjęcie trafia do eleganckiej, czerwonej koperty.
                                </p>
                                <p>
                                    Co więcej, wszystkie fotografie zapisujemy także na dysku online. Goście mogą je łatwo pobrać na telefon — za pomocą wygodnego kodu QR.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* "Więcej niż fotobudka" Text Block */}
                    <div className="bg-[#111] p-8 md:p-12 rounded-3xl border border-white/5">
                        <h3 className="font-serif text-2xl md:text-4xl text-white uppercase mb-6 leading-tight">
                            Fotostacja na przyjęcia to coś więcej niż fotobudka
                        </h3>
                        <div className="space-y-4 font-sans text-sm md:text-base text-gray-400 leading-relaxed max-w-4xl">
                            <p>
                                W przeciwieństwie do klasycznej fotobudki, Fotostacja to doświadczenie bardziej minimalistyczne i eleganckie. Wyróżnia się nie tylko stylem, ale także jakością i prawdziwą emocją.
                            </p>
                            <p>
                                Nie znajdziesz tu śmiesznych gadżetów ani plastikowych okularów. Zamiast tego tworzymy ponadczasowe portrety — takie, które po latach nabiorą jeszcze większego znaczenia. To pamiątka, która zostaje na długo.
                            </p>
                            <p>
                                Fotostacja to wyjątkowa atrakcja dla gości. Jednocześnie stanowi piękne uzupełnienie reportażu ślubnego lub dokumentacji eventu firmowego. Świetnie dopełnia tradycyjne zdjęcia i nadaje wydarzeniu unikalny charakter.
                            </p>
                        </div>
                    </div>

                    {/* Three Columns SEO Text */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-8">
                        <div className="space-y-4">
                            <h4 className="font-serif text-2xl text-white">Czarno-białe portrety na weselu</h4>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                Fotostacja na przyjęcia weselne działa przez około 3 godziny, co pozwala uchwycić wiele wyjątkowych momentów. Rozstawiamy białe tło, światło studyjne i drukarkę, a następnie zapraszamy gości po kolei do zdjęć, dzięki czemu każdy może poczuć się jak w prawdziwym studio fotograficznym.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-serif text-2xl text-white">Fotostacja na eventy firmowe</h4>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                Szukasz nietypowej, ale stylowej atrakcji na event firmowy? Fotostacja doskonale sprawdza się podczas takich okazji jak wieczory galowe, jubileusze firm, świąteczne spotkania, a także dni otwarte i eventy brandingowe.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-serif text-2xl text-white">Fotostacja stacjonarna – Gliwice</h4>
                            <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                Nie czekaj na okazję – odwiedź nas w naszym fotostudio w Gliwicach! W każdą środę (i nie tylko), w ramach akcji „Dzień Portretu”, możesz zarezerwować półgodzinne okienko i wykonać rodzinny portret czarno-biały lub zdjęcie z bliskimi.
                            </p>
                        </div>
                    </div>

                </div>

                {/* 3. Specs & CTA */}
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="max-w-xl">
                        <h4 className="font-serif text-2xl text-white mb-4">Pakiet Weselny - Szczegóły</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-400 font-sans text-sm list-disc list-inside marker:text-gray-600">
                            <li>3 godziny pracy fotografa</li>
                            <li>Profesjonalne oświetlenie studyjne</li>
                            <li>Tło (Czerń / Biel / Szarość)</li>
                            <li>Nielimitowana ilość ujęć</li>
                            <li>Galeria online (prywatne hasło)</li>
                            <li>Dojazd do 50km w cenie</li>
                        </ul>
                    </div>
                    
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <a 
                            href="#kontakt" 
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-white text-black px-8 py-4 rounded-full font-sans font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            Zapytaj o termin
                        </a>
                        <span className="text-gray-600 font-sans text-[10px] uppercase tracking-widest">
                            Ograniczona dostępność na 2026
                        </span>
                    </div>
                </div>

            </div>

            {/* --- LIGHTBOX MODAL --- */}
            <AnimatePresence>
                {selectedindex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={closeLightbox}
                    >
                        <button 
                            onClick={closeLightbox}
                            className="absolute top-6 right-6 z-[110] w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                        >
                            <X size={32} strokeWidth={1} />
                        </button>

                        <button 
                            onClick={prevImage}
                            className="hidden md:flex absolute left-8 z-[110] w-16 h-full items-center justify-start text-white/30 hover:text-white transition-all"
                        >
                            <ChevronLeft size={48} strokeWidth={0.5} />
                        </button>
                        
                        <button 
                            onClick={nextImage}
                            className="hidden md:flex absolute right-8 z-[110] w-16 h-full items-center justify-end text-white/30 hover:text-white transition-all"
                        >
                            <ChevronRight size={48} strokeWidth={0.5} />
                        </button>

                        <motion.div 
                            className="relative max-w-full max-h-[90vh]"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()} 
                        >
                            <img 
                                src={portraitsData[selectedindex].src} 
                                alt={portraitsData[selectedindex].title}
                                className="max-w-full max-h-[85vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                            />
                            <div className="text-center mt-4">
                                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-500">
                                    {selectedindex + 1} / {portraitsData.length}
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

       </div>
    </div>
  );
};
