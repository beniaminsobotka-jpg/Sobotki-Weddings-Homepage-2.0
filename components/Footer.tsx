import React from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Film', href: '/film' },
  { label: 'Portraits', href: '/portraits' },
  { label: 'Kontakt', href: '/kontakt' },
];

export const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActiveHref = (href: string) => location.pathname === href;

  const handleNavigation = (href: string) => {
    if (href.includes('#')) {
      const [targetPath, targetHash] = href.split('#');
      const isHomePath = (path: string) => path === '/' || path === '/home';
      const currentIsHome = isHomePath(location.pathname);
      const targetIsHome = isHomePath(targetPath);

      if (currentIsHome && targetIsHome) {
        const element = document.getElementById(targetHash);
        if (element && (window as any).lenis) {
          (window as any).lenis.scrollTo(`#${targetHash}`);
          return;
        }
        element?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      navigate({ pathname: targetPath || '/', hash: `#${targetHash}` });
      return;
    }

    navigate(href);
  };

  return (
    <footer className="relative z-20 isolate bg-black px-6 py-10 text-[#F3F2ED] md:px-8 md:py-16">
      <div className="mx-auto grid max-w-[1500px] gap-8 border-t border-white/10 pt-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
          <a
            href="mailto:kontakt@sobotkiweddings.pl"
            aria-label="Napisz maila do Sobotki Weddings"
            className="font-sans text-xs uppercase tracking-[0.22em] text-white/72 transition-opacity duration-300 hover:opacity-60"
          >
            kontakt@sobotkiweddings.pl
          </a>

          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <a
              href="https://www.instagram.com/sobotki.weddings/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram Sobotki Weddings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 text-white/78 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              <Instagram size={17} strokeWidth={1.8} />
            </a>
            <a
              href="https://www.facebook.com/sobotki.weddings"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook Sobotki Weddings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 text-white/78 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              <Facebook size={17} strokeWidth={1.8} />
            </a>
          </div>
        </div>

        <Link
          to="/"
          aria-label="Przejdź do strony głównej Sobotki Weddings"
          className="flex flex-col items-center justify-center leading-none text-center transition-opacity duration-300 hover:opacity-75"
        >
          <span className="font-serif font-black text-4xl uppercase tracking-tight text-white md:text-5xl">
            Sobotki
          </span>
          <span className="mt-1 font-playfair italic text-lg lowercase text-white/65 md:text-xl">
            weddings
          </span>
        </Link>

        <div className="flex flex-col items-center gap-2 text-center md:items-end md:text-right">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-current={isActiveHref(link.href) ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                handleNavigation(link.href);
              }}
              className="font-sans text-[11px] uppercase tracking-[0.22em] text-white/65 transition-colors duration-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[1500px] text-center font-sans text-[10px] uppercase tracking-[0.22em] text-white/30 md:text-left">
        © {new Date().getFullYear()} Sobotki Weddings
      </div>
    </footer>
  );
};
