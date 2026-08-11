import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

const editorialImages = [
  {
    id: 2001,
    src: '/uploads/2026/07/portfolio/portfolio-2026-01-ceremony-motion.avif',
    title: 'Światło i ruch',
    aspectRatio: '2/3',
  },
  {
    id: 2003,
    src: '/uploads/2026/07/portfolio/portfolio-2026-03-wedding-rings.avif',
    title: 'Obrączki',
    aspectRatio: '3/2',
  },
  {
    id: 2005,
    src: '/uploads/2026/07/portfolio/portfolio-2026-05-champagne.avif',
    title: 'Szampan',
    aspectRatio: '2/3',
  },
  {
    id: 2006,
    src: '/uploads/2026/07/portfolio/portfolio-2026-06-couple-motion.avif',
    title: 'W Ruchu',
    aspectRatio: '3/2',
  },
  {
    id: 2008,
    src: '/uploads/2026/07/portfolio/portfolio-2026-08-groom-preparations.avif',
    title: 'Przygotowania',
    aspectRatio: '3/2',
  },
  {
    id: 2012,
    src: '/uploads/2026/07/portfolio/portfolio-2026-12-golden-hour.avif',
    title: 'Golden Hour',
    aspectRatio: '2/3',
  },
  {
    id: 2013,
    src: '/uploads/2026/07/portfolio/portfolio-2026-13-natalia-maciej-palace.avif',
    title: 'Pałac',
    aspectRatio: '3/2',
  },
  {
    id: 2014,
    src: '/uploads/2026/07/portfolio/portfolio-2026-14-natalia-maciej-veil.avif',
    title: 'Welon',
    aspectRatio: '2/3',
  },
  {
    id: 2015,
    src: '/uploads/2026/07/portfolio/portfolio-2026-15-alicja-norbert-chairs.avif',
    title: 'Detale',
    aspectRatio: '2/3',
  },
  {
    id: 2018,
    src: '/uploads/2026/07/portfolio/portfolio-2026-18-luiza-steffen-guest.avif',
    title: 'Goście',
    aspectRatio: '2/3',
  }
];

export const EditorialHomepage: React.FC = () => {
  return (
    <>
      <Seo page="home" />
      
      <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-[#FAFAFA]">
        
        {/* HERO SECTION */}
        <section 
          className="relative w-full min-h-[90vh] md:min-h-screen flex flex-col justify-center items-center px-4 md:px-8 py-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/uploads/2026/07/portfolio/portfolio-2026-07-couple-portrait.avif')" }}
        >
          <div className="absolute inset-0 bg-black/40"></div> {/* Subtle dark overlay for text readability */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center z-10 w-full max-w-7xl mx-auto flex flex-col items-center mt-12 md:mt-0"
          >
            <h1 className="font-serif uppercase font-bold text-[11vw] sm:text-[9vw] md:text-[8vw] lg:text-[7vw] leading-[0.85] tracking-tighter mix-blend-normal z-20 text-white mb-4 drop-shadow-lg">
              Sobotki<br />
              <span className="font-playfair italic normal-case font-normal text-[13vw] sm:text-[11vw] md:text-[10vw] lg:text-[9vw] -mt-[2vw] block text-white">Weddings</span>
            </h1>
            
            <p className="mt-8 md:mt-16 text-xs md:text-sm tracking-[0.3em] uppercase text-white/90 max-w-md mx-auto font-semibold drop-shadow-md">
              Fotografia Ślubna • Editorial • Ponadczasowa Elegancja
            </p>
          </motion.div>
        </section>

        {/* PORTFOLIO GRID - MASONRY/EDITORIAL STYLE */}
        <section className="px-4 md:px-8 py-20 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="columns-1 md:columns-2 gap-4 md:gap-8 space-y-4 md:space-y-8">
              {editorialImages.map((img, idx) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: (idx % 3) * 0.1, ease: "easeOut" }}
                  className="break-inside-avoid relative group overflow-hidden bg-gray-100"
                >
                  <img 
                    src={img.src} 
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-1000 ease-out"
                    style={{ aspectRatio: img.aspectRatio }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-white font-playfair italic text-2xl drop-shadow-md">
                      {img.title}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* MINIMAL FOOTER / CALL TO ACTION */}
        <section className="w-full bg-[#1A1A1A] text-[#FAFAFA] py-32 px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            <h2 className="font-playfair italic text-5xl md:text-7xl mb-8 font-light">
              Porozmawiajmy o Waszym ślubie
            </h2>
            <p className="font-sans text-[#FAFAFA]/70 max-w-lg mb-12 leading-relaxed text-sm md:text-base">
              Fotografujemy emocje, detale i prawdziwe momenty. Pozwólcie nam opowiedzieć Waszą historię.
            </p>
            <Link 
              to="/kontakt"
              className="inline-block px-12 py-5 border border-white/30 hover:border-white hover:bg-white hover:text-[#1A1A1A] transition-all duration-300 uppercase tracking-widest text-xs font-semibold"
            >
              Zapytaj o termin
            </Link>
          </motion.div>
        </section>

      </div>
    </>
  );
};
