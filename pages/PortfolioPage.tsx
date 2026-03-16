import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { LiquidBackground } from '../components/LiquidBackground';
import { Seo } from '../components/Seo';

type PortfolioItem = {
  id: number;
  type: 'image' | 'video';
  src: string;
  title: string;
  category: string;
  location: string;
  alt: string;
  aspectRatio: string;
};

// --- DATA GENERATION ---
const generatePortfolio = () => {
  const categories = ["Wedding", "Elopement", "Editorial", "Black & White"];
  const locations = ["Toskania", "Warszawa", "Tatry", "Sycylia", "Mazury", "Kraków", "Islandia"];

  // 1. Generate Images
  const images: PortfolioItem[] = Array.from({ length: 35 }, (_, i) => {
    const id = i + 1;
    return {
      id,
      type: 'image',
      src: `/uploads/2026/02/Portfolio_Sobotki_Weddings_${id}.avif`,
      title: `Story No. ${id}`,
      category: categories[id % categories.length],
      location: locations[id % locations.length],
      alt: `Fotografia ślubna Sobotki Weddings - ${categories[id % categories.length]} w ${locations[id % locations.length]}`,
      aspectRatio: '2 / 3',
    };
  });

  // 2. Generate Videos
  // Explicitly defining URLs to handle case sensitivity differences (e.g. 3rd video has lowercase 'd')
  const videoUrls = [
      "/uploads/2026/02/Do-portfolio-1.mp4",
      "/uploads/2026/02/Do-portfolio-2.mp4",
      "/uploads/2026/02/do-Portfolio-3.mp4"
  ];

  const videos: PortfolioItem[] = videoUrls.map((src, i) => ({
    id: 1000 + i + 1, // Unique IDs for videos
    type: 'video',
    src: src,
    title: `Motion Story ${i + 1}`,
    category: 'Wedding', // Assign to a category (or make a new one 'Video')
    location: 'Film',
    alt: `Film ślubny Sobotki Weddings - realizacja ${i + 1}`,
    aspectRatio: '4 / 5',
  }));

  // 3. Weave them together (Insert videos at specific indices for visual balance)
  const combined = [...images];
  combined.splice(4, 0, videos[0]);  // Insert near top
  combined.splice(14, 0, videos[1]); // Insert middle
  combined.splice(24, 0, videos[2]); // Insert lower

  return combined;
};

const portfolioItems = generatePortfolio();

export const PortfolioPage: React.FC = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [loadedItems, setLoadedItems] = useState<Set<number>>(new Set());

  // Filter Logic removed
  const filteredItems = portfolioItems;

  // Error Handler
  const handleImageError = (id: number) => {
    setFailedImages(prev => new Set(prev).add(id));
  };

  const markItemAsLoaded = (id: number) => {
    setLoadedItems((prev) => {
      if (prev.has(id)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // --- LIGHTBOX LOGIC ---
  const openLightbox = (index: number) => setSelectedImageIndex(index);
  const closeLightbox = () => setSelectedImageIndex(null);
  
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex !== null) {
        setSelectedImageIndex((prev) => (prev! + 1) % filteredItems.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex !== null) {
        setSelectedImageIndex((prev) => (prev! - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  return (
    <div className="min-h-screen pt-32 pb-12 md:pb-24 px-4 md:px-8 relative selection:bg-brand-black selection:text-white">
       <Seo page="portfolio" />
       <LiquidBackground />
       
       <div className="max-w-[1800px] mx-auto relative z-10">
            
            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-24 gap-8 border-b border-brand-black/10 pb-12">
                <div>
                    <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-500 block mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-black rounded-full"></span>
                        Portfolio 2026
                    </span>
                    <h1 className="font-serif font-black text-6xl md:text-8xl lg:text-9xl uppercase tracking-tighter text-brand-black leading-[0.85]">
                        Wasze<br/>
                        <span className="font-playfair-italic text-gray-400 font-light lowercase ml-4 md:ml-8">historie</span>
                    </h1>
                </div>
            </header>

            {/* --- MASONRY LAYOUT (CSS COLUMNS) --- */}
            <section aria-labelledby="portfolio-gallery-heading" className="columns-1 md:columns-2 lg:columns-3 gap-3 space-y-3">
                <h2 id="portfolio-gallery-heading" className="sr-only">
                    Galeria portfolio Sobotki Weddings
                </h2>
                {filteredItems.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => openLightbox(index)}
                            className="break-inside-avoid mb-2 relative group overflow-hidden cursor-zoom-in bg-gray-200"
                        >
                            <div
                                className="relative w-full overflow-hidden bg-gray-200/80"
                                style={{ aspectRatio: item.aspectRatio }}
                            >
                                <div
                                    aria-hidden="true"
                                    className={`absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.42),rgba(255,255,255,0.14),rgba(255,255,255,0.42))] bg-[length:200%_100%] transition-opacity duration-500 ${
                                        loadedItems.has(item.id) ? 'opacity-0' : 'animate-pulse opacity-100'
                                    }`}
                                />
                                {item.type === 'video' ? (
                                    <div className="relative h-full w-full">
                                        <video
                                            src={item.src}
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="none"
                                            aria-hidden="true"
                                            onLoadedData={() => markItemAsLoaded(item.id)}
                                            className={`absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-[0.8s] ease-out group-hover:scale-105 ${
                                                loadedItems.has(item.id) ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        />
                                    </div>
                                ) : (
                                    !failedImages.has(item.id) ? (
                                        <img 
                                            src={item.src} 
                                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                            alt={item.alt}
                                            loading="lazy"
                                            decoding="async"
                                            width={1365}
                                            height={2048}
                                            onLoad={() => markItemAsLoaded(item.id)}
                                            onError={() => handleImageError(item.id)}
                                            className={`absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-[0.8s] ease-out group-hover:scale-105 ${
                                                loadedItems.has(item.id) ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-gray-400">
                                            <ImageOff size={32} className="mb-2 opacity-50" />
                                            <span className="font-sans text-[10px] uppercase tracking-widest text-center">Story #{item.id}</span>
                                            <span className="font-serif text-xs italic opacity-50 text-center mt-1">{item.title}</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
            </section>

            {/* --- LIGHTBOX MODAL --- */}
            <AnimatePresence>
                {selectedImageIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Podgląd elementu portfolio"
                        className="fixed inset-0 z-[100] bg-brand-paper/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                        onClick={closeLightbox}
                    >
                        <button 
                            type="button"
                            aria-label="Zamknij podgląd"
                            onClick={closeLightbox}
                            className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] w-12 h-12 rounded-full border border-brand-black/20 flex items-center justify-center hover:bg-brand-black hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <button 
                            type="button"
                            aria-label="Poprzedni element"
                            onClick={prevImage}
                            className="hidden md:flex absolute left-10 z-[110] w-14 h-14 rounded-full border border-brand-black/20 items-center justify-center hover:bg-brand-black hover:text-white transition-all"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        
                        <button 
                            type="button"
                            aria-label="Następny element"
                            onClick={nextImage}
                            className="hidden md:flex absolute right-10 z-[110] w-14 h-14 rounded-full border border-brand-black/20 items-center justify-center hover:bg-brand-black hover:text-white transition-all"
                        >
                            <ChevronRight size={28} />
                        </button>

                        <motion.div 
                            className="relative max-w-[90vw] max-h-[85vh] shadow-2xl overflow-hidden bg-gray-100"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()} 
                        >
                             {/* CONTENT SWITCH: VIDEO OR IMAGE */}
                             {filteredItems[selectedImageIndex].type === 'video' ? (
                                <video 
                                    src={filteredItems[selectedImageIndex].src} 
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[85vh] object-contain bg-black"
                                />
                             ) : (
                                 !failedImages.has(filteredItems[selectedImageIndex].id) ? (
                                    <img 
                                        src={filteredItems[selectedImageIndex].src} 
                                        alt={filteredItems[selectedImageIndex].alt}
                                        className="max-w-full max-h-[85vh] object-contain"
                                    />
                                 ) : (
                                    <div className="w-[80vw] h-[60vh] flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                         <ImageOff size={48} className="mb-4 opacity-50" />
                                         <p>Zdjęcie niedostępne</p>
                                    </div>
                                 )
                             )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

       </div>
    </div>
  );
};
