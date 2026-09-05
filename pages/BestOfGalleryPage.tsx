import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

type BestOfPhoto = {
  id: string;
  name: string;
  thumbnailUrl: string;
  largeUrl: string;
  downloadUrl: string;
};

type BestOfData = {
  gallery: {
    slug: string;
    title: string;
    photoCount: number;
  };
  photos: BestOfPhoto[];
};

const getErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    return typeof payload.error === 'string' ? payload.error : 'Nie udało się wczytać Best Of.';
  } catch {
    return 'Nie udało się wczytać Best Of.';
  }
};

export const BestOfGalleryPage: React.FC = () => {
  const [data, setData] = useState<BestOfData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-galleries?photosFor=best-of', {
        headers: { Accept: 'application/json' },
      });

      if (response.status === 401) {
        setNeedsLogin(true);
        setData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setData((await response.json()) as BestOfData);
      setNeedsLogin(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nie udało się wczytać Best Of.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robotsMeta?.content;
    document.title = 'Best Of — Sobotki Portraits';

    if (robotsMeta) {
      robotsMeta.content = 'noindex, nofollow';
    }

    void loadGallery();

    return () => {
      document.title = previousTitle;
      if (robotsMeta && previousRobots !== undefined) {
        robotsMeta.content = previousRobots;
      }
    };
  }, [loadGallery]);

  useEffect(() => {
    if (activePhotoIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!data?.photos.length) {
        return;
      }

      if (event.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (event.key === 'ArrowLeft') {
        setActivePhotoIndex((current) =>
          current === null ? null : (current - 1 + data.photos.length) % data.photos.length
        );
      } else if (event.key === 'ArrowRight') {
        setActivePhotoIndex((current) =>
          current === null ? null : (current + 1) % data.photos.length
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhotoIndex, data?.photos.length]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const activePhoto = activePhotoIndex === null ? null : data?.photos[activePhotoIndex];

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-[#111111]">
      <header className="relative overflow-hidden bg-[#111111] px-5 py-8 text-white sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'url(/noise.svg)' }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <a
            href="/panel/galerie"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 font-sans text-[9px] font-bold uppercase tracking-[0.17em] transition-colors hover:bg-white hover:text-black"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Panel galerii
          </a>
          <span className="font-serif text-xl font-black uppercase tracking-[-0.04em]">
            Sobotki <span className="font-normal italic">portraits</span>
          </span>
        </div>
        <div className="relative mx-auto max-w-[1500px] pb-10 pt-20 sm:pb-16 sm:pt-28">
          <p className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-white/45">
            Prywatna biblioteka najlepszych kadrów
          </p>
          <h1 className="mt-4 font-serif text-[clamp(4rem,14vw,12rem)] font-black uppercase leading-[0.78] tracking-[-0.075em]">
            Best Of
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-6">
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-black/45">
              {data ? `${data.gallery.photoCount} zdjęć w galerii` : 'Biblioteka zdjęć'}
            </p>
            <p className="mt-1 max-w-xl font-sans text-xs leading-5 text-black/45">
              Stały, prywatny link. Dostęp wymaga zalogowania do panelu galerii.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 px-5 font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-colors hover:bg-black hover:text-white"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Skopiowano' : 'Kopiuj link'}
            </button>
            <button
              type="button"
              onClick={() => void loadGallery()}
              disabled={isLoading}
              aria-label="Odśwież galerię Best Of"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black hover:text-white disabled:opacity-40"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {isLoading && !data && (
          <div className="flex min-h-[38vh] items-center justify-center" role="status">
            <Loader2 size={28} className="animate-spin text-black/30" />
            <span className="sr-only">Wczytuję Best Of</span>
          </div>
        )}

        {needsLogin && (
          <div className="flex min-h-[38vh] flex-col items-center justify-center text-center">
            <h2 className="font-serif text-3xl font-black uppercase">Najpierw zaloguj się do panelu</h2>
            <p className="mt-3 max-w-md font-sans text-sm leading-6 text-black/50">
              Best Of jest prywatne i korzysta z tej samej sesji co panel galerii.
            </p>
            <a
              href="/panel/galerie"
              className="mt-6 inline-flex min-h-12 items-center rounded-full bg-black px-7 font-sans text-[9px] font-bold uppercase tracking-[0.17em] text-white"
            >
              Przejdź do logowania
            </a>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-800/15 bg-red-800/[0.06] p-5 font-sans text-sm text-red-900" role="alert">
            {error}
          </div>
        )}

        {data && data.photos.length === 0 && !isLoading && (
          <div className="flex min-h-[38vh] flex-col items-center justify-center text-center">
            <ImageIcon size={34} className="text-black/25" />
            <h2 className="mt-4 font-serif text-3xl font-black uppercase">Best Of jest jeszcze puste</h2>
            <p className="mt-2 font-sans text-sm text-black/45">
              Dodaj zdjęcia z galerii klientów w panelu administratora.
            </p>
          </div>
        )}

        {data && data.photos.length > 0 && (
          <div className="columns-2 gap-2 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5">
            {data.photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActivePhotoIndex(index)}
                className="group relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-lg bg-black/[0.05] text-left sm:mb-4"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={`Zdjęcie Best Of ${index + 1}`}
                  loading={index < 10 ? 'eager' : 'lazy'}
                  className="h-auto w-full transition duration-500 group-hover:scale-[1.015]"
                />
                <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              </button>
            ))}
          </div>
        )}
      </main>

      {activePhoto && activePhotoIndex !== null && data && (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/95 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Zdjęcie ${activePhotoIndex + 1} z ${data.photos.length}`}
        >
          <button
            type="button"
            onClick={() => setActivePhotoIndex(null)}
            className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white"
            aria-label="Zamknij zdjęcie"
          >
            <X size={19} />
          </button>
          {data.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + data.photos.length) % data.photos.length)}
                className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white sm:left-6"
                aria-label="Poprzednie zdjęcie"
              >
                <ChevronLeft size={21} />
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % data.photos.length)}
                className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white sm:right-6"
                aria-label="Następne zdjęcie"
              >
                <ChevronRight size={21} />
              </button>
            </>
          )}
          <img
            src={activePhoto.largeUrl}
            alt={`Zdjęcie Best Of ${activePhotoIndex + 1}`}
            className="max-h-[88vh] max-w-full object-contain"
          />
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/55 px-4 py-2 text-white backdrop-blur-sm">
            <span className="font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
              {activePhotoIndex + 1} / {data.photos.length}
            </span>
            <a
              href={activePhoto.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"
              aria-label="Pobierz zdjęcie"
            >
              <Download size={15} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
