import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const DURATION = 1100;

export const Loader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const countRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Count on the compositor-friendly path: write the number straight to the DOM
    // instead of re-rendering React 100 times, and finish in ~1 s instead of ~3 s.
    let frame = 0;
    let done = false;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(eased * 100);
      if (countRef.current) countRef.current.textContent = `${value}%`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${eased})`;
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else if (!done) {
        done = true;
        window.setTimeout(onComplete, 250);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F3F2ED] text-brand-black"
    >
      <div ref={countRef} className="font-serif italic text-6xl md:text-8xl mb-4 tabular-nums">
        0%
      </div>
      <div className="font-sans text-xs tracking-[0.4em] uppercase text-gray-500">
        Ładowanie...
      </div>
      <div className="mt-8 h-px w-40 overflow-hidden bg-black/10">
        <div ref={barRef} className="h-full w-full origin-left bg-brand-black" style={{ transform: 'scaleX(0)' }} />
      </div>
    </motion.div>
  );
};
