import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export const NotFoundPage: React.FC = () => {
  return (
    <section className="min-h-screen bg-brand-paper px-6 pb-16 pt-32 text-brand-black md:px-8">
      <Seo page="notFound" />
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.28em] text-gray-500">404</p>
        <h1 className="mt-6 font-serif font-black text-5xl uppercase tracking-tighter md:text-7xl">
          Tej strony nie ma
        </h1>
        <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-brand-black/70 md:text-base">
          Link jest nieaktualny albo ścieżka została wpisana błędnie. Wróć na stronę główną albo
          przejdź bezpośrednio do portfolio, filmu, portraits lub kontaktu.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="rounded-full bg-brand-black px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-opacity hover:opacity-85"
          >
            Strona główna
          </Link>
          <Link
            to="/portfolio"
            className="rounded-full border border-brand-black/15 px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black transition-colors hover:bg-brand-black/5"
          >
            Portfolio
          </Link>
        </div>
      </div>
    </section>
  );
};
