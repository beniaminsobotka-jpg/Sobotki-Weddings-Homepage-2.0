import React, { useEffect, useState, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { AnimatePresence } from 'framer-motion';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';

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

// ScrollToTop component to reset scroll on route change
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        if (!pathname.includes('#')) {
             window.scrollTo(0, 0);
        }
    }, [pathname]);
    return null;
}

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
      <HashRouter>
          <ScrollToTop />
          {/* Background is Global */}
          <LiquidBackground />
          
          <AnimatePresence mode="wait">
            {isLoading && <Loader onComplete={() => setIsLoading(false)} />}
          </AnimatePresence>

          {!isLoading && (
            <>
              <Navbar />
              <main className="relative z-10">
                 <Routes>
                    {/* UPDATED ROUTING: Home is now default */}
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/portfolio" element={<PortfolioPage />} />
                    <Route path="/portraits" element={<PortraitsPage />} />
                    <Route path="/portraits/event" element={<PortraitsEventPage />} />
                    <Route path="/portraits/wedding" element={<PortraitsWeddingPage />} />
                 </Routes>
              </main>
              <Footer />
            </>
          )}
      </HashRouter>
    </div>
  );
};

export default App;
