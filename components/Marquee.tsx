import React from 'react';
import { motion } from 'framer-motion';

export const Marquee: React.FC = () => {
  // Używamy "•" (bullet) jako separatora
  const content = "ponadczasowe zdjęcia   •   filmowe kadry   •   wzruszające filmy   •   autentyczne uczucia   •   ";
  // Zwiększamy ilość powtórzeń, ponieważ tekst jest mniejszy
  const repeatedText = Array(20).fill(content).join("");

  return (
    <div className="w-full bg-[#FDF107] py-4 overflow-hidden relative z-30 border-y border-black/5">
      <motion.div
        className="flex whitespace-nowrap"
        // Przesuwamy o znaczną wartość, aby pętla była płynna
        animate={{ x: [0, -2000] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 20, 
        }}
      >
        <p className="text-black font-playfair italic text-2xl md:text-3xl tracking-wide font-medium opacity-90">
          {repeatedText}
        </p>
      </motion.div>
    </div>
  );
};
