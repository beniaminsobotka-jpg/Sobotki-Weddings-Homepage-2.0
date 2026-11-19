import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { Seo } from '../components/Seo';

type PortfolioItem = {
  id: number;
  type: 'image' | 'video';
  src: string;
  previewSrc?: string;
  title: string;
  category: string;
  location: string;
  alt: string;
  aspectRatio: string;
  width: number;
  height: number;
};

// --- DATA GENERATION ---
const generatePortfolio = () => {
  const categories = ["Wedding", "Elopement", "Editorial", "Black & White"];
  const locations = ["Toskania", "Warszawa", "Tatry", "Sycylia", "Mazury", "Kraków", "Islandia"];

  // 1. Generate Images. Most of the original set is landscape, so each keeps its real size.
  const landscapeIds = new Set([2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 17, 19, 22, 23, 24, 26, 29, 30, 33, 34, 35]);
  const images: PortfolioItem[] = Array.from({ length: 35 }, (_, i) => {
    const id = i + 1;
    const landscape = landscapeIds.has(id);
    return {
      id,
      type: 'image',
      src: `/uploads/2026/02/Portfolio_Sobotki_Weddings_${id}.avif`,
      title: `Story No. ${id}`,
      category: categories[id % categories.length],
      location: locations[id % locations.length],
      alt: `Fotografia ślubna Sobotki Weddings - ${categories[id % categories.length]} w ${locations[id % locations.length]}`,
      aspectRatio: landscape ? '3 / 2' : '2 / 3',
      width: landscape ? 2048 : 1365,
      height: landscape ? 1365 : 2048,
    };
  });

  const recentImages: PortfolioItem[] = [
    {
      id: 2001,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-01-ceremony-motion.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-01-ceremony-motion-preview.avif',
      title: 'Światło i ruch',
      category: 'Black & White',
      location: 'Ceremonia',
      alt: 'Artystyczna czarno-biała fotografia wnętrza kościoła w ruchu',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2002,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-02-couple-flash.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-02-couple-flash-preview.avif',
      title: 'Tuż po ceremonii',
      category: 'Wedding',
      location: 'Polska',
      alt: 'Roześmiana para młoda sfotografowana z reporterskim błyskiem',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2003,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-03-wedding-rings.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-03-wedding-rings-preview.avif',
      title: 'Obrączki',
      category: 'Black & White',
      location: 'Polska',
      alt: 'Czarno-białe zbliżenie dłoni nowożeńców i obrączek',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2004,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-04-wedding-car.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-04-wedding-car-preview.avif',
      title: 'W drodze',
      category: 'Wedding',
      location: 'Polska',
      alt: 'Uśmiechnięta para młoda w samochodzie uchwycona w ruchu',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2005,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-05-champagne.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-05-champagne-preview.avif',
      title: 'Toast',
      category: 'Wedding',
      location: 'Przyjęcie',
      alt: 'Panna młoda nalewająca szampana podczas przyjęcia weselnego',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2006,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-06-couple-motion.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-06-couple-motion-preview.avif',
      title: 'Bez pozowania',
      category: 'Black & White',
      location: 'Plener',
      alt: 'Dynamiczny czarno-biały portret bawiącej się pary młodej',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2007,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-07-couple-portrait.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-07-couple-portrait-preview.avif',
      title: 'Blisko',
      category: 'Editorial',
      location: 'Plener',
      alt: 'Bliski portret pary młodej pod welonem',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2008,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-08-groom-preparations.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-08-groom-preparations-preview.avif',
      title: 'Przygotowania',
      category: 'Black & White',
      location: 'Polska',
      alt: 'Czarno-biały reportaż z przygotowań pana młodego z rodziną',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2009,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-09-first-dance.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-09-first-dance-preview.avif',
      title: 'Tylko wy',
      category: 'Black & White',
      location: 'Przyjęcie',
      alt: 'Czarno-biały, emocjonalny kadr obejmującej się pary młodej',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2010,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-10-wedding-dance.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-10-wedding-dance-preview.avif',
      title: 'Pierwszy taniec',
      category: 'Wedding',
      location: 'Przyjęcie',
      alt: 'Para młoda podczas tańca w ciepłym świetle sali weselnej',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2011,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-11-wedding-guest.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-11-wedding-guest-preview.avif',
      title: 'Mali goście',
      category: 'Black & White',
      location: 'Przyjęcie',
      alt: 'Czarno-biały reporterski kadr dziecka w okularach przeciwsłonecznych',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2012,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-12-golden-hour.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-12-golden-hour-preview.avif',
      title: 'Złota godzina',
      category: 'Editorial',
      location: 'Plener',
      alt: 'Roześmiana para młoda podczas sesji o zachodzie słońca',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
  ];

  const latestImages: PortfolioItem[] = [
    {
      id: 2013,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-13-natalia-maciej-palace.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-13-natalia-maciej-palace-preview.avif',
      title: 'W stronę słońca',
      category: 'Editorial',
      location: 'Plener',
      alt: 'Para młoda biegnąca przed pałacem podczas sesji ślubnej',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2014,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-14-natalia-maciej-veil.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-14-natalia-maciej-veil-preview.avif',
      title: 'Pod welonem',
      category: 'Editorial',
      location: 'Plener',
      alt: 'Intymny portret pary młodej skrytej pod welonem',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2015,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-15-alicja-norbert-chairs.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-15-alicja-norbert-chairs-preview.avif',
      title: 'Po ceremonii',
      category: 'Black & White',
      location: 'Plener',
      alt: 'Czarno-biały portret pary młodej pośród krzeseł po ceremonii',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2016,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-16-alicja-norbert-guests.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-16-alicja-norbert-guests-preview.avif',
      title: 'Wśród najbliższych',
      category: 'Black & White',
      location: 'Ceremonia',
      alt: 'Czarno-biała fotografia pocałunku pary młodej wśród gości',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
  ];

  const newestImages: PortfolioItem[] = [
    {
      id: 2017,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-17-luiza-steffen-manor.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-17-luiza-steffen-manor-preview.avif',
      title: 'Pałacowe kadry',
      category: 'Editorial',
      location: 'Plener',
      alt: 'Para młoda przed pałacem podczas sesji ślubnej',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2018,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-18-luiza-steffen-guest.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-18-luiza-steffen-guest-preview.avif',
      title: 'Wzruszenie',
      category: 'Black & White',
      location: 'Przyjęcie',
      alt: 'Czarno-biały reporterski portret wzruszonego gościa weselnego',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2019,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-19-luiza-steffen-laughter.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-19-luiza-steffen-laughter-preview.avif',
      title: 'Szczery śmiech',
      category: 'Black & White',
      location: 'Przyjęcie',
      alt: 'Czarno-biała fotografia roześmianej panny młodej przy weselnym stole',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2020,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-20-luiza-steffen-party.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-20-luiza-steffen-party-preview.avif',
      title: 'Pełna energia',
      category: 'Wedding',
      location: 'Przyjęcie',
      alt: 'Energetyczny reporterski kadr gości podczas przyjęcia weselnego',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2021,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-21-alicja-norbert-chairs-color.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-21-alicja-norbert-chairs-color-preview.avif',
      title: 'Po ceremonii',
      category: 'Editorial',
      location: 'Plener',
      alt: 'Portret Alicji i Norberta pośród krzeseł po ceremonii',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
  ];

  const additions: PortfolioItem[] = [
    {
      id: 2022,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-22-reception-cheer.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-22-reception-cheer-preview.avif',
      title: 'Wszyscy w górę',
      category: 'Black & White',
      location: 'Przyjęcie',
      alt: 'Goście wiwatujący przy stole podczas przyjęcia w ogrodzie',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2023,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-23-rings-golden-frame.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-23-rings-golden-frame-preview.avif',
      title: 'Obrączki w złotej ramie',
      category: 'Editorial',
      location: 'Detale',
      alt: 'Dłonie pary młodej z obrączkami na tle obrazu w złotej ramie',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2024,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-24-guest-laughter.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-24-guest-laughter-preview.avif',
      title: 'Najlepsze życzenia',
      category: 'Black & White',
      location: 'Ceremonia',
      alt: 'Roześmiany gość składający życzenia parze młodej',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2025,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-25-church-ceremony.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-25-church-ceremony-preview.avif',
      title: 'Przed ołtarzem',
      category: 'Black & White',
      location: 'Ceremonia',
      alt: 'Para młoda klęcząca przed ołtarzem podczas ceremonii w kościele',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2026,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-26-masquerade-guests.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-26-masquerade-guests-preview.avif',
      title: 'Bal maskowy',
      category: 'Editorial',
      location: 'Przyjęcie',
      alt: 'Goście w maskach na schodach przed wejściem do sali',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2027,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-27-masquerade-couple.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-27-masquerade-couple-preview.avif',
      title: 'Maskarada',
      category: 'Editorial',
      location: 'Przyjęcie',
      alt: 'Para młoda w czarnych maskach wśród czerwonej dekoracji',
      aspectRatio: '2 / 3',
      width: 1200,
      height: 1800,
    },
    {
      id: 2028,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-28-sparkler-exit.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-28-sparkler-exit-preview.avif',
      title: 'Wielkie wyjście',
      category: 'Wedding',
      location: 'Przyjęcie',
      alt: 'Para młoda w kabriolecie wśród gości z zimnymi ogniami',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
    {
      id: 2029,
      type: 'image',
      src: '/uploads/2026/07/portfolio/portfolio-2026-29-veil-close.avif',
      previewSrc: '/uploads/2026/07/portfolio/portfolio-2026-29-veil-close-preview.avif',
      title: 'Bliżej',
      category: 'Editorial',
      location: 'Plener',
      alt: 'Para młoda twarzą w twarz pod welonem',
      aspectRatio: '3 / 2',
      width: 1800,
      height: 1200,
    },
  ];

  const combined = [...images];

  // 2. Distribute the newest photographs through the full story instead of
  // grouping them at the end. This keeps colour and black-and-white frames balanced.
  const insertPositions = [2, 7, 11, 16, 20, 25, 29, 34, 38, 42, 46, 49];
  recentImages.forEach((image, index) => {
    combined.splice(insertPositions[index], 0, image);
  });

  const latestInsertPositions = [5, 18, 35, 47];
  latestImages.forEach((image, index) => {
    combined.splice(latestInsertPositions[index], 0, image);
  });

  const newestInsertPositions = [8, 20, 32, 43, 52];
  newestImages.forEach((image, index) => {
    combined.splice(newestInsertPositions[index], 0, image);
  });

  const additionInsertPositions = [3, 11, 19, 26, 34, 41, 49, 57];
  additions.forEach((image, index) => {
    combined.splice(additionInsertPositions[index], 0, image);
  });

  return mixOrientations(combined);
};

/**
 * Interleave portrait and landscape frames evenly (keeping each group's own
 * order), so the masonry never stacks a run of the same shape.
 */
const mixOrientations = (items: PortfolioItem[]) => {
  const portraits = items.filter((item) => item.height > item.width);
  const landscapes = items.filter((item) => item.height <= item.width);
  const mixed: PortfolioItem[] = [];
  let p = 0;
  let l = 0;
  while (p < portraits.length || l < landscapes.length) {
    // Take from whichever group is further behind its fair share.
    const portraitShare = portraits.length ? p / portraits.length : 1;
    const landscapeShare = landscapes.length ? l / landscapes.length : 1;
    mixed.push(portraitShare <= landscapeShare ? portraits[p++] : landscapes[l++]);
  }
  return mixed;
};

const columnCountFor = (width: number) => (width >= 1280 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1);

const portfolioItems = generatePortfolio();

export const PortfolioPage: React.FC = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [loadedItems, setLoadedItems] = useState<Set<number>>(new Set());

  // Filter Logic removed
  const filteredItems = portfolioItems;

  // Masonry: each frame goes to one of the shortest columns, in reading order,
  // preferring a column that does not already end with a frame of the same shape.
  const [columnCount, setColumnCount] = useState(() => (typeof window === 'undefined' ? 3 : columnCountFor(window.innerWidth)));
  useEffect(() => {
    const update = () => setColumnCount(columnCountFor(window.innerWidth));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const columns = React.useMemo(() => {
    const result = Array.from({ length: columnCount }, () => [] as Array<{ item: PortfolioItem; index: number }>);
    const heights = Array.from({ length: columnCount }, () => 0);
    const isPortrait = (item: PortfolioItem) => item.height > item.width;
    filteredItems.forEach((item, index) => {
      const lowest = Math.min(...heights);
      const order = heights.map((height, column) => ({ height, column })).sort((a, b) => a.height - b.height);
      // Within roughly half a tile of the shortest column, alternate shapes.
      const alternating = order.find(({ height, column }) => {
        if (height > lowest + 0.55) return false;
        const last = result[column][result[column].length - 1]?.item;
        return !last || isPortrait(last) !== isPortrait(item);
      });
      const target = (alternating ?? order[0]).column;
      result[target].push({ item, index });
      heights[target] += item.height / item.width + 0.02;
    });
    return result;
  }, [columnCount, filteredItems]);

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
    <div className="min-h-screen bg-white pt-32 pb-12 md:pb-24 px-4 md:px-8 relative selection:bg-brand-black selection:text-white">
       <Seo page="portfolio" />

       <div className="max-w-[1800px] mx-auto relative z-10">
            
            {/* --- HEADER --- */}
            <header className="mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-24 gap-8 border-b border-brand-black/10 pb-12 md:w-[88%] lg:w-[80%]">
                <div className="w-full md:w-auto text-left">
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

            {/* --- MASONRY LAYOUT, at most 80% of the page width on desktop --- */}
            <section aria-labelledby="portfolio-gallery-heading" className="mx-auto flex items-start gap-3 md:w-[88%] lg:w-[80%]">
                <h2 id="portfolio-gallery-heading" className="sr-only">
                    Galeria portfolio Sobotki Weddings
                </h2>
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-3">
                    {column.map(({ item, index }) => (
                        <div
                            key={item.id}
                            onClick={() => openLightbox(index)}
                            className="relative group overflow-hidden cursor-zoom-in bg-gray-100"
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
                                            src={item.previewSrc ?? item.src}
                                            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 27vw, (min-width: 640px) 44vw, 92vw"
                                            alt={item.alt}
                                            loading="lazy"
                                            decoding="async"
                                            width={item.width}
                                            height={item.height}
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
                        className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
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
