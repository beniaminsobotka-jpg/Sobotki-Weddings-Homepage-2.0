import React from 'react';
import { Instagram, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-paper pt-24 pb-12 px-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
        
        <div className="flex flex-col items-center gap-6">
            <h3 className="font-serif italic text-3xl text-brand-black uppercase">Obserwuj Nas</h3>
            <div className="flex gap-6">
                <a href="https://www.facebook.com/sobotki.weddings" target="_blank" rel="noreferrer" className="text-brand-black hover:text-gray-500 transition-colors">
                    <Facebook size={24} strokeWidth={1} />
                </a>
                <a href="https://www.instagram.com/sobotki.weddings/" target="_blank" rel="noreferrer" className="text-brand-black hover:text-gray-500 transition-colors">
                    <Instagram size={24} strokeWidth={1} />
                </a>
            </div>
        </div>

        <div className="w-full h-[1px] bg-gray-200 max-w-xs"></div>

        <div className="flex flex-col items-center gap-2">
            <div className="font-serif font-[1000] uppercase text-5xl text-brand-black scale-x-[1.32] origin-center inline-block">
                Sobotki
            </div>
            <div className="font-sans text-xs tracking-[0.3em] uppercase text-gray-400">Fotografia i Film Ślubny</div>
        </div>

       <div className="text-gray-400 font-sans text-[10px] uppercase tracking-widest mt-12">
          © {new Date().getFullYear()} Sobotki Weddings. Wszelkie Prawa Zastrzeżone.
        </div>
      </div>
    </footer>
  );
};