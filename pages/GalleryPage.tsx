import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Images,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

type GalleryPhoto = {
  id: string;
  name: string;
  rev: string;
  modifiedAt: string;
  size: number;
  thumbnailUrl: string;
  largeUrl: string;
  downloadUrl: string;
};

type GalleryData = {
  gallery: {
    slug: string;
    title: string;
    date: string;
    coverUrl: string;
  };
  photos: GalleryPhoto[];
  refreshAfterMs: number;
  generatedAt: string;
};

const DEFAULT_REFRESH_INTERVAL = 10_000;

const GalleryBrand = ({ light = true }: { light?: boolean }) => (
  <Link
    to="/"
    aria-label="Sobotki Weddings — strona główna"
    className={`inline-flex flex-col items-center leading-none transition-opacity hover:opacity-75 ${
      light ? 'text-white' : 'text-brand-black'
    }`}
  >
    <span className="font-serif text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">
      Sobotki
    </span>
    <span
      className={`-mt-0.5 font-playfair text-sm italic lowercase sm:text-base ${
        light ? 'text-white/70' : 'text-black/48'
      }`}
    >
      portraits
    </span>
  </Link>
);

export const GalleryPage: React.FC = () => {
  const { slug = '' } = useParams();
  const [data, setData] = useState<GalleryData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const requestInProgress = useRef(false);

  const loadGallery = useCallback(
    async (silent = false) => {
      if (!slug || requestInProgress.current) {
        return;
      }

      requestInProgress.current = true;

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/gallery?slug=${encodeURIComponent(slug)}`, {
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || 'Nie udało się wczytać galerii.');
        }

        setData(payload as GalleryData);
        setError('');
      } catch (loadError) {
        if (!silent || !data) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Nie udało się wczytać galerii.'
          );
        }
      } finally {
        requestInProgress.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [data, slug]
  );

  useEffect(() => {
    void loadGallery(false);
  }, [slug]);

  useEffect(() => {
    const refreshInterval = Math.max(
      5_000,
      data?.refreshAfterMs || DEFAULT_REFRESH_INTERVAL
    );
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadGallery(true);
      }
    }, refreshInterval);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadGallery(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data?.refreshAfterMs, loadGallery]);

  useEffect(() => {
    const previousTitle = document.title;
    const robotsMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robotsMeta?.content;
    const activeRobotsMeta = robotsMeta || document.createElement('meta');

    activeRobotsMeta.name = 'robots';
    activeRobotsMeta.content = 'noindex, nofollow, noarchive';

    if (!robotsMeta) {
      document.head.appendChild(activeRobotsMeta);
    }

    document.title = data?.gallery.title
      ? `${data.gallery.title} — galeria Sobotki Portraits`
      : 'Galeria — Sobotki Portraits';

    return () => {
      document.title = previousTitle;

      if (robotsMeta && previousRobots) {
        robotsMeta.content = previousRobots;
      } else if (!robotsMeta) {
        activeRobotsMeta.remove();
      }
    };
  }, [data?.gallery.title]);

  const photos = data?.photos || [];
  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex] || null;

  const showPrevious = useCallback(() => {
    if (!photos.length) {
      return;
    }

    setSelectedIndex((current) =>
      current === null ? 0 : (current - 1 + photos.length) % photos.length
    );
  }, [photos.length]);

  const showNext = useCallback(() => {
    if (!photos.length) {
      return;
    }

    setSelectedIndex((current) =>
      current === null ? 0 : (current + 1) % photos.length
    );
  }, [photos.length]);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedIndex(null);
      } else if (event.key === 'ArrowLeft') {
        showPrevious();
      } else if (event.key === 'ArrowRight') {
        showNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPhoto, showNext, showPrevious]);

  const galleryStatus = useMemo(() => {
    if (!data) {
      return '';
    }

    if (photos.length === 0) {
      return 'Czekamy na pierwsze zdjęcie';
    }

    if (photos.length === 1) {
      return '1 portret w galerii';
    }

    if (photos.length >= 2 && photos.length <= 4) {
      return `${photos.length} portrety w galerii`;
    }

    return `${photos.length} portretów w galerii`;
  }, [data, photos.length]);

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-brand-black">
      <header
        className={`relative flex flex-col overflow-hidden bg-[#111111] px-5 pt-7 text-white sm:px-8 sm:pt-9 ${
          data?.gallery.coverUrl
            ? 'min-h-[72svh] pb-10 sm:min-h-[78svh] sm:pb-14'
            : 'pb-16 sm:pb-20'
        }`}
      >
        {data?.gallery.coverUrl && (
          <>
            <img
              src={data.gallery.coverUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-[#111111]"
              aria-hidden="true"
            />
          </>
        )}
        <div
          className={`pointer-events-none absolute inset-0 ${
            data?.gallery.coverUrl ? 'opacity-[0.07]' : 'opacity-[0.035]'
          }`}
          style={{ backgroundImage: 'url(/noise.svg)' }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1500px] justify-center">
          <GalleryBrand />
        </div>

        <div
          className={`relative mx-auto max-w-3xl text-center ${
            data?.gallery.coverUrl ? 'mt-auto pt-32' : 'mt-16 sm:mt-20'
          }`}
        >
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-white/45 sm:text-xs">
            Wasza galeria
          </p>
          <h1 className="mt-5 text-balance font-serif text-[clamp(2.7rem,11vw,6.5rem)] font-black uppercase leading-[0.86] tracking-[-0.055em]">
            {data?.gallery.title || 'Wasze portrety'}
          </h1>
          {data?.gallery.date && (
            <p className="mt-6 font-playfair text-lg italic text-white/58 sm:text-xl">
              {data.gallery.date}
            </p>
          )}
          <p className="mx-auto mt-7 max-w-xl font-sans text-sm font-light leading-6 text-white/66 sm:text-base sm:leading-7">
            Znajdźcie swój kadr. Nowe zdjęcia pojawiają się tutaj automatycznie,
            chwilę po wykonaniu portretu.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-3 pb-20 pt-7 sm:px-6 sm:pb-28 sm:pt-10 lg:px-8">
        <div className="mb-7 flex items-center justify-between gap-4 px-1 sm:mb-9">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/45">
              <Images size={16} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-black/55 sm:text-xs">
                {galleryStatus || 'Galeria portretów'}
              </p>
              <p className="mt-0.5 font-sans text-[10px] text-black/35">
                Odświeżanie automatyczne
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadGallery(true)}
            disabled={isRefreshing}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-black/10 px-4 font-sans text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Odśwież</span>
          </button>
        </div>

        {isLoading && !data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className={`animate-pulse bg-black/[0.07] ${index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[4/5]'}`}
                aria-hidden="true"
              />
            ))}
            <p className="sr-only" role="status">Wczytuję zdjęcia…</p>
          </div>
        )}

        {!isLoading && error && !data && (
          <div className="mx-auto flex min-h-[42vh] max-w-xl flex-col items-center justify-center px-6 text-center">
            <Camera size={36} strokeWidth={1.3} className="text-black/30" aria-hidden="true" />
            <h2 className="mt-6 font-serif text-3xl font-black uppercase tracking-[-0.04em]">
              Galeria jest niedostępna
            </h2>
            <p className="mt-4 font-sans text-sm leading-6 text-black/55">{error}</p>
            <button
              type="button"
              onClick={() => void loadGallery(false)}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-6 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Spróbuj ponownie
            </button>
          </div>
        )}

        {!isLoading && data && photos.length === 0 && (
          <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center px-6 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-white/35">
              <Camera size={26} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-3xl font-black uppercase tracking-[-0.04em]">
              Pierwszy portret pojawi się za chwilę
            </h2>
            <p className="mt-4 font-sans text-sm leading-6 text-black/52">
              Nie musicie nic robić — galeria odświeży się sama.
            </p>
          </div>
        )}

        {photos.length > 0 && (
          <div className="columns-2 gap-2 sm:columns-3 sm:gap-4 lg:columns-4">
            {photos.map((photo, index) => (
              <motion.button
                type="button"
                key={photo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.025, 0.35) }}
                onClick={() => setSelectedIndex(index)}
                className="group relative mb-2 block w-full break-inside-avoid overflow-hidden bg-black/[0.08] text-left sm:mb-4"
                aria-label={`Otwórz portret ${index + 1} z ${photos.length}`}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={`Portret ${index + 1}`}
                  loading={index < 6 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-auto w-full transition duration-700 ease-out group-hover:scale-[1.015] group-hover:opacity-90"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-10 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                  Zobacz zdjęcie
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-black/[0.08] px-6 py-9 text-center">
        <GalleryBrand light={false} />
        <p className="mt-4 font-sans text-[9px] uppercase tracking-[0.2em] text-black/35">
          Portrety tworzone na żywo
        </p>
      </footer>

      <AnimatePresence>
        {selectedPhoto && selectedIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Portret ${selectedIndex + 1} z ${photos.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex flex-col bg-black text-white"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedIndex(null);
              }
            }}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              touchStartX.current = null;

              if (startX === null || endX === undefined) {
                return;
              }

              const distance = endX - startX;

              if (Math.abs(distance) > 55) {
                if (distance > 0) {
                  showPrevious();
                } else {
                  showNext();
                }
              }
            }}
          >
            <div className="flex min-h-16 items-center justify-between border-b border-white/10 px-3 sm:px-5">
              <span className="px-2 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/52">
                {selectedIndex + 1} / {photos.length}
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={selectedPhoto.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:px-4"
                  aria-label="Pobierz zdjęcie w pełnej jakości"
                >
                  <Download size={17} aria-hidden="true" />
                  <span className="hidden sm:inline">Pobierz</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Zamknij podgląd"
                >
                  <X size={21} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center p-2 sm:p-6">
              <motion.img
                key={selectedPhoto.id}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                src={selectedPhoto.largeUrl}
                alt={`Portret ${selectedIndex + 1}`}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black sm:flex"
                    aria-label="Poprzednie zdjęcie"
                  >
                    <ChevronLeft size={24} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black sm:flex"
                    aria-label="Następne zdjęcie"
                  >
                    <ChevronRight size={24} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-3 text-center font-sans text-[9px] uppercase tracking-[0.16em] text-white/35 sm:hidden">
              Przesuń w bok, aby zobaczyć kolejne
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
