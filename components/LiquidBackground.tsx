import React from 'react';
import { motion } from 'framer-motion';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#F3F2ED] transform-gpu">
      {/* Orb 1 - Warm Gold */}
      <motion.div
        animate={{
          x: [-100, 100, -50],
          y: [-50, 100, -100],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        style={{ willChange: 'transform' }} // Hint to browser
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#E8B931] rounded-full mix-blend-multiply filter blur-[80px] md:blur-[120px] opacity-20 translate-z-0"
      />

      {/* Orb 2 - Soft Gray/Blue */}
      <motion.div
        animate={{
          x: [50, -100, 100],
          y: [100, -50, 50],
          scale: [1.2, 1, 1.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        style={{ willChange: 'transform' }} // Hint to browser
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#A0A0A0] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[140px] opacity-15 translate-z-0"
      />

      {/* Orb 3 - Light Accent */}
      <motion.div
        animate={{
          x: [-50, 50, -100],
          y: [50, -100, 50],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        style={{ willChange: 'transform' }} // Hint to browser
        className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-[#ffffff] rounded-full mix-blend-overlay filter blur-[80px] md:blur-[100px] opacity-40 translate-z-0"
      />
      
      {/* Noise Texture Overlay - Static, optimized */}
      <div className="absolute inset-0 noise-texture opacity-20 mix-blend-soft-light translate-z-0"></div>
    </div>
  );
};
