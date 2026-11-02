import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';

type Video = {key:string;title:string;embedUrl:string;youtubeUrl:string;downloadUrl:string};
type VideoState = {public:boolean;canManage:boolean;videos:Video[]};

export const GalleryVideos: React.FC<{slug:string;coupleUnlocked:boolean}> = ({slug,coupleUnlocked}) => {
  const [state,setState] = useState<VideoState | null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch(`/api/gallery-videos?slug=${encodeURIComponent(slug)}`,{cache:'no-store'});
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Nie udało się wczytać filmów.');
        if (!cancelled) { setState(payload); setError(''); }
      } catch {
        if (!cancelled && coupleUnlocked) setError('Nie udało się wczytać filmów. Odśwież stronę za chwilę.');
      }
    };
    void load();
    const timer = window.setInterval(() => void load(),30_000);
    window.addEventListener('focus',load);
    return () => {cancelled=true; window.clearInterval(timer); window.removeEventListener('focus',load);};
  },[slug,coupleUnlocked]);

  const setPublic = async (show:boolean) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/gallery-videos',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({slug,public:show}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Nie udało się zmienić widoczności filmów.');
      setState(payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Spróbuj ponownie.');
    } finally {setBusy(false);}
  };

  if (!state?.videos.length || (!coupleUnlocked && !state.public)) {
    return coupleUnlocked && error ? <p role="alert" className="mx-auto mt-8 max-w-xl text-center font-sans text-xs text-red-800">{error}</p> : null;
  }

  return (
    <section className="mx-auto mt-16 max-w-5xl border-t border-black/10 px-2 pt-12 sm:mt-24 sm:px-6 sm:pt-16" aria-labelledby="gallery-videos-title">
      <div className="mb-8 text-center sm:mb-10">
        <p className="font-sans text-[9px] font-bold uppercase tracking-[0.23em] text-black/40">Jeszcze raz, tym razem z dźwiękiem</p>
        <h2 id="gallery-videos-title" className="mt-3 font-serif text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Wasze filmy</h2>
        <p className="mx-auto mt-4 max-w-lg font-playfair text-lg italic text-black/55">Rozsiądźcie się wygodnie. Jest co wspominać.</p>
      </div>
      {coupleUnlocked && state.canManage && (
        <div className="mb-10 flex items-center justify-between gap-5 rounded-2xl border border-black/10 bg-white/40 p-5">
          <div>
            <p id="videos-public-label" className="font-sans text-xs font-semibold text-black/80">Pokaż filmy w galerii dla wszystkich gości</p>
            <p className="mt-2 max-w-xl font-sans text-xs leading-5 text-black/45">
              {state.public ? 'Filmy i przyciski pobierania są widoczne dla każdego, kto ma link do galerii.' : 'Teraz filmy i pobieranie widzicie tylko Wy po wpisaniu PIN-u.'}
            </p>
          </div>
          <button type="button" role="switch" aria-checked={state.public} aria-labelledby="videos-public-label" disabled={busy} onClick={() => void setPublic(!state.public)}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-50 ${state.public ? 'bg-black' : 'bg-black/15'}`}>
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-transform ${state.public ? 'translate-x-6' : ''}`}>
              {busy && <RefreshCw size={12} className="animate-spin" aria-hidden="true" />}
            </span>
          </button>
        </div>
      )}
      {error && <p role="alert" className="mb-5 font-sans text-xs text-red-800">{error}</p>}
      <div className="space-y-12 sm:space-y-16">
        {state.videos.map((video) => (
          <article key={video.key}>
            <h3 className="mb-4 font-playfair text-2xl italic sm:text-3xl">{video.title}</h3>
            {video.embedUrl && (
              <div className="aspect-video overflow-hidden rounded-xl bg-black sm:rounded-2xl">
                <iframe src={video.embedUrl} title={video.title} className="h-full w-full border-0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
              </div>
            )}
            {video.downloadUrl && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="font-sans text-xs text-black/45">Zapiszcie film na telefonie lub komputerze i oglądajcie kiedy chcecie.</p>
                <a href={video.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-80" aria-label={`Pobierz ${video.title.toLocaleLowerCase('pl-PL')}`}>
                  <Download size={15} aria-hidden="true" /> Pobierz film
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
