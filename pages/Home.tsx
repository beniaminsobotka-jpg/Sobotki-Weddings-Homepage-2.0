import React from 'react';
import { Seo } from '../components/Seo';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { HeroPortfolio } from '../components/HeroPortfolio'; 
import { About } from '../components/About';
import { Portraits } from '../components/Portraits';
import { Reviews } from '../components/Reviews';
import { Contact } from '../components/Contact';
import { SectionTransition } from '../components/SectionTransition'; 

export const Home: React.FC = () => {
  return (
    <>
        <Seo page="home" />
        <Hero />
        
        <Marquee />

        <SectionTransition>
            <HeroPortfolio />
        </SectionTransition>

        <SectionTransition>
            <About />
        </SectionTransition>

        <SectionTransition>
            <Reviews />
        </SectionTransition>

        <SectionTransition>
            <Portraits />
        </SectionTransition>

        <SectionTransition>
            <Contact />
        </SectionTransition>
    </>
  );
};
