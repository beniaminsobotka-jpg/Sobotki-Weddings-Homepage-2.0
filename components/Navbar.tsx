import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const links = [
  { name: 'O Nas', href: '/#o-nas' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Film', href: '/film' },
  { name: 'Portraits', href: '/portraits' },
  { name: 'Kontakt', href: '/kontakt' },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true); 
  const { scrollY } = useScroll();
  const location = useLocation();
  const navigate = useNavigate();
  const isPortraitsRoute = location.pathname.startsWith('/portraits');
  const isHomePath = (path: string) => path === '/' || path === '/home';

  const isActiveHref = (href: string) => {
    if (href.includes('#')) {
      const [targetPath] = href.split('#');
      return isHomePath(location.pathname) && isHomePath(targetPath || '/');
    }

    return location.pathname === href;
  };

  // Handle Navigation with Paths and Hashes
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);

    // Check if it's a hash link
    if (href.includes('#')) {
        const [targetPath, targetHash] = href.split('#');
        
        // If we are already on the target path (e.g. "/" or "/home")
        // We need to handle both "/" and "/home" as the same "Home" page
        const currentIsHome = isHomePath(location.pathname);
        const targetIsHome = isHomePath(targetPath);

        if (currentIsHome && targetIsHome) {
             // Already on home, just scroll
             const element = document.getElementById(targetHash);
             if (element && (window as any).lenis) {
                 (window as any).lenis.scrollTo(`#${targetHash}`);
             }
            navigate(
              { pathname: targetPath || '/', hash: `#${targetHash}` },
              { replace: currentIsHome && targetIsHome }
            );
        } else if (location.pathname !== targetPath) {
            navigate({ pathname: targetPath || '/', hash: `#${targetHash}` });
        }
    } else {
        // Normal route (e.g., /portfolio)
        navigate(href);
    }
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    // HOME PAGE LOGIC (Now at / and /home)
    if (location.pathname === '/home' || location.pathname === '/') {
        const heroThreshold = typeof window !== 'undefined' ? window.innerHeight * 1.8 : 1500;
        const inHeroDarkPart = latest < heroThreshold;

        let inPortraits = false;
        // Check if we are in the portraits section on Home page (if it exists there)
        // Note: Home.tsx has <Portraits /> component which might have id="portraits"
        const portraitsSection = document.getElementById('portraits');
        if (portraitsSection) {
            const rect = portraitsSection.getBoundingClientRect();
            // If the section is roughly in view
            if (rect.top <= 100 && rect.bottom >= 100) {
                inPortraits = true;
            }
        }

        if (inHeroDarkPart || inPortraits) {
            setIsDark(true);
        } else {
            setIsDark(false);
        }
        return;
    }

    // PORTRAITS PAGE LOGIC (Now at /portraits) - Always Dark
    if (isPortraitsRoute) {
        setIsDark(true);
        return;
    }

    // DEFAULT (e.g. Portfolio) - Always Light (Dark Text)
    setIsDark(false);
  });

  // Reset dark mode immediately on route change
  useEffect(() => {
    if (isPortraitsRoute) {
        setIsDark(true);
    } else if (location.pathname === '/home' || location.pathname === '/') {
        setIsDark(true); // Start dark on Home (Hero)
    } else {
        setIsDark(false); // Portfolio etc.
    }
  }, [isPortraitsRoute, location]);

  return (
    <>
      <nav aria-label="Główna nawigacja" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto max-w-[1400px]">
        {/* Liquid Glass Container */}
        <div 
            className={`relative rounded-full px-6 py-3 md:px-8 md:py-4 flex justify-between items-center transition-all duration-700
            ${isDark ? 'liquid-glass-dark text-white' : 'liquid-glass text-brand-black'}
            `}
        >
            
            {/* Logo - Navigates to Home explicitly now */}
            <Link to="/" aria-label="Przejdź do strony głównej Sobotki Weddings" className={`flex flex-col items-center leading-none mr-8 md:mr-12 group ${isDark ? 'text-white' : 'text-brand-black'} cursor-pointer`} onClick={() => setIsOpen(false)}>
                <span className="font-serif font-black text-xl uppercase tracking-tighter">Sobotki</span>
                <span className="font-playfair italic font-normal lowercase text-sm -mt-1 opacity-90">weddings</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex gap-8 items-center">
            {links.map((link) => (
                <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavigation(e, link.href)}
                aria-current={isActiveHref(link.href) ? 'page' : undefined}
                className={`font-sans text-[10px] font-bold tracking-[0.2em] uppercase transition-colors relative group cursor-pointer
                    ${isDark ? 'text-white/80 hover:text-white' : 'text-brand-black/80 hover:text-brand-black'}
                `}
                >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-[1px] transition-all group-hover:w-full ${isDark ? 'bg-white' : 'bg-brand-black'}`}></span>
                </a>
            ))}
            </div>

            {/* Mobile Toggle */}
            <button 
                type="button"
                className={`lg:hidden min-h-11 min-w-11 transition-colors ${isDark ? 'text-white' : 'text-brand-black/80'}`} 
                onClick={() => setIsOpen(true)}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
                aria-label="Otwórz menu"
            >
                <Menu size={24} />
            </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(15px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu mobilne"
            className="fixed inset-0 z-50 bg-white/60 flex flex-col items-center justify-center p-8"
          >
            <button type="button" className="absolute top-8 right-8 min-h-11 min-w-11 text-brand-black p-2 bg-white/20 rounded-full" onClick={() => setIsOpen(false)} aria-label="Zamknij menu">
              <X size={28} />
            </button>
            <div id="mobile-navigation" className="flex flex-col gap-10 text-center">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavigation(e, link.href)}
                  aria-current={isActiveHref(link.href) ? 'page' : undefined}
                  className="font-serif font-black text-[9vw] sm:text-5xl text-brand-black/90 hover:text-brand-black transition-colors uppercase drop-shadow-sm cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
