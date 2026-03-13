import React, { useEffect, useState, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Loader } from './components/Loader';
import { LiquidBackground } from './components/LiquidBackground';

// Pages
import { Home } from './pages/Home';
import { PortfolioPage } from './pages/PortfolioPage';
import { PortraitsPage } from './pages/PortraitsPage';
import { PortraitsEventPage } from './pages/PortraitsEventPage';
import { PortraitsWeddingPage } from './pages/PortraitsWeddingPage';
import { PortraitsStationaryPage } from './pages/PortraitsStationaryPage';
import { FilmPage } from './pages/FilmPage';
import { ContactPage } from './pages/ContactPage';

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
  const showLiquidBackground = ['/', '/portfolio', '/film', '/kontakt'].includes(location.pathname);

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
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/film" element={<FilmPage />} />
              <Route path="/kontakt" element={<ContactPage />} />
              <Route path="/portraits" element={<PortraitsPage />} />
              <Route path="/portraits/event" element={<PortraitsEventPage />} />
              <Route path="/portraits/wedding" element={<PortraitsWeddingPage />} />
              <Route path="/portraits/stationary" element={<PortraitsStationaryPage />} />
            </Routes>
          </main>
          <Footer />
        </>
      )}
    </>
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });
    
    lenisRef.current = lenis;
    (window as any).lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
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
