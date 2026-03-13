import React from 'react';
import { Seo } from '../components/Seo';
import { Contact } from '../components/Contact';
import { Reviews } from '../components/Reviews';

export const ContactPage: React.FC = () => {
  return (
    <>
      <Seo page="contact" />
      <header className="sr-only">
        <h1>Kontakt z Sobotki Weddings</h1>
        <p>
          Formularz kontaktowy dla par i klientów biznesowych zainteresowanych fotografią ślubną,
          filmem i fotostacją premium.
        </p>
      </header>
      <div className="pt-24 md:pt-28">
        <Contact />
        <Reviews />
      </div>
    </>
  );
};
