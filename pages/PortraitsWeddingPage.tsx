import React, { useMemo, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Camera, Check, Download, Printer, Sparkles, Star, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AC_CONFIG = {
  URL: 'https://sobotkiportraits44570.activehosted.com/proc.php',
  U: '1',
  F: '1',
  OR: '0fd08757-ee5d-4dfa-9f7d-85ee6f058941',
  FIELDS: {
    FULLNAME: 'fullname',
    EMAIL: 'email',
    DATE: 'field[1]',
    LOCATION: 'field[2]',
    MESSAGE: 'field[8]',
    OFFER: 'field[9]',
  },
};

const galleryImages = [
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_1.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_2.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_3.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_11.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_5.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_6.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_7.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_8.jpg',
  'https://sobotkiweddings.pl/wp-content/uploads/2026/03/Portraits_Wybrane_www_9.jpg',
];

const comparisonPhotobooth = [
  'Niska jakość drukowanych zdjęć',
  'Nie pasuje do eleganckiej oprawy wesela',
  'Brak dostępu do zdjęć w chmurze w wersji cyfrowej',
  'Starsze pokolenie rzadko korzysta z tej atrakcji',
  'Pamiątka, która cieszy tylko chwilę',
];

const comparisonPortraits = [
  'Bardzo wysoka jakość drukowanych zdjęć',
  'Klasa, szyk i elegancja',
  'Wszystkie zdjęcia na dysku Google jeszcze tego samego dnia',
  'Odpowiednie dla wszystkich pokoleń',
  'Pamiątka na całe życie',
];

const BookSheet = ({ index, step = 1/5, scrollYProgress, frontImage, backImage }: any) => {
  const rotation = useTransform(scrollYProgress, [index * step, (index + 1) * step], [0, -180]);

  // Custom transform to simulate physical bending of paper.
  // Instead of twisting the spine (which looks detached), we just compress the X and Y
  // scale at the peak of the turn to simulate a natural arched paper bow.
  const bendScaleX = useTransform(
    scrollYProgress,
    [index * step, (index + 0.5) * step, (index + 1) * step],
    [1, 0.85, 1] // Arch inwards towards the spine peak
  );
  const bendScaleY = useTransform(
    scrollYProgress,
    [index * step, (index + 0.5) * step, (index + 1) * step],
    [1, 0.98, 1] // Very subtle edge curl
  );
  const liftZ = useTransform(
    scrollYProgress,
    [index * step, (index + 0.5) * step, (index + 1) * step],
    [0, 50, 0] // Just enough lift to arch over the right pile
  );
  const dynamicZIndex = useTransform(
    scrollYProgress,
    [index * step, index * step + 0.001],
    [10 - index, 20 + index]
  );

  // Instead of CSS backface-visibility (unreliable with Framer Motion),
  // we toggle opacity at the exact midpoint of the rotation (90 degrees = -90 on our -180 scale).
  // Front face is visible (opacity 1) when rotation is between 0 and -90 (i.e. showing right).
  // Back face is visible (opacity 1) when rotation is between -90 and -180 (i.e. showing left).
  const frontOpacity = useTransform(rotation, [-180, -90, -89, 0], [0, 0, 1, 1]);
  const backOpacity = useTransform(rotation, [-180, -91, -90, 0], [1, 1, 0, 0]);

  const frontShadowOpacity = useTransform(scrollYProgress, [index * step, (index + 0.5) * step], [0, 0.8]);
  const frontHighlightOpacity = useTransform(scrollYProgress, [index * step, (index + 0.5) * step], [0, 0.5]);
  const backShadowOpacity = useTransform(scrollYProgress, [(index + 0.5) * step, (index + 1) * step], [0.6, 0]);

  return (
    <motion.div
      className="absolute right-0 top-0 bottom-0 w-1/2 origin-left"
      style={{
        rotateY: rotation,
        scaleX: bendScaleX,
        scaleY: bendScaleY,
        z: liftZ,
        zIndex: dynamicZIndex,
      }}
    >
      {/* FRONT FACE - shown when the page has NOT yet been flipped (rotation 0 to -90) */}
      <motion.div
        className="absolute inset-0 bg-[#f4f4f4] rounded-r-md overflow-hidden"
        style={{ opacity: frontOpacity }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${frontImage})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/60 to-transparent pointer-events-none mix-blend-multiply" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/40 to-black/60 pointer-events-none mix-blend-multiply"
          style={{ opacity: frontShadowOpacity }}
        />
        <motion.div
          className="absolute inset-y-0 left-[35%] w-[40%] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none mix-blend-overlay blur-md"
          style={{ opacity: frontHighlightOpacity }}
        />
      </motion.div>

      {/* BACK FACE - shown when the page HAS been flipped past 90 degrees (rotation -90 to -180).
          Because the parent is rotating on Y axis, the content itself appears mirrored.
          We counter this by placing the image in a wrapper that flips it back with scaleX(-1).
          The wrapper itself occupies the full space, and the image within is un-mirrored. */}
      <motion.div
        className="absolute inset-0 bg-[#f4f4f4] rounded-r-md overflow-hidden"
        style={{ opacity: backOpacity }}
      >
        {/* This wrapper uses scaleX(-1) to un-mirror the image that appears flipped
            because the parent motion.div is currently rotated past -90deg on Y axis */}
        <div
          className="absolute inset-0"
          style={{
            transform: 'scaleX(-1)',
            backgroundImage: `url(${backImage})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
          }}
        />
        {/* The shadow must remain on the local left edge (the spine), just like the front face */}
        <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/60 to-transparent pointer-events-none mix-blend-multiply" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-l from-transparent via-black/10 to-black/30 pointer-events-none mix-blend-multiply"
          style={{ opacity: backShadowOpacity }}
        />
      </motion.div>
    </motion.div>
  );
};


const GuestbookScrollAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const images = Array.from({ length: 14 }, (_, i) => 
    `https://sobotkiweddings.pl/wp-content/uploads/2026/03/Rozkladowka_www_${i + 1}.jpg`
  );

  const turningPagesCount = 13;
  const step = 1 / turningPagesCount;

  const [activeIndex, setActiveIndex] = useState(0);

  React.useEffect(() => {
    const unsub = scrollYProgress.on("change", (latest) => {
        let flippedPagesCount = 0;
        for (let i = 0; i < turningPagesCount; i++) {
           if (latest > (i * step) + (step * 0.95)) {
               flippedPagesCount = i + 1;
           }
        }
        if (flippedPagesCount !== activeIndex) {
            setActiveIndex(flippedPagesCount);
        }
    });
    return () => unsub();
  }, [scrollYProgress, activeIndex, step]);

  const bookScale = useTransform(scrollYProgress, [0, 1], [1.2, 0.8]);
  const titleTop = useTransform(scrollYProgress, [0, 1], isMobile ? ["28%", "26%"] : ["22%", "18%"]);
  const subtitleTop = useTransform(scrollYProgress, [0, 1], isMobile ? ["65%", "71%"] : ["82%", "87%"]);

  return (
    <div ref={containerRef} className={`relative ${isMobile ? 'h-[200vh] mt-4 -mb-[10vh]' : 'h-[400vh] my-4 rounded-[30px] border border-white/5 bg-[#0a0a0a] shadow-2xl'} w-full`}>
      <div className={`sticky top-0 ${isMobile ? 'h-[60vh] pt-10' : 'h-[100vh] pt-24'} w-full flex flex-col items-center justify-center overflow-hidden rounded-[30px] bg-[#0a0a0a] border border-white/5 shadow-2xl`}>
        {/* Background ambient lighting */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_60%)] pointer-events-none" />
        
        {/* Parallax Main Title */}
        <motion.div 
          className="absolute w-full flex items-center justify-center z-0 pointer-events-none"
          style={{ 
              top: titleTop,
              opacity: useTransform(scrollYProgress, [0, 0.15, 1], [0.1, 1, 1])
          }}
        >
          <h1 className="text-[9vw] sm:text-[8vw] md:text-[10vw] px-4 font-serif font-black uppercase text-white tracking-widest text-center whitespace-nowrap drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-none">
            Księga Gości
          </h1>
        </motion.div>

        {/* Parallax Subtitle - Emerging from dynamically underneath the book */}
        <motion.div 
          className="absolute w-full flex flex-col items-center justify-center z-0 pointer-events-none"
          style={{ 
              top: subtitleTop,
              opacity: useTransform(scrollYProgress, [0, 0.1, 0.3, 1], [0, 0, 1, 1]),
          }}
        >
          <h2 className="font-playfair-italic text-3xl md:text-[3.5rem] lowercase text-[#d42929] text-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-tight">
            prawdziwa pamiątka na lata
          </h2>
        </motion.div>
        
        {/* Book Entire Scene Container */}
        <motion.div 
           className="relative w-[90%] sm:w-[85%] md:w-[80%] max-w-[1400px] aspect-[2/1] z-10 mt-4 sm:mt-8 mb-4 perspective-[3500px]"
           style={{ scale: bookScale }}
        >
            {/* The Book itself, tilted along X axis so it looks like it's laying flat in front of us */}
            <motion.div 
               className="relative w-full h-full transform-style-3d bg-transparent"
               style={{ rotateX: '15deg', rotateY: '0deg', rotateZ: '0deg' }}
            >
                {/* Book Cover / Spine (Background Layer) */}
                <div className="absolute -inset-2 md:-inset-4 bg-[#111] rounded-xl md:rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.95)] border border-white/10 overflow-hidden flex transform-style-3d">
                    <div className="w-1/2 h-full relative">
                        {/* Left cover texture/lighting */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#050505] to-[#040404] opacity-80" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
                    </div>
                    {/* Center Spine */}
                    <div className="w-6 md:w-10 h-full bg-gradient-to-r from-[#030303] via-[#151515] to-[#030303] shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative z-0">
                        <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white/5 -translate-x-1/2" />
                        <div className="absolute inset-y-0 left-[20%] w-[1px] bg-black/60" />
                        <div className="absolute inset-y-0 right-[20%] w-[1px] bg-black/60" />
                    </div>
                    <div className="w-1/2 h-full relative">
                        {/* Right cover texture/lighting */}
                        <div className="absolute inset-0 bg-gradient-to-l from-[#1a1a1a] via-[#050505] to-[#040404] opacity-80" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
                    </div>
                </div>

                {/* 3D Pages Container */}
                <div 
                  className="absolute inset-[1%] md:inset-[1.5%] rounded-md transform-style-3d"
                >
                    {/* Stack of inactive pages below (Left) to give thickness */}
                    <div className="absolute left-0 top-[2px] bottom-[-2px] w-1/2 bg-[#d0d0d0] rounded-l-md shadow-[-4px_4px_10px_rgba(0,0,0,0.5)] z-0" />
                    
                    {/* Stack of inactive pages below (Right) to give thickness */}
                    <div className="absolute right-0 top-[2px] bottom-[-2px] w-1/2 bg-[#d0d0d0] rounded-r-md shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-0" />

                    {/* Dynamic Base Left (Shows the back of the most recently turned page!) */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#f4f4f4] rounded-l-md overflow-hidden z-1"
                      style={{ 
                          // If activeIndex is 0, show image 0
                          // If activeIndex is 1 (first page flipped), show image 2 (the back of that page)
                          // If activeIndex is 2 (second page flipped), show image 4...
                          backgroundImage: `url(${images[activeIndex === 0 ? 0 : activeIndex * 2]})`, 
                          backgroundSize: '100% 100%', 
                          backgroundPosition: 'center',
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)' 
                      }} 
                    >
                       <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-black/60 to-transparent pointer-events-none mix-blend-multiply" />
                    </div>

                    {/* Base Right (Final page at the bottom of the right stack) */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#f4f4f4] rounded-r-md overflow-hidden z-1"
                      style={{ 
                          backgroundImage: `url(${images[images.length - 1]})`,
                          backgroundSize: '100% 100%',
                          backgroundPosition: 'center',
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
                      }} 
                    >
                       <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/60 to-transparent pointer-events-none mix-blend-multiply" />
                    </div>

                    {/* Middle Seam - elegant thin crack in the binding */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-black/40 pointer-events-none z-50" />

                    {/* Turning Sheets. We have 14 images total minus 1 base = 13 images.
                        We can turn 6 full sheets (which show 12 images: 6 fronts + 6 backs).
                        The 14th image (index 13) will end up being the final base left.
                    */}
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <BookSheet 
                            key={i} 
                            index={i} 
                            step={step}
                            scrollYProgress={scrollYProgress} 
                            frontImage={images[i * 2 + 1]} 
                            backImage={images[i * 2 + 2]} 
                        />
                    ))}
                </div>
            </motion.div>
        </motion.div>

        <div className="absolute bottom-[3%] z-30 font-sans text-[10px] text-gray-400 uppercase tracking-[0.2em] flex flex-col items-center gap-2">
            <motion.div 
               animate={{ y: [0, 8, 0] }} 
               transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
               className="h-6 w-[1px] bg-gray-400 rounded-full"
            />
            Przewiń, aby przeglądać
        </div>
      </div>
    </div>
  );
};

export const PortraitsWeddingPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    date: '',
    location: '',
    guests: '',
    notes: '',
  });

  const galleryColumns = useMemo(
    () => [
      galleryImages.filter((_, index) => index % 3 === 0),
      galleryImages.filter((_, index) => index % 3 === 1),
      galleryImages.filter((_, index) => index % 3 === 2),
    ],
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const message = [
      '[SP] NOWE ZAPYTANIE ZE STRONY INTERNETOWEJ',
      '---',
      'Fotostacja ślubna',
      formData.guests ? `Liczba gości: ${formData.guests}` : '',
      formData.notes ? `Uwagi: ${formData.notes}` : '',
      '---',
      'POWIADOMIENIE: sobotki.portraits@gmail.com, kontakt.sobotki@gmail.com',
    ]
      .filter(Boolean)
      .join('\n');

    const acData = new FormData();
    acData.append('u', AC_CONFIG.U);
    acData.append('f', AC_CONFIG.F);
    acData.append('s', '');
    acData.append('c', '0');
    acData.append('m', '0');
    acData.append('act', 'sub');
    acData.append('v', '2');
    acData.append('or', AC_CONFIG.OR);
    acData.append(AC_CONFIG.FIELDS.FULLNAME, formData.fullname);
    acData.append(AC_CONFIG.FIELDS.EMAIL, formData.email);
    acData.append(AC_CONFIG.FIELDS.DATE, formData.date);
    acData.append(AC_CONFIG.FIELDS.LOCATION, formData.location);
    acData.append(AC_CONFIG.FIELDS.MESSAGE, message);
    acData.append(AC_CONFIG.FIELDS.OFFER, 'ZDJĘCIA + FILM');

    try {
      await fetch(AC_CONFIG.URL, {
        method: 'POST',
        body: acData,
        mode: 'no-cors',
      });

      setStatus('success');
      setFormData({
        fullname: '',
        email: '',
        date: '',
        location: '',
        guests: '',
        notes: '',
      });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-32 text-brand-black selection:bg-white selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.05),transparent_20%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-24 px-4 pb-24 md:px-8 md:pb-32">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#090909] border border-white/5 text-[#F3F2ED] shadow-2xl">
          <img
            src="https://sobotkiweddings.pl/wp-content/uploads/2026/03/NataliaxMateusz_Fotostacja_-123.avif"
            alt="Fotostacja ślubna hero"
            className="absolute inset-0 h-full w-full object-cover filter grayscale contrast-110 opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
          <div className="relative grid min-h-[92vh] md:min-h-[84vh] gap-0 md:gap-12 px-6 pb-6 pt-10 md:px-10 md:py-14 lg:grid-cols-[1fr_1fr] lg:items-end lg:px-14 lg:py-16">
            
            {/* Left side - Title and Text */}
            <div className="max-w-3xl flex flex-col justify-end pt-40 mt-32 md:mt-0 lg:pt-32">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md self-start">
                <Star size={12} className="fill-white text-white" />
                <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-white/80">
                  Sobotki Portraits / Fotostacja Ślubna
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-[3.2rem] md:text-8xl lg:text-[7rem] font-black uppercase leading-[0.75] md:leading-[0.84] tracking-tight text-white flex flex-col items-start"
              >
                <span>Portrety</span>
                <span className="font-playfair-italic font-light lowercase text-[#d42929] -mt-2 md:-mt-3 lg:-mt-4">
                  na weselu
                </span>
              </motion.h1>

              <p className="mt-6 max-w-xl font-sans text-sm leading-8 text-gray-400 md:text-base">
                To prawdziwa studyjna sesja portretowa z profesjonalnym fotografem na Waszym przyjęciu.
                Rozmawiamy z gośćmi, prowadzimy ich przez kadry i oddajemy pamiątkę, która wygląda jak
                fragment eleganckiego editorialu, a nie losowa atrakcja weselna.
              </p>
            </div>

            {/* Right side - Buttons */}
            <div className="flex flex-col lg:items-end justify-end pb-2 lg:pb-0 -mt-2 md:mt-0 w-full">
              <div className="flex flex-col sm:flex-row gap-4 justify-start lg:justify-end w-full sm:w-auto">
                <button
                  onClick={() => document.getElementById('wedding-offer-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto group inline-flex justify-center items-center gap-3 rounded-full bg-white px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-200"
                >
                  Otrzymaj ofertę
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => {
                      navigate('/portraits');
                      window.scrollTo(0,0);
                  }}
                  className="hidden sm:flex justify-center items-center rounded-full border border-white/20 bg-transparent px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-white/5"
                >
                  Wszystkie usługi
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CZYM JEST FOTOSTACJA */}
        <section className="grid gap-8 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[0.92fr_1.08fr] lg:items-center md:px-10 md:py-14">
          <div className="rounded-[24px] border border-white/10 bg-black/40 p-8 md:p-10">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Czym jest fotostacja portretowa?
            </span>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white">
              Prawdziwe mini studio
              <span className="ml-2 font-playfair-italic lowercase text-[#d42929]">
                wśród gości
              </span>
            </h2>
            <div className="mt-8 space-y-5 font-sans text-sm md:text-base leading-relaxed text-gray-400">
              <p>
                To prawdziwa studyjna sesja portretowa z profesjonalnym fotografem na Waszym przyjęciu.
                Angażujemy się w rozmowy z gośćmi, uczymy ich pozowania i sprawiamy, że wracają do domu
                z pamiątką, której naprawdę będą chcieli.
              </p>
              <p>
                Zapomnijcie o sztucznych wąsach, perukach i małych paskach z klasycznej fotobudki.
                Fotostacja daje spokój, klasę i portrety, do których wraca się po latach z tą samą
                przyjemnością.
              </p>
              <p>
                Gwarantujemy, że czarno-białe portrety na weselu staną się jednym z największych hitów
                Waszego wydarzenia.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: Users,
                title: 'Fotograf, nie automat',
                text: 'Każde ujęcie powstaje w kontakcie z człowiekiem. Podpowiadamy, prowadzimy i wyczuwamy moment.',
              },
              {
                icon: Camera,
                title: 'Profesjonalne światło',
                text: 'Przywozimy oświetlenie studyjne i budujemy estetykę, która naturalnie pasuje do eleganckiego wesela.',
              },
              {
                icon: Printer,
                title: 'Odbitki na miejscu',
                text: 'Zdjęcia są obrabiane na żywo i drukowane od razu jako pamiątka 10×15.',
              },
              {
                icon: Download,
                title: 'Chmura tego samego dnia',
                text: 'Wszystkie fotografie trafiają też online, więc goście szybko mają je w wersji cyfrowej.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="rounded-[24px] border border-white/5 bg-[#0a0a0a] p-6 text-white"
              >
                <div className="p-3 bg-white/5 inline-block rounded-full mb-4">
                   <item.icon size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-2xl mb-2">{item.title}</h3>
                <p className="font-sans text-sm leading-relaxed text-gray-400">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <GuestbookScrollAnimation />

        {/* FOTOBUDKA VS FOTOSTACJA */}
        <section className="grid gap-10 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr] lg:items-center md:px-10 md:py-14">
          <div>
            <span className="font-sans text-[10px] uppercase font-bold tracking-[0.4em] text-gray-500">
              Fotobudka vs Fotostacja
            </span>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white">
              Podobna obietnica,
              <br/>
              <span className="font-playfair-italic lowercase text-[#d42929]">
                zupełnie inny efekt
              </span>
            </h2>
            <p className="mt-6 max-w-xl font-sans text-sm md:text-base leading-relaxed text-gray-400">
              Na pierwszy rzut oka obie usługi mają natychmiastowy wydruk. W praktyce to dwa różne
              światy: jeden robi szybki gadżet, drugi buduje wspomnienie z klasą.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/5 bg-[#0a0a0a] p-7">
              <div className="mb-6 inline-flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                  <X size={14} className="text-[#d42929]" />
                </div>
                <h3 className="font-serif text-2xl text-gray-500">Fotobudka</h3>
              </div>
              <div className="space-y-4">
                {comparisonPhotobooth.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-gray-400">
                    <X size={14} className="mt-1 shrink-0 text-gray-600" />
                    <p className="font-sans text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/40 p-7 shadow-2xl">
              <div className="mb-6 inline-flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#d42929]">
                  <Check size={14} className="text-white" />
                </div>
                <h3 className="font-serif text-2xl text-white">Fotostacja</h3>
              </div>
              <div className="space-y-4">
                {comparisonPortraits.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-gray-300">
                    <Check size={14} className="mt-1 shrink-0 text-[#d42929]" />
                    <p className="font-sans text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* GALERIA */}
        <section className="overflow-hidden rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl md:px-10 md:py-14">
          <div className="mb-12 max-w-2xl">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Galeria</span>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white">
              Kadry, które mają
              <br/>
              <span className="font-playfair-italic lowercase text-[#d42929]">
                zostać z Wami
              </span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {galleryColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="grid gap-4">
                {column.map((src, imageIndex) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.6, delay: imageIndex * 0.06 }}
                    className="overflow-hidden bg-[#050505] border border-white/5"
                  >
                    <img
                      src={src}
                      alt="Fotostacja ślubna - galeria"
                      className="w-full object-cover grayscale transition-all duration-700 hover:scale-[1.02] hover:grayscale-0"
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* PAKIETY I WYCENA - FULL WIDTH IMAGE WITH LIQUID GLASS PANEL AND ANIMATION */}
        <section className="relative rounded-[30px] border border-white/5 shadow-2xl overflow-hidden min-h-[500px] flex items-center p-6 md:p-14">
            {/* Background Image full width */}
            <div className="absolute inset-0 z-0 bg-black">
                <img
                    src="https://sobotkiweddings.pl/wp-content/uploads/2024/11/Marta-x-Alfred_-124-1024x683.webp"
                    alt="Fotostacja Ślubna Oferta"
                    className="h-full w-full object-cover filter grayscale contrast-110"
                />
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false, amount: 0.4 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" 
                />
            </div>

            {/* Text Panel overlapping image */}
            <motion.div 
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="relative z-10 rounded-[24px] bg-black/50 border border-white/5 backdrop-blur-xl p-8 md:p-12 w-full lg:max-w-[55%]"
            >
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
                  Oferta
                </span>
                <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white mb-6">
                  Pakiety i
                  <br/>
                  <span className="font-playfair-italic lowercase text-[#d42929]">
                    wycena
                  </span>
                </h2>
                <div className="space-y-5 font-sans text-sm md:text-base leading-relaxed text-gray-300">
                  <p>
                    Fotostację przygotowujemy kompleksowo — przywozimy ze sobą zarówno profesjonalne tło, jak i oświetlenie, dzięki czemu nie wymaga ona warunków rodem ze studia ani specjalnego zaplecza po stronie sali.
                  </p>
                  <p>
                    Standardowy czas działania fotostacji to 3 godziny. W opcji podstawowej pakiet obejmuje do 200 zdjęć oraz galerię online.
                  </p>
                  <p>
                    W przypadku kameralnych przyjęć do 60 osób przygotowujemy indywidualną, odpowiednio niższą wycenę. Na większe wydarzenia możemy zaproponować także rozszerzone warianty, dopasowane do skali wesela i liczby gości.
                  </p>
                  <div className="mt-8 inline-block rounded-2xl border border-[#d42929] px-5 py-3">
                    <p className="font-sans text-xs text-gray-300 m-0">
                      Cena fotostacji ślubnej zaczyna się od 2900 zł w wersji standardowego przyjęcia.
                    </p>
                  </div>
                </div>
            </motion.div>
        </section>

        {/* FORMULARZ KONTAKTOWY */}
        <section
          id="wedding-offer-form"
          className="grid gap-10 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14"
        >
          <div className="p-4">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Otrzymaj ofertę
            </span>
            <h2 className="mt-5 font-serif text-4xl md:text-6xl uppercase leading-none text-white mb-6">
              Opowiedzcie nam
              <br/>
              <span className="font-playfair-italic lowercase text-[#d42929]">
                o swoim dniu
              </span>
            </h2>
            <p className="max-w-md font-sans text-sm md:text-base leading-relaxed text-gray-400">
              Wyślijcie podstawowe informacje, a przygotujemy ofertę dopasowaną do Waszego przyjęcia.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/40 p-8 shadow-2xl md:p-10">
            {status === 'success' ? (
              <div className="py-10 text-center">
                <Sparkles size={28} className="mx-auto text-[#d42929] mb-6" strokeWidth={1} />
                <h3 className="font-serif text-3xl text-white mb-4 uppercase">Wiadomość wysłana</h3>
                <p className="font-sans text-sm md:text-base text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                  Dziękujemy. Wrócimy do Was z ofertą najszybciej jak to możliwe.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="rounded-full bg-white px-8 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:bg-gray-200"
                >
                  Wyślij ponownie
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Imię i nazwisko</span>
                    <input
                      required
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Wasze imiona i nazwisko"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Adres e-mail</span>
                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="kontakt@waszadres.pl"
                      type="email"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Data ślubu</span>
                    <input
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      type="date"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors [color-scheme:dark]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Miejsce ślubu</span>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Miasto, sala, plener..."
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Liczba gości</span>
                  <input
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    placeholder="Ile gości planujecie na swoim przyjęciu?"
                    className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Dodatkowe wiadomości i uwagi</span>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Napiszcie, jaki klimat planujecie albo jak wygląda Wasz dzień."
                    className="resize-none rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                  />
                </label>

                {status === 'error' && (
                  <p className="font-sans text-sm text-[#d42929] text-center">Coś poszło nie tak. Spróbuj ponownie.</p>
                )}

                <button
                  disabled={status === 'loading'}
                  className="mt-4 rounded-full bg-white px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:bg-gray-200 disabled:opacity-50"
                >
                  {status === 'loading' ? 'Wysyłanie...' : 'Wyślij zapytanie'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* BOTTOM LINKS */}
        <section className="grid gap-6 md:grid-cols-2">
          {[
            {
              eyebrow: 'Następne doświadczenie',
              title: 'Fotostacja Eventowa',
              subtitle: 'Wizerunek i marka',
              href: '/portraits/event',
            },
            {
              eyebrow: 'Również w portraits',
              title: 'Studio Stacjonarne',
              subtitle: 'Dzień portretu',
              href: '/portraits/stationary',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-white/5 bg-[#111] p-8 text-white shadow-2xl cursor-pointer hover:bg-[#1a1a1a] transition-colors group" onClick={() => {
                navigate(item.href);
                window.scrollTo(0,0);
            }}>
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-gray-500">{item.eyebrow}</span>
              <h3 className="mt-5 font-serif text-3xl">{item.title}</h3>
              <p className="mt-2 font-playfair-italic text-xl text-gray-400 mb-8">{item.subtitle}</p>
              <div className="flex items-center gap-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 transition-colors duration-300 group-hover:text-white">
                Zobacz
                <ArrowUpRight size={15} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
