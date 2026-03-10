import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Basia-x-Szymon_-2-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Kamila-x-Konrad_-76-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2025/07/IsmenaxTomasz_Fotostacja_-37-1024x683.avif',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Marta-x-Alfred_-124-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2025/07/OlgaxFranek_Fotostacja_-136-1024x683.avif',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Kamila-x-Konrad_-54-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2025/07/IsmenaxTomasz_Fotostacja_-134-e1752095442720-1024x789.avif',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Basia-x-Szymon_-22-1024x683.webp',
  'https://sobotkiweddings.pl/wp-content/uploads/2024/11/Marta-x-Alfred_-42-1024x683.webp',
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
      'Fotostacja ślubna',
      formData.guests ? `Liczba gości: ${formData.guests}` : '',
      formData.notes ? `Uwagi: ${formData.notes}` : '',
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
    <div className="min-h-screen bg-brand-paper pt-32 text-brand-black selection:bg-brand-black selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.07] bg-[radial-gradient(circle_at_top_left,rgba(212,188,125,0.22),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(196,36,36,0.08),transparent_20%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-24 px-4 pb-24 md:px-8 md:pb-32">
        <section className="overflow-hidden rounded-[40px] bg-[#090909] text-[#F3F2ED] shadow-[0_32px_90px_rgba(0,0,0,0.24)]">
          <div className="grid gap-10 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:px-14 lg:py-14">
            <div className="max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/6 px-4 py-2 backdrop-blur-md">
                <Star size={12} className="fill-[#d42929] text-[#d42929]" />
                <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-white/68">
                  Sobotki Portraits / Fotostacja Ślubna
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-5xl font-[1000] uppercase leading-[0.88] tracking-tight text-white md:text-7xl lg:text-[6rem]"
              >
                Czarno-białe
                <span className="ml-3 font-playfair-italic font-normal normal-case text-[#d4bc7d]">
                  portrety
                </span>
                <br />
                na weselu
              </motion.h1>

              <p className="mt-8 max-w-2xl font-sans text-sm leading-8 text-white/68 md:text-base">
                To prawdziwa studyjna sesja portretowa z profesjonalnym fotografem na Waszym przyjęciu.
                Rozmawiamy z gośćmi, prowadzimy ich przez kadry i oddajemy pamiątkę, która wygląda jak
                fragment eleganckiego editorialu, a nie losowa atrakcja weselna.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => document.getElementById('wedding-offer-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#d42929] px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#bb2020]"
                >
                  Otrzymaj ofertę
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => navigate('/portraits')}
                  className="rounded-full bg-white/8 px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white/72 transition-all duration-300 hover:bg-white/12 hover:text-white"
                >
                  Wróć do wyboru doświadczeń
                </button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative overflow-hidden rounded-[34px] bg-[#111] shadow-[0_28px_70px_rgba(0,0,0,0.38)]"
            >
              <img
                src="https://sobotkiweddings.pl/wp-content/uploads/2024/11/Kamila-x-Konrad_-6-1024x683.webp"
                alt="Fotostacja ślubna"
                className="aspect-[4/3] w-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="rounded-[28px] bg-black/45 p-5 backdrop-blur-xl">
                  <p className="font-playfair-italic text-xl text-white/92 md:text-2xl">
                    Fotostacja to pamiątkowe zdjęcia z klasą, edytowane na żywo i wywoływane na miejscu
                    w formacie 10×15.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="grid gap-8 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[0.92fr_1.08fr] lg:items-center md:px-10 md:py-14">
          <div className="rounded-[34px] bg-white/[0.04] p-8 md:p-10">
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-white/38">
              Czym jest fotostacja portretowa?
            </span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-none text-white md:text-5xl">
              Prawdziwe mini studio
              <span className="ml-2 font-playfair-italic font-normal normal-case text-[#d42929]">
                wśród gości
              </span>
            </h2>
            <div className="mt-8 space-y-5 font-sans text-sm leading-8 text-white/68 md:text-base">
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
                className="rounded-[28px] bg-[#151515] p-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
              >
                <item.icon size={20} className="text-[#d42929]" />
                <h3 className="mt-6 font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 font-sans text-sm leading-7 text-white/60">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center md:px-10 md:py-14">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#d42929]">
              Fotobudka vs Fotostacja
            </span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-[0.95] text-white md:text-5xl">
              Podobna obietnica,
              <span className="ml-2 font-playfair-italic font-normal normal-case text-white/55">
                zupełnie inny efekt
              </span>
            </h2>
            <p className="mt-6 max-w-xl font-sans text-sm leading-8 text-white/65 md:text-base">
              Na pierwszy rzut oka obie usługi mają natychmiastowy wydruk. W praktyce to dwa różne
              światy: jeden robi szybki gadżet, drugi buduje wspomnienie z klasą.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[30px] bg-white/[0.05] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
              <div className="mb-6 inline-flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#341616]">
                  <X size={14} className="text-[#d42929]" />
                </div>
                <h3 className="font-serif text-3xl uppercase text-white/42">Fotobudka</h3>
              </div>
              <div className="space-y-4">
                {comparisonPhotobooth.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-white/56">
                    <X size={14} className="mt-1 shrink-0 text-[#d42929]" />
                    <p className="font-sans text-sm leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-[#121212] p-7 text-white shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
              <div className="mb-6 inline-flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#d42929]">
                  <Check size={14} className="text-white" />
                </div>
                <h3 className="font-serif text-3xl text-white">Fotostacja</h3>
              </div>
              <div className="space-y-4">
                {comparisonPortraits.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-white/82">
                    <Check size={14} className="mt-1 shrink-0 text-[#d4bc7d]" />
                    <p className="font-sans text-sm leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[40px] bg-[#0c0c0c] px-6 py-12 text-white shadow-[0_28px_70px_rgba(0,0,0,0.18)] md:px-10 md:py-14">
          <div className="mb-12 max-w-2xl">
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-white/38">Galeria</span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-none text-white md:text-5xl">
              Kadry, które mają
              <span className="ml-2 font-playfair-italic font-normal normal-case text-[#d4bc7d]">
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
                    className="overflow-hidden rounded-[24px] bg-[#151515]"
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

        <section
          id="wedding-offer-form"
          className="grid gap-10 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14"
        >
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-white/38">
              Otrzymaj ofertę
            </span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-none text-white md:text-5xl">
              Opowiedzcie nam
              <span className="ml-2 font-playfair-italic font-normal normal-case text-[#d42929]">
                o swoim dniu
              </span>
            </h2>
            <p className="mt-6 max-w-md font-sans text-sm leading-8 text-white/66 md:text-base">
              Wyślijcie podstawowe informacje, a przygotujemy ofertę dopasowaną do Waszego przyjęcia.
            </p>
          </div>

          <div className="rounded-[34px] bg-[linear-gradient(180deg,#171717_0%,#101010_100%)] p-8 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] md:p-10">
            {status === 'success' ? (
              <div className="py-10 text-center">
                <Sparkles size={28} className="mx-auto text-[#d42929]" />
                <h3 className="mt-5 font-serif text-3xl text-white">Wiadomość wysłana</h3>
                <p className="mt-3 font-sans text-sm leading-7 text-white/58">
                  Dziękujemy. Wrócimy do Was z ofertą najszybciej jak to możliwe.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-8 rounded-full bg-white/8 px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white/72 transition-colors duration-300 hover:text-white"
                >
                  Wyślij kolejną wiadomość
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-white/42">
                    Formularz kontaktowy
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#d42929]">
                    Fotostacja ślubna
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Imię i nazwisko
                    </span>
                    <input
                      required
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Wasze imiona i nazwisko"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Adres e-mail
                    </span>
                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="kontakt@waszadres.pl"
                      type="email"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Data ślubu
                    </span>
                    <input
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      type="date"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none [color-scheme:light]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Miejsce ślubu
                    </span>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Miasto, sala, plener..."
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                    Liczba gości
                  </span>
                  <input
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    placeholder="Ile gości planujecie na swoim przyjęciu?"
                    className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                    Dodatkowe pytania i uwagi
                  </span>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Napiszcie, jaki klimat planujecie, czy zależy Wam na konkretnym tle albo jak wygląda Wasz dzień."
                    className="resize-none rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                  />
                </label>

                {status === 'error' && (
                  <p className="font-sans text-sm text-[#ff7a7a]">Coś poszło nie tak. Spróbuj ponownie.</p>
                )}

                <button
                  disabled={status === 'loading'}
                  className="inline-flex items-center justify-center rounded-full bg-[#d42929] px-8 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#bb2020] hover:shadow-[0_18px_40px_rgba(212,41,41,0.28)] disabled:opacity-60"
                >
                  {status === 'loading' ? 'Wysyłanie...' : 'Wyślij formularz'}
                </button>
              </form>
            )}
          </div>
        </section>

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
              href: '/portraits',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[30px] bg-[#111] p-8 text-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
            >
              <span
                className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#d42929]"
              >
                {item.eyebrow}
              </span>
              <h3 className="mt-5 font-serif text-3xl">{item.title}</h3>
              <p className="mt-2 font-playfair-italic text-xl text-white/48">{item.subtitle}</p>
              <button
                onClick={() => {
                  navigate(item.href);
                  window.scrollTo(0, 0);
                }}
                className="mt-8 inline-flex items-center gap-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white/65 transition-colors duration-300 hover:text-white"
              >
                Zobacz więcej
                <ArrowUpRight size={15} />
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
