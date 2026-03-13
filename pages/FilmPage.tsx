import React from 'react';
import { Seo } from '../components/Seo';
import { VideoSection } from '../components/VideoSection';
import { Portfolio } from '../components/Portfolio';
import { Contact } from '../components/Contact';

export const FilmPage: React.FC = () => {
  return (
    <>
      <Seo page="film" />
      <header className="sr-only">
        <h1>Film ślubny Sobotki Weddings</h1>
        <p>
          Poruszające filmy ślubne, portfolio video i formularz kontaktowy dla par szukających
          naturalnej opowieści filmowej.
        </p>
      </header>
      <div className="pt-20 md:pt-24">
        <VideoSection />
        <Portfolio />
        <Contact />
      </div>
    </>
  );
};
