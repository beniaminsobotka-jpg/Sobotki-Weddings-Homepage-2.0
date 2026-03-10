import React from 'react';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { HeroPortfolio } from '../components/HeroPortfolio'; 
import { About } from '../components/About';
import { Portfolio } from '../components/Portfolio';
import { Portraits } from '../components/Portraits';
import { VideoSection } from '../components/VideoSection';
import { Reviews } from '../components/Reviews';
import { Contact } from '../components/Contact';
import { SectionTransition } from '../components/SectionTransition'; 

export const Home: React.FC = () => {
  return (
    <>
        <Hero />
        
        <Marquee />

        <SectionTransition>
            <HeroPortfolio />
        </SectionTransition>

        <SectionTransition>
            <About />
        </SectionTransition>

        <SectionTransition>
            <Portfolio />
        </SectionTransition>

        <SectionTransition>
            <VideoSection />
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