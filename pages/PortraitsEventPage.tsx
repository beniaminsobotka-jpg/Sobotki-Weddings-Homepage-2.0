import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Briefcase, Check, Download, Printer, QrCode, Sparkles, Star, Users } from 'lucide-react';
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

const audienceItems = [
  'Atrakcja na wigilię firmową',
  'Punkt programu podczas jubileuszy i gal firmowych',
  'Element dni otwartych i wydarzeń employer brandingowych',
  'Tło do portretów zespołu podczas konferencji i targów',
  'Personalizowana stacja podczas eventów HR i onboardingu',
];

export const PortraitsEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    fullname: '',
    company: '',
    email: '',
    date: '',
    location: '',
    guests: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const message = [
      'Fotostacja eventowa',
      formData.company ? `Nazwa firmy: ${formData.company}` : '',
      formData.guests ? `Liczba osób: ${formData.guests}` : '',
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
    acData.append(AC_CONFIG.FIELDS.OFFER, 'EVENT FIRMOWY');

    try {
      await fetch(AC_CONFIG.URL, {
        method: 'POST',
        body: acData,
        mode: 'no-cors',
      });

      setStatus('success');
      setFormData({
        fullname: '',
        company: '',
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

        {/* HERO SECTION - REVERTED TO ORIGINAL LAYOUT BUT WITH NEW FONTS/COLORS */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#090909] border border-white/5 text-[#F3F2ED] shadow-2xl">
          <img
            src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/MartynaxMichal_Fotostacja_-48-min.avif"
            alt="Fotostacja eventowa hero"
            className="absolute inset-0 h-full w-full object-cover filter grayscale contrast-110 opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="relative grid min-h-[84vh] gap-12 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-14 lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
                <Star size={12} className="fill-white text-white" />
                <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-white/80">
                  Sobotki Portraits / Fotostacja Eventowa
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-6xl font-black uppercase leading-[0.84] tracking-tight text-white md:text-8xl lg:text-[7rem]"
              >
                Eventy
                <span className="ml-3 font-playfair-italic font-light lowercase text-[#d42929]">
                  firmowe
                </span>
              </motion.h1>

              <p className="mt-8 max-w-2xl font-sans text-sm leading-8 text-gray-400 md:text-base">
                Fotostacja na event firmowy to elegancka atrakcja, która zapada w pamięć. Przywozimy
                mobilne studio fotograficzne na galę, jubileusz, konferencję albo wigilię pracowniczą,
                a uczestnicy wychodzą z portretami, które naprawdę chce się zachować.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => document.getElementById('event-offer-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-200"
                >
                  Zapytaj o wycenę
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => {
                    navigate('/portraits');
                    window.scrollTo(0, 0);
                  }}
                  className="rounded-full border border-white/20 bg-transparent px-7 py-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-white/5"
                >
                  Wszystkie usługi
                </button>
              </div>
            </div>

            <div className="hidden lg:block" />
          </div>
        </section>

        {/* DLACZEGO TO DZIAŁA - PLAIN DARK BOXES (NO LIQUID GLASS) */}
        <section className="grid gap-8 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[0.92fr_1.08fr] lg:items-center md:px-10 md:py-14">
          <div className="rounded-[24px] border border-white/10 bg-black/40 p-8 md:p-10">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Dlaczego to działa?
            </span>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white">
              Więcej niż
              <span className="ml-2 font-playfair-italic lowercase text-[#d42929]">
                fotobudka
              </span>
            </h2>
            <div className="mt-8 space-y-5 font-sans text-sm md:text-base leading-relaxed text-gray-400">
              <p>
                Uczestnicy dostają eleganckie odbitki w formacie pocztówkowym 10×15 cm, pakowane w ozdobne
                koperty z logo lub brandingiem Waszej firmy.
              </p>
              <p>
                Zdjęcia są jednocześnie dostępne online przez link i QR, więc można je łatwo pobrać na telefon,
                przesłać dalej albo wykorzystać w social mediach i komunikacji wewnętrznej.
              </p>
              <p>
                To mobilne studio portretowe, które daje uczestnikom
                doświadczenie premium i zostawia realną, fizyczną pamiątkę.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: Briefcase, title: 'Branding', text: 'Logotypy, dedykowane koperty, QR-y z kampanią i spójność z identyfikacją wydarzenia.' },
              { icon: Printer, title: 'Natychmiastowy druk', text: 'Wysokiej jakości odbitki trafiają do uczestników od razu, bez czekania tygodniami.' },
              { icon: Download, title: 'Galeria online', text: 'Wszystkie zdjęcia są dostępne również cyfrowo, więc łatwo je pobrać i dystrybuować.' },
              { icon: Users, title: 'Wartość relacyjna', text: 'To świetny punkt integracji, networking i wspomnienia, które realnie zostają po evencie.' },
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

        {/* REALIZACJA - LIQUID GLASS ON IMAGE ONLY */}
        <section className="grid gap-10 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[1.12fr_0.88fr] lg:items-center md:px-10 md:py-14">
          <div className="order-1 relative rounded-[24px] bg-[#050505] lg:order-1 overflow-hidden group">
            <img
              src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/IMG_0485-min-kopia-3-1024x768.avif"
              alt="Realizacja fotostacji eventowej"
              className="aspect-[4/4.2] w-full object-cover filter grayscale contrast-110 group-hover:grayscale-0 transition-all duration-[1.5s]"
            />
            {/* Liquid Glass Element inside Image container */}
            <div className="absolute bottom-6 left-6 pointer-events-none">
              <div className="liquid-glass bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
                <span className="font-sans text-[10px] uppercase tracking-widest text-white">Behind the scenes</span>
              </div>
            </div>
          </div>

          <div className="order-2 p-4 lg:order-2">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Realizacja
            </span>
            <h2 className="mt-4 font-serif text-3xl md:text-5xl uppercase leading-tight text-white mb-8">
              Szybko, płynnie,
              <br />
              <span className="font-playfair-italic lowercase text-[#d42929]">
                bez chaosu
              </span>
            </h2>

            <div className="space-y-6">
              {[
                'Rozstawiamy białe tło, światło studyjne i stację do obróbki oraz druku.',
                'Każdy uczestnik ma robione zdjęcie i otrzymuje profesjonalną odbitkę.',
                'Zdjęcia są obrabiane na bieżąco i trafiają do chmury.',
                'Wydajność: nawet 150–200 osób w 3 godziny.',
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-4">
                  <span className="font-serif text-white/30 text-xl font-black shrink-0 w-8">{index + 1}.</span>
                  <p className="font-sans text-sm md:text-base leading-relaxed text-gray-400">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DLA JAKICH WYDARZEŃ - NORMAL SHARP BOXES */}
        <section className="grid gap-10 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14">
          <div className="p-4">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Dla jakich wydarzeń?
            </span>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl uppercase leading-tight text-white">
              Zbuduj scenę
              <span className="ml-2 font-playfair-italic lowercase text-[#d42929]">
                na event
              </span>
            </h2>
            <p className="mt-6 max-w-xl font-sans text-sm md:text-base leading-relaxed text-gray-400">
              Fotostacja sprawdza się wszędzie tam, gdzie chcesz połączyć elegancki wizerunek, angażujące
              doświadczenie uczestników i materiał, który da się później wykorzystać komunikacyjnie.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {audienceItems.map((item) => (
              <div key={item} className="rounded-[20px] border border-white/5 bg-[#0a0a0a] p-5">
                <div className="flex items-start gap-3">
                  <Check size={16} className="text-white shrink-0 mt-0.5" />
                  <p className="font-sans text-sm leading-relaxed text-gray-400">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PAKIETY I WYCENA - FULL WIDTH IMAGE WITH LIQUID GLASS PANEL AND ANIMATION */}
        <section className="relative rounded-[30px] border border-white/5 shadow-2xl overflow-hidden min-h-[500px] flex items-center p-6 md:p-14">
          {/* Background Image full width */}
          <div className="absolute inset-0 z-0 bg-black">
            <img
              src="https://sobotkiweddings.pl/wp-content/uploads/2026/02/Fotostacja-Strona-Glowna-kafalek_4.avif"
              alt="Fotostacja Eventowa Oferta"
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
              Elastyczne opcje
              <br />
              <span className="font-playfair-italic lowercase text-[#d42929]">
                dla biznesu
              </span>
            </h2>
            <div className="space-y-5 font-sans text-sm md:text-base leading-relaxed text-gray-300">
              <p>
                W zależności od liczby gości oraz wybranych opcji, takich jak druk bez limitu, branding czy
                księga gości, przygotowujemy indywidualną wycenę.
              </p>
              <p>
                Możesz zdecydować się na pakiet z limitem odbitek, np. 300, albo postawić
                na nielimitowany druk, co świetnie sprawdza się w przypadku dużych wydarzeń.
              </p>
              <div className="mt-8 inline-block rounded-2xl border border-[#d42929] px-5 py-3">
                <p className="font-sans text-xs text-gray-300 m-0">
                  Cena fotostacji na event firmowy zaczyna się od 4000 zł.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FORMULARZ KONTAKTOWY - NORMAL DARK THEME FORM */}
        <section
          id="event-offer-form"
          className="grid gap-10 rounded-[30px] bg-[#111] border border-white/5 px-6 py-12 text-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14"
        >
          <div className="p-4">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
              Skontaktuj się
            </span>
            <h2 className="mt-5 font-serif text-4xl md:text-6xl uppercase leading-none text-white mb-6">
              Otrzymaj
              <br />
              <span className="font-playfair-italic lowercase text-[#d42929]">
                wycenę
              </span>
            </h2>
            <p className="max-w-md font-sans text-sm md:text-base leading-relaxed text-gray-400">
              Napisz nam o swoim wydarzeniu. Wypełnijcie formularz, a przygotujemy wycenę pod liczbę uczestników, skalę eventu i zakres brandingu w niedługim czasie.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/40 p-8 shadow-2xl md:p-10">
            {status === 'success' ? (
              <div className="py-10 text-center">
                <Sparkles size={28} className="mx-auto text-white mb-6" strokeWidth={1} />
                <h3 className="font-serif text-3xl text-white mb-4 uppercase">Wiadomość Wysłana</h3>
                <p className="font-sans text-sm md:text-base text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                  Dziękujemy. Otrzymaliśmy Twoje zapytanie. Odpiszemy najszybciej jak to możliwe z przygotowaną ofertą.
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
                      placeholder="Osoba kontaktowa"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Nazwa firmy</span>
                    <input
                      required
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Twoja Firma"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Adres e-mail</span>
                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="kontakt@firma.pl"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Data imprezy</span>
                    <input
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      type="date"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors [color-scheme:dark]"
                    />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Miejsce imprezy</span>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Lokalizacja eventu"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Liczba osób</span>
                    <input
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      placeholder="Ile osób szacujecie?"
                      className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 pl-2">Dodatkowe wiadomości</span>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Opowiedz nam więcej o swoich potrzebach, scenariuszu zabawy czy pytaniach"
                    className="resize-none rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 font-sans text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#222] transition-colors"
                  />
                </label>

                {status === 'error' && (
                  <p className="font-sans text-sm text-red-500 text-center">Coś poszło nie tak. Spróbuj ponownie.</p>
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
              eyebrow: 'Również w portraits',
              title: 'Fotostacja Ślubna',
              subtitle: 'Elegancja i emocje',
              href: '/portraits/wedding',
            },
            {
              eyebrow: 'Następne doświadczenie',
              title: 'Studio Stacjonarne',
              subtitle: 'Dzień portretu',
              href: '/portraits/stationary',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-white/5 bg-[#111] p-8 text-white shadow-2xl cursor-pointer hover:bg-[#1a1a1a] transition-colors group" onClick={() => {
              navigate(item.href);
              window.scrollTo(0, 0);
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
