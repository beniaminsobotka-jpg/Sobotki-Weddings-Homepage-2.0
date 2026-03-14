import React from 'react';
import { motion } from 'framer-motion';

export const Marquee: React.FC = () => {
  const items = [
    'ponadczasowe zdjęcia',
    'filmowe kadry',
    'wzruszające filmy',
    'autentyczne uczucia',
  ];
  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <div
      data-typography-skip="true"
      className="w-full overflow-hidden border-y border-black/5 bg-[#FDF107] py-2 md:py-4 relative z-30"
    >
      <motion.div
        className="flex min-w-max whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 48,
        }}
      >
        {[0, 1].map((track) => (
          <div key={track} className="flex min-w-max shrink-0 items-center whitespace-nowrap">
            {repeatedItems.map((item, index) => (
              <span
                key={`${track}-${item}-${index}`}
                className="shrink-0 whitespace-nowrap px-3 text-black font-playfair text-[1.65rem] italic font-medium leading-none opacity-90 md:px-5 md:text-3xl"
              >
                {item}
                <span className="px-3 md:px-5" aria-hidden="true">
                  •
                </span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
