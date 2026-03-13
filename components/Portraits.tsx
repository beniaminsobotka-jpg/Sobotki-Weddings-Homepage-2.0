import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Generowanie tablicy 10 zdjęć
const portraits = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  src: `https://sobotkiweddings.pl/wp-content/uploads/2026/02/Fotostacja-Strona-Glowna-kafalek_${i + 1}.avif`,
}));

export const Portraits: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // State do wykrywania mobile (do zmiany parametrów 3D)
  const [isMobile, setIsMobile] = useState(false);

  // State do obsługi dotyku (Swipe)
  const touchStartX = useRef<number | null>(null);
  const startActiveIndex = useRef<number>(0); // Zapamiętujemy index w momencie dotknięcia

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- OBSŁUGA MYSZKI (DESKTOP) ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return;
    
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const percentage = Math.max(0, Math.min(1, x / width));
    const newIndex = Math.floor(percentage * portraits.length);
    setActiveIndex(Math.min(portraits.length - 1, newIndex));
  };

  // --- OBSŁUGA DOTYKU (MOBILE) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    startActiveIndex.current = activeIndex; // Blokujemy index startowy
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const currentX = e.targetTouches[0].clientX;
    const diff = touchStartX.current - currentX; // Ile pikseli przesunęliśmy
    
    // CZUŁOŚĆ: Im mniejsza liczba, tym szybciej przewija. 
    // 35px przesunięcia = 1 zdjęcie.
    const sensitivity = 35; 
    
    // Obliczamy deltę indeksów
    const indexDelta = Math.round(diff / sensitivity);
    
    // Nowy index to startowy + zmiana
    const targetIndex = startActiveIndex.current + indexDelta;

    // Clamp (nie wychodzimy poza zakres tablicy)
    const newIndex = Math.max(0, Math.min(portraits.length - 1, targetIndex));

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  const getStyle = (index: number) => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);
    const isActive = offset === 0;
    
    // KONFIGURACJA COVER FLOW (RESPOSYWNA)
    // Mobile: mniejszy gap, żeby sąsiednie karty "wystawały" po bokach
    const xSpacing = isMobile ? 40 : 50; 
    const xGap = isMobile ? 190 : 350; // 190px na mobile sprawi, że boki będą widoczne
    const rotation = isMobile ? 25 : 45; // Mniejszy kąt na mobile dla lepszej czytelności
    const zOffset = -200;

    let x = offset * xSpacing;
    let z = zOffset;
    let rotateY = 0;
    let zIndex = 100 - absOffset;
    let opacity = 1;

    if (isActive) {
      x = 0;
      z = 0;
      rotateY = 0;
      zIndex = 1000;
    } else if (offset < 0) {
      x = (offset * xSpacing) - xGap;
      rotateY = rotation;
    } else {
      x = (offset * xSpacing) + xGap;
      rotateY = -rotation;
    }
    
    if (absOffset > 4) opacity = 0;
    else if (absOffset > 2) opacity = 1 - (absOffset - 2) * 0.3;

    return { x, z, rotateY, zIndex, opacity };
  };

  return (
    <section id="portraits" className="py-8 md:py-32 bg-black text-[#F3F2ED] relative overflow-hidden min-h-[500px] md:min-h-[900px] flex flex-col justify-center">
      
      <div className="absolute inset-0 bg-[#0a0a0a] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-6 w-full relative z-10">
        
        {/* GRID LAYOUT: Desktop 2 cols, Mobile 1 col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative">
            
            {/* LEWA KOLUMNA: ZDJĘCIA (Order 2 on mobile to be below text, Order 1 on desktop) */}
            {/* Z-Index 10 ensures it is below the text column if they overlap */}
            <div className="order-2 lg:order-1 flex flex-col items-center relative z-10">
                
                {/* --- SCENA 3D --- */}
                <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="relative h-[300px] md:h-[550px] w-full flex justify-center items-center perspective-1000 cursor-crosshair touch-pan-y"
                    style={{ perspective: isMobile ? '800px' : '1200px' }}
                >
                    {/* Obszar czuły na hover (niewidoczny layer na wierzchu wewnątrz kontenera zdjęć) */}
                    <div className="absolute inset-0 z-[2000] w-full h-full bg-transparent" />

                    {portraits.map((item, index) => {
                        const style = getStyle(index);
                        const isActive = index === activeIndex;

                        return (
                            <motion.div
                                key={item.id}
                                // Mobile width adjust: w-[260px] pozwala zobaczyć więcej sąsiadów na wąskich ekranach
                                className="absolute w-[220px] h-[300px] md:w-[380px] md:h-[480px] origin-center pointer-events-none"
                                initial={false}
                                animate={{
                                    x: style.x,
                                    z: style.z,
                                    rotateY: style.rotateY,
                                    zIndex: style.zIndex,
                                    opacity: style.opacity
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 50,
                                    damping: 14,
                                    mass: 1.1
                                }}
                                style={{
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                {/* THE IMAGE CARD */}
                                <div className={`relative w-full h-full bg-black shadow-2xl transition-all duration-700 rounded-2xl overflow-hidden ${isActive ? 'brightness-100' : 'brightness-[0.4]'}`}>
                                    
                                    {/* Delikatny border */}
                                    <div className="absolute inset-0 border border-white/10 z-20 pointer-events-none opacity-50 rounded-2xl" />
                                    
                                    <img 
                                        src={item.src} 
                                        alt={`Portrait ${item.id}`}
                                        className="w-full h-full object-cover select-none"
                                        draggable={false}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Minimalist Red Slider (Pod zdjęciami) */}
                <div className="mt-2 md:mt-12 w-full max-w-sm relative px-4">
                    <div className="w-full h-[1px] bg-gray-800 relative overflow-visible">
                        <motion.div 
                            className="absolute top-1/2 -mt-[2px] h-[5px] w-8 md:w-12 bg-[#ff0000] shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                            animate={{
                                left: `${(activeIndex / (portraits.length - 1)) * 100}%`,
                                x: "-50%"
                            }}
                            transition={{ type: "spring", stiffness: 60, damping: 20 }}
                        />
                    </div>
                    {/* Mobile Hint */}
                    <div className="md:hidden text-center mt-2 text-[9px] text-gray-600 uppercase tracking-widest opacity-60">
                        Przesuń palcem
                    </div>
                </div>

            </div>

            {/* PRAWA KOLUMNA: TREŚĆ (Order 1 on mobile, Order 2 on desktop) */}
            {/* Z-Index 30 ensures text is always on top of images (z-10) */}
            <div className="order-1 lg:order-2 flex flex-col items-center lg:items-start text-center lg:text-left relative z-30 pointer-events-none">
                <div className="pointer-events-auto max-w-lg">
                    <h2 className="font-serif font-black text-4xl md:text-7xl lg:text-8xl text-white uppercase tracking-tighter leading-[0.9]">
                        Sobotki<br/>Portraits
                    </h2>
                    
                    {/* Updated Subtitle Color */}
                    <p className="font-playfair-italic text-2xl md:text-3xl lg:text-4xl text-white mt-4 lowercase tracking-tight">
                        fotostacja ślubna
                    </p>
                    
                    <div className="w-12 h-[1px] bg-white/20 my-6 lg:my-8 lg:mr-auto lg:ml-0 mx-auto"></div>
                    
                    {/* Glass Panel Description */}
                    <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.3)] mb-6 lg:mb-10">
                        <p className="font-sans text-xs md:text-sm text-gray-300 leading-relaxed tracking-wide">
                            To alternatywa dla klasycznej fotobudki – profesjonalne mini-studio aranżowane w sercu Waszego przyjęcia. 
                            Wykonujemy w nim ponadczasowe, czarno-białe portrety, na których każdy wygląda jak gwiazda filmowa. 
                            To elegancka pamiątka, łącząca klasykę z nowoczesnym, editorialowym stylem.
                        </p>
                    </div>

                    {/* BUTTON - DOWIEDZ SIĘ WIĘCEJ */}
                    <button 
                        onClick={() => {
                            navigate('/portraits');
                            window.scrollTo(0,0);
                        }}
                        className="group flex items-center gap-4 px-8 py-4 border border-white/10 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 cursor-pointer shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(255,0,0,0.1)] hover:border-white/20 inline-flex"
                    >
                        <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                        </span>
                        <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-300 group-hover:text-white transition-colors">
                            Dowiedz się więcej
                        </span>
                    </button>
                </div>
            </div>

        </div>

      </div>
    </section>
  );
};