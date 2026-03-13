import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Camera } from 'lucide-react';

const cardContentVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.32 + index * 0.08,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

export const VideoSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax dla tekstu w tle
  const xMovement = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const yMovement = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section ref={containerRef} id="film" className="pt-2 pb-0 md:pt-40 md:pb-16 relative overflow-hidden">
      
      {/* 1. BACKGROUND KINETIC TYPOGRAPHY (Parallax) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full pointer-events-none opacity-[0.04] select-none z-0">
         <motion.div style={{ x: xMovement }} className="whitespace-nowrap">
            <span className="font-serif font-[1000] text-[25vw] leading-none text-brand-black uppercase tracking-tighter">
              Foto & Video &nbsp; Foto & Video
            </span>
         </motion.div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 relative z-10">
         
         <div className="flex flex-col lg:flex-row items-center lg:items-end relative">
            
            {/* 2. VIDEO CONTAINER */}
            <motion.div 
                style={{ y: yMovement }}
                className="w-full lg:w-[85%] aspect-[16/9] md:aspect-[21/9] relative rounded-[40px] overflow-hidden shadow-2xl"
            >
                {/* Video */}
                <video 
                    className="w-full h-full object-cover transform scale-105"
                    src="https://sobotkiweddings.pl/wp-content/uploads/2026/02/hero–video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
                
                {/* Cinematic Overlay (Grain + Grading) */}
                <div className="absolute inset-0 bg-brand-black/10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                {/* Mobile Play Button hint */}
                <div className="absolute inset-0 flex items-center justify-center lg:hidden pointer-events-none">
                     <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                        <Play fill="white" className="text-white ml-1" size={24} />
                     </div>
                </div>
            </motion.div>


            {/* 3. LIQUID GLASS TEXT CARD (Overlapping) */}
            <motion.div 
                initial={{ opacity: 0, y: 72, scale: 0.94, filter: "blur(18px)" }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 1.05, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="lg:absolute lg:bottom-12 lg:right-12 w-[90%] lg:w-[450px] -mt-24 lg:mt-0 z-20"
            >
                <div className="liquid-glass liquid-glass-interactive rounded-3xl p-4 md:p-12 backdrop-blur-xl border border-white/60">
                    
                    {/* Badge */}
                    <motion.div
                        custom={0}
                        variants={cardContentVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                        className="flex justify-between items-start mb-3"
                    >
                        <div className="flex items-center gap-4">
                             {/* Pstryk */}
                             <div className="flex items-center gap-2">
                                <Camera size={16} className="text-brand-black/60" strokeWidth={2} />
                                <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-black/60">Pstryk</span>
                             </div>

                             {/* Separator - Ampersand */}
                             <span className="font-serif italic text-brand-black/40 text-lg">&</span>

                             {/* Rec */}
                             <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                                <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-black/60">Rec</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.h3
                        custom={1}
                        variants={cardContentVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                        className="font-serif font-black text-4xl md:text-5xl uppercase leading-[0.9] text-brand-black mb-2"
                    >
                        Foto +<br/>Video
                    </motion.h3>
                    
                    <motion.p
                        custom={2}
                        variants={cardContentVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                        className="font-sans text-brand-black/70 text-sm leading-relaxed mb-1"
                    >
                        Nie interesują nas sztywne pozy. Szukamy ruchu, wiatru we włosach i nieoczywistych kadrów. Tworzymy przestrzeń, w której możecie być sobą, łącząc reporterską uważność z filmową estetyką.
                    </motion.p>

                    <motion.p
                        custom={3}
                        variants={cardContentVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                        className="font-sans text-brand-black/70 text-sm leading-relaxed mb-0"
                    >
                        Jesteśmy duetem foto+video. Dzięki temu zyskujecie spójną estetykę pomiędzy zdjęciami i filmem, doskonałą komunikację w dniu ślubu i pełniejsze uchwycenie emocji bez chaosu organizacyjnego. Zyskujecie komfort, że wszystko jest dopracowane przez zespół, który działa jak jeden organizm.
                    </motion.p>

                </div>
            </motion.div>

         </div>

      </div>
      
    </section>
  );
};
