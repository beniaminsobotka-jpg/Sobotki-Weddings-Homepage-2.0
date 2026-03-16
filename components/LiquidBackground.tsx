import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#F3F2ED] transform-gpu">
      {/* Orb 1 - Warm Gold */}
      <div
        style={{ willChange: 'transform' }}
        className="liquid-orb liquid-orb-1 absolute top-[-10%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-[#E8B931] opacity-20 mix-blend-multiply blur-[80px] md:blur-[120px] translate-z-0"
      />

      {/* Orb 2 - Soft Gray/Blue */}
      <div
        style={{ willChange: 'transform' }}
        className="liquid-orb liquid-orb-2 absolute bottom-[-10%] right-[-10%] h-[60vw] w-[60vw] rounded-full bg-[#A0A0A0] opacity-15 mix-blend-multiply blur-[100px] md:blur-[140px] translate-z-0"
      />

      {/* Orb 3 - Light Accent */}
      <div
        style={{ willChange: 'transform' }}
        className="liquid-orb liquid-orb-3 absolute top-[40%] left-[30%] h-[40vw] w-[40vw] rounded-full bg-[#ffffff] opacity-40 mix-blend-overlay blur-[80px] md:blur-[100px] translate-z-0"
      />
      
      {/* Noise Texture Overlay - Static, optimized */}
      <div className="absolute inset-0 noise-texture opacity-20 mix-blend-soft-light translate-z-0"></div>
    </div>
  );
};
