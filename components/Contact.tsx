import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { subscribeToBrevo } from '../utils/brevo';

export const Contact: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Coś poszło nie tak. Spróbuj ponownie.');
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    date: '',
    location: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('Coś poszło nie tak. Spróbuj ponownie.');

    try {
      await subscribeToBrevo({
        formType: 'weddings',
        email: formData.email,
        fullName: formData.fullname,
        phone: '',
        weddingDate: formData.date,
        venue: formData.location,
        serviceType: 'Reportaż ślubny',
        message: formData.message,
      });

      setStatus('success');
      setFormData({ fullname: '', email: '', date: '', location: '', message: '' });
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
      setStatus('error');
    }
  };

  return (
    <section id="kontakt" className="py-8 md:py-32 px-6 relative">
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-2 md:mb-12">
          <h2 className="text-brand-black flex flex-col items-center leading-none gap-1 md:gap-2">
            <span className="font-serif font-black uppercase text-4xl md:text-5xl lg:text-7xl scale-x-[1.32] origin-center inline-block drop-shadow-md">
              Napisz do
            </span>
            <span className="font-playfair-italic font-normal normal-case tracking-normal text-gray-600/80 text-4xl md:text-5xl lg:text-7xl">
              Nas
            </span>
          </h2>
        </div>

        {/* GLASS FORM CONTAINER */}
        <div className="backdrop-blur-[30px] bg-white/40 border border-white/50 rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-4 md:p-16">
            <AnimatePresence mode="wait">
            {status === 'success' ? (
                <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                aria-live="polite"
                className="text-center py-12"
                >
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <CheckCircle2 size={40} className="text-green-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-3xl text-brand-black italic mb-2 uppercase">Wiadomość Wysłana</h3>
                <p className="font-sans text-gray-600 text-sm tracking-wide">Dziękujemy. Odpowiemy najszybciej jak to możliwe.</p>
                <button 
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="mt-8 text-brand-black border-b border-brand-black font-sans uppercase tracking-widest text-xs pb-1 hover:opacity-60 transition-opacity"
                >
                    Wyślij kolejną wiadomość
                </button>
                </motion.div>
            ) : (
                <form className="space-y-3 md:space-y-12" onSubmit={handleSubmit}>
                {/* This form is for wedding photography; Fotostacja has its own enquiry. */}
                <div className="flex flex-col gap-3 rounded-2xl border border-brand-black/10 bg-white/55 px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
                    <p className="flex items-start gap-3 font-sans text-xs md:text-sm leading-relaxed text-brand-black/75">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#FF0000]" aria-hidden="true" />
                        <span>
                            Ten formularz dotyczy <strong className="text-brand-black">reportażu ślubnego</strong>. Interesuje Was Fotostacja — portrety gości podczas przyjęcia? Zapytajcie o nią w osobnym formularzu.
                        </span>
                    </p>
                    <a
                        href="/portraits/wedding#wedding-offer-form"
                        className="inline-flex shrink-0 items-center justify-center self-start rounded-full bg-brand-black px-5 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#FF0000] md:self-auto"
                    >
                        Formularz Fotostacji →
                    </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-12">
                    <div className="group relative">
                        <label className="block font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-2 ml-1">Imię i Nazwisko</label>
                        <input 
                            required
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleChange}
                            type="text" 
                            autoComplete="name"
                            className="w-full bg-white/30 rounded-lg px-4 py-3 border border-white/40 text-brand-black font-playfair-italic text-lg md:text-xl focus:outline-none focus:bg-white/50 focus:border-brand-black/20 transition-all placeholder-gray-400 backdrop-blur-sm" 
                            placeholder="Twoje imię" 
                        />
                    </div>
                    <div className="group">
                        <label className="block font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                        <input 
                            required
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email" 
                            autoComplete="email"
                            className="w-full bg-white/30 rounded-lg px-4 py-3 border border-white/40 text-brand-black font-playfair-italic text-lg md:text-xl focus:outline-none focus:bg-white/50 focus:border-brand-black/20 transition-all placeholder-gray-400 backdrop-blur-sm" 
                            placeholder="twoj@email.com" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-12">
                    <div className="group">
                        <label className="block font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-2 ml-1">Data Ślubu</label>
                        <input 
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            type="date" 
                            className="w-full bg-white/30 rounded-lg px-4 py-3 border border-white/40 text-brand-black font-playfair-italic text-lg md:text-xl focus:outline-none focus:bg-white/50 focus:border-brand-black/20 transition-all backdrop-blur-sm" 
                        />
                    </div>
                    <div className="group">
                        <label className="block font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-2 ml-1">Miejsce</label>
                        <input 
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            type="text" 
                            autoComplete="address-level2"
                            className="w-full bg-white/30 rounded-lg px-4 py-3 border border-white/40 text-brand-black font-playfair-italic text-lg md:text-xl focus:outline-none focus:bg-white/50 focus:border-brand-black/20 transition-all placeholder-gray-400 backdrop-blur-sm" 
                            placeholder="Miasto, Sala..." 
                        />
                    </div>
                </div>

                <div className="group">
                    <label className="block font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-2 ml-1">Wasza Historia</label>
                    <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3} 
                    className="w-full bg-white/30 rounded-lg px-4 py-3 border border-white/40 text-brand-black font-playfair-italic text-lg md:text-xl focus:outline-none focus:bg-white/50 focus:border-brand-black/20 transition-all resize-none placeholder-gray-400 backdrop-blur-sm" 
                    placeholder="Opowiedzcie nam o sobie..."
                    ></textarea>
                </div>

                {status === 'error' && (
                    <div className="text-red-500 font-sans text-xs text-center bg-red-100/50 p-2 rounded-lg" role="alert">
                    {errorMessage}
                    </div>
                )}

                <div className="pt-0 md:pt-8 flex justify-center">
                    <button 
                    disabled={status === 'loading'}
                    className="group relative bg-brand-black text-white font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] px-10 py-5 rounded-full hover:bg-gray-800 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 w-full md:w-auto justify-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1"
                    >
                    {status === 'loading' ? 'Wysyłanie...' : 'Wyślij Wiadomość'}
                    </button>
                </div>
                </form>
            )}
            </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
