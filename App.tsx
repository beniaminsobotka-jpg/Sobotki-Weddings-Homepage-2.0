import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Loader } from './components/Loader';
import { LiquidBackground } from './components/LiquidBackground';

// Pages
import { Home } from './pages/Home';
import { NotFoundPage } from './pages/NotFoundPage';

const PortfolioPage = lazy(async () => ({ default: (await import('./pages/PortfolioPage')).PortfolioPage }));
const PortraitsPage = lazy(async () => ({ default: (await import('./pages/PortraitsPage')).PortraitsPage }));
const PortraitsEventPage = lazy(async () => ({ default: (await import('./pages/PortraitsEventPage')).PortraitsEventPage }));
const PortraitsWeddingPage = lazy(async () => ({ default: (await import('./pages/PortraitsWeddingPage')).PortraitsWeddingPage }));
const PortraitsStationaryPage = lazy(async () => ({ default: (await import('./pages/PortraitsStationaryPage')).PortraitsStationaryPage }));
const FilmPage = lazy(async () => ({ default: (await import('./pages/FilmPage')).FilmPage }));
const ContactPage = lazy(async () => ({ default: (await import('./pages/ContactPage')).ContactPage }));

// ScrollToTop component to reset scroll on route change
const ScrollToTop = () => {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        const scrollToTarget = () => {
            const lenis = (window as any).lenis;

            if (hash) {
                const targetId = decodeURIComponent(hash.replace('#', ''));
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    if (lenis) {
                        lenis.scrollTo(`#${targetId}`, { immediate: true });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });
                    }
                    return;
                }
            }

            window.scrollTo(0, 0);
            if (lenis) {
                lenis.scrollTo(0, { immediate: true });
            }
        }

        const timeoutId = window.setTimeout(scrollToTarget, 60);
        return () => window.clearTimeout(timeoutId);
    }, [pathname, hash]);
    return null;
};

const AppShell: React.FC<{
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ isLoading, setIsLoading }) => {
  const location = useLocation();
  const showLiquidBackground = ['/', '/film', '/kontakt'].includes(location.pathname);

  return (
    <>
      <ScrollToTop />

      <AnimatePresence mode="wait">
        {isLoading && <Loader onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {showLiquidBackground && <LiquidBackground />}

      {!isLoading && (
        <>
          <Navbar />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-brand-black focus:px-5 focus:py-3 focus:font-sans focus:text-xs focus:font-bold focus:uppercase focus:tracking-[0.2em] focus:text-white"
          >
            Przejdź do treści
          </a>
          <main id="main-content" className="relative z-10">
            <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/contact" element={<Navigate to="/kontakt" replace />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/film" element={<FilmPage />} />
                <Route path="/kontakt" element={<ContactPage />} />
                <Route path="/portraits" element={<PortraitsPage />} />
                <Route path="/portraits/event" element={<PortraitsEventPage />} />
                <Route path="/portraits/wedding" element={<PortraitsWeddingPage />} />
                <Route path="/portraits/stationary" element={<PortraitsStationaryPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </>
      )}
    </>
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    try {
      const hasSeenIntro = window.sessionStorage.getItem('sw-intro-seen') === '1';
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return !(hasSeenIntro || prefersReducedMotion);
    } catch {
      return true;
    }
  });
  const lenisRef = useRef<{
    destroy: () => void;
    raf: (time: number) => void;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('sw-intro-seen', '1');
      } catch {
        // Ignore storage errors and continue rendering normally.
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    const win = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let frameId = 0;
    let timeoutId: number | null = null;
    let idleId: number | null = null;
    let lenisDestroyed = false;

    const initLenis = async () => {
      const { default: Lenis } = await import('@studio-freight/lenis');

      if (lenisDestroyed) {
        return;
      }

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
      });

      lenisRef.current = lenis;
      (window as any).lenis = lenis;

      const raf = (time: number) => {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      };

      frameId = requestAnimationFrame(raf);
    };

    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(() => {
        void initLenis();
      }, { timeout: 800 });
    } else {
      timeoutId = window.setTimeout(() => {
        void initLenis();
      }, 120);
    }

    return () => {
      lenisDestroyed = true;

      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      if (idleId !== null && win.cancelIdleCallback) {
        win.cancelIdleCallback(idleId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      lenisRef.current?.destroy();
      lenisRef.current = null;
      (window as any).lenis = null;
    };
  }, [isLoading]);

  return (
    <div className="min-h-screen text-brand-black selection:bg-brand-black selection:text-white no-scrollbar relative">
      <BrowserRouter>
        <AppShell isLoading={isLoading} setIsLoading={setIsLoading} />
      </BrowserRouter>
    </div>
  );
};

export default App;
