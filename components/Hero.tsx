import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Volume2, Power, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Track scroll within the extended Hero section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  // --- ANIMATIONS ---
  
  // 1. VIDEO TRANSFORMS
  const videoScale = useTransform(smoothProgress, [0, 0.8], [1, 0]);
  const videoOpacity = useTransform(smoothProgress, [0.75, 0.85], [1, 0]);
  
  const videoRadius = useTransform(smoothProgress, [0, 0.5], ["0rem", "2.5rem"]); 
  const desktopRadius = useTransform(smoothProgress, [0, 0.5], ["3.5rem", "2.5rem"]);

  // 2. TEXT MOVEMENTS
  const sobotkiY = useTransform(smoothProgress, [0, 0.8], [isMobile ? "-15vh" : "-45vh", "0vh"]);
  const weddingsY = useTransform(smoothProgress, [0, 0.8], [isMobile ? "15vh" : "45vh", "0vh"]);
  
  // Weddings Opacity: Startuje od 0 (niewidoczny), pojawia się przy scrollu (0 -> 0.15)
  const weddingsAppearOpacity = useTransform(smoothProgress, [0, 0.15], [0, 1]);

  const textScale = useTransform(smoothProgress, [0, 0.8], [1.2, 1]);

  // 3. COLOR TRANSITIONS (PERFORMANCE FIX: OPACITY SWAP)
  const bgColor = useTransform(smoothProgress, [0.8, 0.95], ["#050505", "#F3F2ED"]);
  
  const whiteTextOpacity = useTransform(smoothProgress, [0.8, 0.95], [1, 0]);
  const blackTextOpacity = useTransform(smoothProgress, [0.8, 0.95], [0, 1]);
  
  // 4. CTA BUTTON APPEARANCE
  const ctaOpacity = useTransform(smoothProgress, [0.85, 0.95], [0, 1]);
  const ctaY = useTransform(smoothProgress, [0.85, 0.95], [20, 0]);

  // 5. INNER CONTENT
  const contentOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const vignetteOpacity = useTransform(smoothProgress, [0, 0.5], [0.8, 0.4]);

  return (
    <section ref={containerRef} id="home" className="relative w-full h-[110vh] md:h-[250vh]">
      
      {/* Sticky Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Animated Background Layer */}
        <motion.div 
          style={{ backgroundColor: bgColor }}
          className="absolute inset-0 -z-10"
        />
        
        {/* --- TEXT LAYER --- */}
        <motion.div 
             style={{ scale: textScale, willChange: "transform" }}
             className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none"
        >
              {/* TOP: SOBOTKI */}
              <motion.div 
                style={{ y: sobotkiY, willChange: "transform" }}
                className="relative z-10"
              >
                 <div className="relative transform-gpu">
                    {/* WARSTWA 1: BAZA BIAŁA (Zanika na końcu) */}
                    <motion.span 
                      style={{ opacity: whiteTextOpacity, color: "#F3F2ED" }}
                      className="block font-serif font-black uppercase text-[15vw] md:text-[12vw] leading-none tracking-tighter text-center absolute inset-0"
                    >
                      Sobotki
                    </motion.span>

                    {/* WARSTWA 2: BAZA CZARNA (Pojawia się na końcu) */}
                    <motion.span 
                      style={{ opacity: blackTextOpacity, color: "#1A1A1A" }}
                      className="block font-serif font-black uppercase text-[15vw] md:text-[12vw] leading-none tracking-tighter text-center"
                    >
                      Sobotki
                    </motion.span>
                 </div>
              </motion.div>

              {/* BOTTOM: WEDDINGS */}
              <motion.div 
                style={{ 
                    y: weddingsY, 
                    willChange: "transform" 
                }}
                className="relative z-0"
              >
                 <motion.div 
                    style={{ opacity: weddingsAppearOpacity }}
                    className="relative -mt-4 md:-mt-12 transform-gpu"
                 >
                    {/* WARSTWA 1: BAZA BIAŁA */}
                    <motion.span 
                      style={{ opacity: whiteTextOpacity, color: "#F3F2ED" }}
                      className="block font-playfair italic font-normal lowercase text-[15vw] md:text-[12vw] leading-none tracking-tighter text-center absolute inset-0"
                    >
                      weddings
                    </motion.span>

                    {/* WARSTWA 2: BAZA CZARNA */}
                    <motion.span 
                      style={{ opacity: blackTextOpacity, color: "#1A1A1A" }}
                      className="block font-playfair italic font-normal lowercase text-[15vw] md:text-[12vw] leading-none tracking-tighter text-center"
                    >
                      weddings
                    </motion.span>
                 </motion.div>
              </motion.div>

              <motion.div
                style={{ opacity: ctaOpacity, y: ctaY }}
                className="relative z-20 mt-4 md:mt-12"
              >
                <a 
                  href="#kontakt" 
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById('kontakt');
                    if (target) {
                        if ((window as any).lenis) {
                            (window as any).lenis.scrollTo('#kontakt', { duration: 1.5 });
                        } else {
                            target.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                  }}
                  className="group flex items-center gap-3 px-5 py-2 border border-black/10 rounded-full bg-black/5 backdrop-blur-sm hover:bg-black/10 transition-colors cursor-pointer pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.05)]"
                >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                    </span>
                    <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-black drop-shadow-sm">
                        Zarezerwuj termin na 2027
                    </span>
                </a>
              </motion.div>
        </motion.div>


        {/* --- VIDEO LAYER (THE TV UNIT) --- */}
        <motion.div 
          style={{ 
            scale: videoScale,
            opacity: videoOpacity,
            willChange: "transform, opacity"
          }}
          className="relative z-20 w-full h-full md:w-auto md:h-auto flex flex-col items-center justify-center transform-gpu"
        >
            {/* === SCREEN CONTAINER === */}
            <motion.div 
              className="relative w-full h-full md:aspect-[4/3] md:h-[70vh] overflow-hidden bg-black shadow-none md:shadow-2xl origin-center box-border transform-gpu"
              style={{
                borderRadius: typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopRadius : videoRadius,
                transform: "translateZ(0)",
                willChange: "border-radius, transform",
                // SAFARI FIX: Isolation + WebkitMaskImage forces Safari to respect border-radius with overflow:hidden on GPU layers
                isolation: "isolate",
                WebkitMaskImage: "-webkit-radial-gradient(white, black)" 
              }}
            >
                {/* 1. PHYSICAL BEZEL (Overlay) - DESKTOP ONLY */}
                <div className="hidden md:block absolute inset-0 z-50 pointer-events-none rounded-[inherit] shadow-[inset_0_0_0_24px_#080808]"></div>

                {/* 2. Tube Glass Reflection (Głębia) */}
                <div className="absolute inset-0 z-40 pointer-events-none rounded-[inherit] shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] md:shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]"></div>

                {/* CRT NOISE & SCANLINES */}
                <div className="absolute inset-0 pointer-events-none z-30 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="absolute inset-0 pointer-events-none z-30 opacity-15" style={{
                    background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                    backgroundSize: "100% 2px, 3px 100%"
                }}></div>

                {/* DYNAMIC VIGNETTE */}
                <motion.div 
                  style={{ opacity: vignetteOpacity }}
                  className="absolute inset-0 z-30 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] md:shadow-[inset_0_0_300px_rgba(0,0,0,1)]"
                />
                
                {/* The Video */}
                <video 
                  src="https://sobotkiweddings.pl/wp-content/uploads/2026/02/hero–video.mp4" 
                  autoPlay muted loop playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-90 md:opacity-90"
                />

                {/* Inner Content (Fades out quickly) */}
                <motion.div 
                    style={{ opacity: contentOpacity }}
                    className="absolute inset-0 z-40 p-6 md:p-10 flex flex-col justify-between text-white"
                >
                    <div className="hidden md:flex justify-between w-full">
                      <div className="flex gap-2 items-center text-[10px] font-bold uppercase tracking-widest text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span>AV-1 Input</span>
                      </div>
                      <div className="flex gap-2 items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
                          <Volume2 size={14} /> 
                          <span>Hi-Fi Stereo</span>
                      </div>
                    </div>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full mix-blend-overlay px-4">
                        <h2 className="font-playfair italic text-4xl md:text-5xl lg:text-6xl leading-tight opacity-90">
                          Wzruszające filmy<br/>i naturalne zdjęcia ślubne
                        </h2>
                    </div>

                    <div className="flex justify-between items-end w-full mt-auto">
                      <span className="font-sans text-[9px] uppercase tracking-widest opacity-50 md:hidden">Scroll to explore</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* === CONTROL PANEL (DESKTOP ONLY) === */}
            <div className="hidden md:flex w-full h-20 bg-[#121212] border-t-4 border-[#0a0a0a] items-center px-10 justify-between relative z-20 rounded-b-xl shadow-2xl mx-auto max-w-[calc(100%-48px)] -mt-1">
                {/* Texture Overlay for Plastic Look */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                
                {/* Left: Branding */}
                <div className="flex flex-col relative z-10">
                   <div className="flex items-center gap-2">
                      <Zap size={12} className="text-gray-600" />
                      <span className="font-sans font-black text-gray-500 text-[11px] tracking-[0.25em] uppercase">SOBOTKI WEDDINGS</span>
                   </div>
                   <span className="font-mono text-gray-700 text-[9px] mt-1 tracking-wider pl-5 uppercase">Zapytaj o termin na 2027</span>
                </div>

                {/* Center: Decorative Vents/Lines */}
                <div className="flex gap-1.5 h-6 opacity-30">
                   {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="w-1 bg-[#2a2a2a] h-full rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)]"></div>
                   ))}
                </div>

                {/* Right: Controls & LEDs */}
                <div className="flex items-center gap-8 relative z-10">
                    <div className="flex gap-3 items-center">
                        {/* Red LED (Off/Standby) */}
                        <div className="flex flex-col items-center gap-1">
                           <div className="w-2 h-2 rounded-full bg-red-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-red-950"></div>
                           <span className="text-[6px] uppercase font-sans tracking-widest text-gray-700">Stby</span>
                        </div>
                        {/* Green LED (On) */}
                        <div className="flex flex-col items-center gap-1">
                           <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e,inset_0_1px_3px_rgba(255,255,255,0.4)] border border-green-600"></div>
                           <span className="text-[6px] uppercase font-sans tracking-widest text-gray-500">Pwr</span>
                        </div>
                    </div>

                    {/* Power Button */}
                    <div className="relative group cursor-pointer">
                       <div className="absolute -inset-1 bg-gradient-to-br from-gray-800 to-black rounded-full blur-[1px] opacity-70"></div>
                       <button className="w-10 h-10 rounded-full bg-[#181818] border border-[#2a2a2a] shadow-[inset_0_-3px_5px_rgba(0,0,0,1),0_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-[1px] active:shadow-[inset_0_2px_5px_rgba(0,0,0,1)] transition-all">
                          <Power size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" strokeWidth={3} />
                       </button>
                    </div>
                </div>
            </div>

        </motion.div>
        
      </div>
    </section>
  );
};