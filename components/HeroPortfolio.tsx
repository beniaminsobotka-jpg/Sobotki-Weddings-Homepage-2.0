import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Wybieramy 9 zdjęć
const selectedIds = [5, 12, 3, 9, 1, 8, 11, 2, 7];

const images = selectedIds.map((num, i) => ({
  id: i,
  src: `https://sobotkiweddings.pl/wp-content/uploads/2026/02/image-portfolio-hero-${num}.avif`
}));

export const HeroPortfolio: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(4); // Start w środku (4 to środek dla 9 elementów)
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Touch handling refs
  const touchStartX = useRef<number | null>(null);
  const startActiveIndex = useRef<number>(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- MOUSE LOGIC ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const percentage = Math.max(0, Math.min(1, x / width));
    const newIndex = Math.floor(percentage * images.length);
    setActiveIndex(Math.min(images.length - 1, newIndex));
  };

  // --- TOUCH LOGIC ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    startActiveIndex.current = activeIndex;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = touchStartX.current - currentX;
    const sensitivity = 35; 
    const indexDelta = Math.round(diff / sensitivity);
    const targetIndex = startActiveIndex.current + indexDelta;
    const newIndex = Math.max(0, Math.min(images.length - 1, targetIndex));
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  // --- 3D STYLE CALCULATION ---
  const getStyle = (index: number) => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);
    const isActive = offset === 0;
    
    const xSpacing = isMobile ? 40 : 60; 
    const xGap = isMobile ? 180 : 380; // Gap between active and side cards
    const rotation = isMobile ? 25 : 45;
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
    <section className="py-12 md:py-24 relative z-20 overflow-hidden flex flex-col items-center">
      
      {/* Header (Optional aesthetic text) */}
      <div className="mb-8 md:mb-12 text-center relative z-30 px-4">
         <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
            Selected Highlights
         </span>
      </div>

      <div className="w-full max-w-[1600px] mx-auto relative z-10 flex flex-col items-center">
        
        {/* --- 3D CAROUSEL CONTAINER --- */}
        <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative h-[400px] md:h-[550px] w-full flex justify-center items-center perspective-1000 cursor-crosshair touch-pan-y"
            style={{ perspective: isMobile ? '800px' : '1200px' }}
        >
            {/* Hover Trap Layer */}
            <div className="absolute inset-0 z-[2000] w-full h-full bg-transparent" />

            {images.map((item, index) => {
                const style = getStyle(index);
                const isActive = index === activeIndex;

                return (
                    <motion.div
                        key={item.id}
                        className="absolute w-[260px] h-[350px] md:w-[380px] md:h-[480px] origin-center pointer-events-none"
                        initial={false}
                        animate={{
                            x: style.x,
                            z: style.z,
                            rotateY: style.rotateY,
                            zIndex: style.zIndex,
                            opacity: style.opacity
                        }}
                        transition={{
                            // Layout (x, y, z, rotation, opacity) uses spring for smooth gliding
                            default: {
                                type: "spring",
                                stiffness: 50,
                                damping: 14,
                                mass: 1.1
                            },
                            // zIndex explicitly sets duration to 0 and type to tween
                            // This ensures the active image IMMEDIATELY jumps to the front 
                            // before the other elements have finished sliding out of the way.
                            zIndex: {
                                duration: 0,
                                type: "tween"
                            }
                        }}
                        style={{
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {/* IMAGE CARD - GLASS BORDER ADDED */}
                        <div className={`relative w-full h-full bg-white shadow-2xl transition-all duration-700 rounded-2xl overflow-hidden ${isActive ? 'brightness-100' : 'brightness-[0.85]'}`}>
                            
                            {/* Glass border overlay */}
                            <div className="absolute inset-0 border border-white/20 z-20 pointer-events-none rounded-2xl ring-1 ring-white/10" />
                            
                            <img 
                                src={item.src} 
                                alt={`Portfolio ${item.id}`}
                                className="w-full h-full object-cover select-none"
                                draggable={false}
                            />
                        </div>
                    </motion.div>
                );
            })}
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-8 md:mt-12 w-full max-w-sm relative px-4">
            <div className="w-full h-[1px] bg-black/10 relative overflow-visible rounded-full">
                <motion.div 
                    className="absolute top-1/2 -mt-[2px] h-[4px] w-8 md:w-12 bg-brand-black shadow-sm rounded-full"
                    animate={{
                        left: `${(activeIndex / (images.length - 1)) * 100}%`,
                        x: "-50%"
                    }}
                    transition={{ type: "spring", stiffness: 60, damping: 20 }}
                />
            </div>
            <div className="md:hidden text-center mt-4 text-[9px] text-gray-400 uppercase tracking-widest opacity-60">
                Przesuń palcem
            </div>
        </div>

        {/* BUTTON - LIQUID GLASS STYLE */}
        <div className="flex justify-center mt-12 md:mt-16 relative z-30 pointer-events-auto">
            <a 
              href="#/portfolio"
              onClick={(e) => {
                e.preventDefault();
                navigate('/portfolio');
                window.scrollTo(0, 0);
              }}
              className="group flex items-center gap-3 px-8 py-4 rounded-full backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-white/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer hover:scale-105"
            >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-black">
                    Zobacz więcej zdjęć
                </span>
            </a>
        </div>

      </div>
    </section>
  );
};