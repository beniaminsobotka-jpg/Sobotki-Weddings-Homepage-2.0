import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const Loader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F3F2ED] text-brand-black"
    >
      <div className="font-serif italic text-6xl md:text-8xl mb-4">
        {count}%
      </div>
      <div className="font-sans text-xs tracking-[0.4em] uppercase text-gray-500">
        Ładowanie...
      </div>
    </motion.div>
  );
};