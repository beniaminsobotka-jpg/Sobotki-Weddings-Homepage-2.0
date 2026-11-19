import React from 'react';
import { Review } from '../types';
import { motion } from 'framer-motion';

const reviews: Review[] = [
  {
    name: "Adrianna",
    role: "Pani Młoda",
    date: "2023",
    content: "Z całego serca mogę polecić wszystkim Sobotki Weddings! Ma niezwykłą umiejętność - był obecny, ale nie nachalnie. Potrafi wyczarować cudowne kadry."
  },
  {
    name: "Aleksandra & Patryk",
    role: "Para Młoda",
    date: "Czerwiec 2023",
    content: "Ania i Benek to strzał w dziesiątkę! Życzliwi, pomocni, wykonują swoją pracę 'po cichu', łapiąc najbardziej wzruszające momenty."
  }
];

export const Reviews: React.FC = () => {
  return (
    <section className="pt-8 pb-8 md:pt-16 md:pb-32 px-4 md:px-8 relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-3 md:mb-24">
          <h2 className="text-brand-black flex flex-col items-center leading-none gap-2">
            <span className="font-serif font-black uppercase text-5xl md:text-7xl scale-x-[1.32] origin-center inline-block drop-shadow-sm">
              Miłe
            </span>
            <span className="font-playfair-italic font-normal normal-case tracking-normal text-gray-500/80 text-5xl md:text-7xl">
              Słowa
            </span>
          </h2>
          <p className="mt-8 font-sans text-xs md:text-sm tracking-[0.15em] uppercase text-gray-500 max-w-2xl mx-auto leading-relaxed mix-blend-multiply">
            Jesteśmy dumni ze 100% zadowolenia naszych par.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2 gap-2 md:gap-10 items-stretch">
          {reviews.map((review, i) => (
            <motion.article 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              // GLASS CARD STYLE
              className="flex h-full flex-col group p-3 md:p-6 rounded-3xl backdrop-blur-md bg-white/40 border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all duration-500 hover:-translate-y-2"
            >

              {/* Content */}
              <div className="flex flex-1 flex-col text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 border-b border-brand-black/10 pb-2 md:mb-4 md:pb-4">
                    <h3 className="font-serif font-bold text-xl uppercase text-brand-black">{review.name}</h3>
                    <span className="font-sans text-[9px] uppercase tracking-widest text-gray-500 mt-1 md:mt-0">{review.role}</span>
                </div>
                
                <p className="font-playfair-italic text-lg text-brand-black/80 leading-relaxed">
                  "{review.content}"
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
