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

const featureItems = [
  'Wyjątkowe doświadczenie: profesjonalna sesja portretowa w eleganckim stylu',
  'Natychmiastowy druk: wysokiej jakości odbitki na miejscu',
  'Branding i personalizacja: logo, dedykowane koperty i QR z kampanią',
  'Galeria online: dostęp do zdjęć dla wszystkich uczestników',
  'Fizyczna pamiątka: zdjęcie do portfela, ramki lub na biurko',
  'Wartość relacyjna: networking, integracja i wspomnienia',
];

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
    <div className="min-h-screen bg-black pt-32 text-brand-black selection:bg-white selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.07] bg-[radial-gradient(circle_at_top_left,rgba(212,188,125,0.16),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(196,36,36,0.12),transparent_20%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-24 px-4 pb-24 md:px-8 md:pb-32">
        <section className="relative overflow-hidden rounded-[44px] bg-[#090909] text-[#F3F2ED] shadow-[0_32px_90px_rgba(0,0,0,0.24)]">
          <img
            src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/MartynaxMichal_Fotostacja_-48-min.avif"
            alt="Fotostacja eventowa hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.34)_0%,rgba(10,10,10,0.48)_36%,rgba(10,10,10,0.92)_100%)]" />
          <div className="relative grid min-h-[84vh] gap-12 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-14 lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-4 py-2 backdrop-blur-xl">
                <Star size={12} className="fill-[#d42929] text-[#d42929]" />
                <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-white/68">
                  Sobotki Portraits / Fotostacja Eventowa
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-6xl font-[1000] uppercase leading-[0.84] tracking-tight text-white md:text-8xl lg:text-[7rem]"
              >
                Eventy
                <span className="ml-3 font-playfair-italic font-normal normal-case text-[#d4bc7d]">
                  firmowe
                </span>
              </motion.h1>

              <p className="mt-8 max-w-2xl font-sans text-sm leading-8 text-white/78 md:text-base">
                Fotostacja na event firmowy to elegancka atrakcja, która zapada w pamięć. Przywozimy
                mobilne studio fotograficzne na galę, jubileusz, konferencję albo wigilię pracowniczą,
                a uczestnicy wychodzą z portretami, które naprawdę chce się zachować.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => document.getElementById('event-offer-form')?.scrollIntoView({ behavior: 'smooth' })}
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

            <div className="hidden lg:block" />
          </div>
        </section>

        <section className="grid gap-8 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[0.92fr_1.08fr] lg:items-center md:px-10 md:py-14">
          <div className="rounded-[34px] border border-white/8 bg-white/[0.04] p-8 md:p-10">
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-white/38">
              Dlaczego to działa?
            </span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-none text-white md:text-5xl">
              Fotostacja na event
              <span className="ml-2 font-playfair-italic font-normal normal-case text-[#d42929]">
                z klasą
              </span>
            </h2>
            <div className="mt-8 space-y-5 font-sans text-sm leading-8 text-white/68 md:text-base">
              <p>
                Uczestnicy dostają eleganckie odbitki w formacie pocztówkowym 10×15 cm, pakowane w ozdobne
                koperty z logo lub brandingiem Waszej firmy.
              </p>
              <p>
                Zdjęcia są jednocześnie dostępne online przez link i QR, więc można je łatwo pobrać na telefon,
                przesłać dalej albo wykorzystać w social mediach i komunikacji wewnętrznej.
              </p>
              <p>
                To coś więcej niż fotobudka. To mobilne studio portretowe, które daje uczestnikom
                doświadczenie premium i zostawia realną, fizyczną pamiątkę.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: Briefcase, title: 'Branding i personalizacja', text: 'Logotypy, dedykowane koperty, QR-y z kampanią i spójność z identyfikacją wydarzenia.' },
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
                className="rounded-[28px] border border-white/8 bg-white/[0.04] p-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
              >
                <item.icon size={20} className="text-[#d42929]" />
                <h3 className="mt-6 font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 font-sans text-sm leading-7 text-white/62">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[1.12fr_0.88fr] lg:items-center md:px-10 md:py-14">
          <div className="order-1 overflow-hidden rounded-[36px] bg-[#111] shadow-[0_24px_60px_rgba(0,0,0,0.22)] lg:order-1">
            <img
              src="https://sobotkiweddings.pl/wp-content/uploads/2025/07/IMG_0485-min-kopia-3-1024x768.avif"
              alt="Realizacja fotostacji eventowej"
              className="aspect-[4/4.2] w-full object-cover"
            />
          </div>

          <div className="order-2 rounded-[34px] border border-white/8 bg-white/[0.04] p-7 md:p-8 lg:order-2">
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#d42929]">
              Jak wygląda realizacja?
            </span>
            <h2 className="mt-4 font-serif text-3xl uppercase leading-[0.95] text-white md:text-[3.5rem]">
              Szybko, płynnie,
              <span className="ml-2 font-playfair-italic font-normal normal-case text-white/55">
                bez chaosu
              </span>
            </h2>

            <div className="mt-6 space-y-3">
              {[
                'Rozstawiamy białe tło, światło studyjne i stację do obróbki oraz druku.',
                'Każdy uczestnik ma robione zdjęcie i otrzymuje profesjonalną odbitkę.',
                'Zdjęcia są obrabiane na bieżąco i trafiają do chmury.',
                'Całość trwa 2–3 minuty na osobę. Wydajność: nawet 150–200 osób w 3 godziny.',
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-4 rounded-[22px] bg-black/18 px-4 py-4 backdrop-blur-xl">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d42929] font-sans text-[11px] font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="font-sans text-sm leading-7 text-white/72">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#d42929]">
              Dla jakich wydarzeń?
            </span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-none text-white md:text-5xl">
              Działa na scenie,
              <span className="ml-2 font-playfair-italic font-normal normal-case text-[#d4bc7d]">
                targach i gali
              </span>
            </h2>
            <p className="mt-6 max-w-xl font-sans text-sm leading-8 text-white/66 md:text-base">
              Fotostacja sprawdza się wszędzie tam, gdzie chcesz połączyć elegancki wizerunek, angażujące
              doświadczenie uczestników i materiał, który da się później wykorzystać komunikacyjnie.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {audienceItems.map((item) => (
              <div key={item} className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d42929]" />
                  <p className="font-sans text-sm leading-7 text-white/72">{item}</p>
                </div>
              </div>
            ))}

            <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d42929]" />
                <p className="font-sans text-sm leading-7 text-white/72">
                  To coś więcej niż fotobudka. To prawdziwe studio portretowe z klasą i pełną możliwością
                  dopasowania do marki.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-10 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[1.05fr_0.95fr] md:px-10 md:py-14">
          <div className="order-2 lg:order-2">
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#d42929]">
              Pakiety i wycena
            </span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-none text-white md:text-5xl">
              Elastyczna oferta
              <span className="ml-2 font-playfair-italic font-normal normal-case text-white/55">
                pod Wasz event
              </span>
            </h2>
          </div>

          <div className="order-1 rounded-[30px] border border-white/8 bg-white/[0.04] p-7 shadow-[0_12px_28px_rgba(0,0,0,0.12)] lg:order-1">
            <div className="space-y-5 font-sans text-sm leading-8 text-white/68 md:text-base">
              <p>
                W zależności od liczby gości oraz wybranych opcji, takich jak druk bez limitu, branding czy
                księga gości, przygotowujemy indywidualną wycenę.
              </p>
              <p>
                Możesz zdecydować się na pakiet z limitem odbitek, na przykład 300–400 sztuk, albo postawić
                na nielimitowany druk, co szczególnie dobrze sprawdza się przy większych eventach.
              </p>
              <p>
                Oferujemy też opcję rozbudowaną: cyfrową księgę gości z podpisami uczestników składanymi
                na iPadzie, a po wydarzeniu przygotowujemy z tego elegancki album w minimalistycznym stylu.
              </p>
              <p className="font-sans text-sm leading-8 text-white/68 md:text-base">
                Cena fotostacji przy imprezach firmowych zaczyna się od 4000 zł.
              </p>
            </div>
          </div>
        </section>

        <section
          id="event-offer-form"
          className="grid gap-10 rounded-[40px] bg-[#0d0d0d] px-6 py-12 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14"
        >
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-white/38">
              Otrzymaj ofertę
            </span>
            <h2 className="mt-5 font-serif text-3xl uppercase leading-none text-white md:text-5xl">
              Napiszcie nam
              <span className="ml-2 font-playfair-italic font-normal normal-case text-[#d42929]">
                o wydarzeniu
              </span>
            </h2>
            <p className="mt-6 max-w-md font-sans text-sm leading-8 text-white/66 md:text-base">
              Wypełnijcie formularz, a przygotujemy wycenę pod liczbę uczestników, skalę eventu i zakres brandingu.
            </p>
          </div>

          <div className="rounded-[34px] border border-white/8 bg-white/[0.04] p-8 text-white shadow-[0_18px_40px_rgba(0,0,0,0.12)] md:p-10">
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
                <div className="flex items-center justify-between rounded-2xl bg-black/18 px-4 py-3 backdrop-blur-xl">
                  <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-white/42">
                    Formularz kontaktowy
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#d42929]">
                    Fotostacja eventowa
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
                      placeholder="Osoba kontaktowa"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Nazwa firmy
                    </span>
                    <input
                      required
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Nazwa firmy"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Adres e-mail
                    </span>
                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="kontakt@firma.pl"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Data imprezy
                    </span>
                    <input
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      type="date"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none [color-scheme:light]"
                    />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Miejsce imprezy
                    </span>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Miasto, venue, hotel..."
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                      Liczba osób
                    </span>
                    <input
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      placeholder="Ile osób planujecie na wydarzeniu?"
                      className="rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-white/54">
                    Dodatkowe pytania i uwagi
                  </span>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Napiszcie, czy potrzebujecie brandingu, limitu odbitek, księgi gości albo konkretnego scenariusza użycia."
                    className="resize-none rounded-2xl border border-white/10 bg-[#f3f0ea] px-5 py-4 font-sans text-sm text-brand-black caret-[#d42929] placeholder:text-brand-black/38 focus:border-[#d42929]/70 focus:bg-white focus:outline-none"
                  />
                </label>

                {status === 'error' && (
                  <p className="font-sans text-sm text-[#d42929]">Coś poszło nie tak. Spróbuj ponownie.</p>
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
              eyebrow: 'Również w portraits',
              title: 'Fotostacja Ślubna',
              subtitle: 'Elegancja i emocje',
              href: '/portraits/wedding',
            },
            {
              eyebrow: 'Następne doświadczenie',
              title: 'Studio Stacjonarne',
              subtitle: 'Dzień portretu',
              href: '/portraits',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[30px] border border-white/8 bg-white/[0.04] p-8 text-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#d42929]">{item.eyebrow}</span>
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
