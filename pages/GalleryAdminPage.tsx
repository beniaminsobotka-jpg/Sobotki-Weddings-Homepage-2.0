import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Archive,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Folder,
  Image,
  Loader2,
  LockKeyhole,
  LogOut,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';

type GalleryRecord = {
  slug: string;
  title: string;
  date: string;
  folder: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type DropboxFolder = {
  name: string;
  path: string;
};

type AdminData = {
  galleries: GalleryRecord[];
  folders: DropboxFolder[];
  galleryRoot: string;
};

type FormState = {
  originalSlug: string;
  title: string;
  date: string;
  folder: string;
  slug: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  originalSlug: '',
  title: '',
  date: '',
  folder: '',
  slug: '',
  active: true,
});

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' i ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

const createSuffix = () => {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(5);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

const getErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null);
  return payload?.error || fallback;
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15_000
) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const getRequestErrorMessage = (error: unknown, fallback: string) =>
  error instanceof DOMException && error.name === 'AbortError'
    ? 'Dropbox nie odpowiedział w ciągu 15 sekund. Sprawdź token i uprawnienia aplikacji.'
    : error instanceof Error
      ? error.message
      : fallback;

const setNoIndex = () => {
  const robotsMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  const previousRobots = robotsMeta?.content;
  const activeRobotsMeta = robotsMeta || document.createElement('meta');

  activeRobotsMeta.name = 'robots';
  activeRobotsMeta.content = 'noindex, nofollow, noarchive';

  if (!robotsMeta) {
    document.head.appendChild(activeRobotsMeta);
  }

  return () => {
    if (robotsMeta && previousRobots) {
      robotsMeta.content = previousRobots;
    } else if (!robotsMeta) {
      activeRobotsMeta.remove();
    }
  };
};

const GalleryQrPreview = ({ url }: { url: string }) => {
  const [source, setSource] = useState('');

  useEffect(() => {
    let active = true;

    void QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: { dark: '#111111', light: '#F3F2ED' },
      errorCorrectionLevel: 'M',
    }).then((dataUrl) => {
      if (active) {
        setSource(dataUrl);
      }
    });

    return () => {
      active = false;
    };
  }, [url]);

  return source ? (
    <img src={source} alt="Kod QR galerii" className="h-28 w-28 rounded-xl" />
  ) : (
    <span className="flex h-28 w-28 items-center justify-center rounded-xl bg-black/5">
      <Loader2 size={20} className="animate-spin text-black/30" aria-hidden="true" />
    </span>
  );
};

const LoginView = ({
  configured,
  loadError,
  onAuthenticated,
}: {
  configured: boolean;
  loadError: string;
  onAuthenticated: () => Promise<void>;
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetchWithTimeout('/api/admin-gallery-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Nie udało się zalogować.'));
      }

      setPassword('');
      await onAuthenticated();
    } catch (loginError) {
      setError(getRequestErrorMessage(loginError, 'Nie udało się zalogować.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
            <LockKeyhole size={22} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <p className="mt-8 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-white/42">
            Sobotki Portraits
          </p>
          <h1 className="mt-4 font-serif text-5xl font-black uppercase tracking-[-0.055em]">
            Panel galerii
          </h1>
          <p className="mx-auto mt-5 max-w-sm font-sans text-sm leading-6 text-white/55">
            Twórz galerie wydarzeń, przypisuj foldery Dropboxa i pobieraj gotowe kody QR.
          </p>
        </div>

        {!configured ? (
          <div className="mt-10 rounded-2xl border border-[#d42929]/[0.35] bg-[#d42929]/10 p-5 font-sans text-sm leading-6 text-white/[0.72]">
            <p className="font-bold text-white">Panel wymaga konfiguracji.</p>
            <p className="mt-2">
              Dodaj w Vercelu zmienną <code>GALLERY_ADMIN_PASSWORD</code>. Sesja zostanie
              podpisana kluczem aplikacji Dropbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10">
            <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Hasło administratora
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-3 min-h-14 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 font-sans text-base text-white outline-none transition-colors focus:border-white/45"
              />
            </label>
            {(error || loadError) && (
              <p className="mt-3 font-sans text-xs leading-5 text-[#ff8b8b]" role="alert">
                {error || loadError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#f3f2ed] px-6 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-40"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              Zaloguj się
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const GalleryAdminPage: React.FC = () => {
  const [authState, setAuthState] = useState<'checking' | 'login' | 'ready'>('checking');
  const [configured, setConfigured] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState('');
  const suffixRef = useRef('');

  const loadAdminData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetchWithTimeout('/api/admin-galleries', {
        headers: { Accept: 'application/json' },
      });

      if (response.status === 401) {
        setAuthState('login');
        setData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Nie udało się wczytać panelu.'));
      }

      setData((await response.json()) as AdminData);
      setAuthState('ready');
    } catch (loadError) {
      setError(getRequestErrorMessage(loadError, 'Nie udało się wczytać panelu.'));
      setAuthState('ready');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const restoreRobots = setNoIndex();
    const previousTitle = document.title;
    document.title = 'Panel galerii — Sobotki Portraits';

    const checkSession = async () => {
      try {
        const response = await fetchWithTimeout('/api/admin-gallery-auth');
        const status = await response.json();
        setConfigured(status.configured === true);

        if (status.authenticated) {
          await loadAdminData();
        } else {
          setAuthState('login');
        }
      } catch {
        setError('Nie udało się połączyć z panelem.');
        setAuthState('login');
      }
    };

    void checkSession();

    return () => {
      document.title = previousTitle;
      restoreRobots();
    };
  }, []);

  useEffect(() => {
    if (!showForm || form.originalSlug || slugTouched) {
      return;
    }

    setForm((current) => ({
      ...current,
      slug: `portrety-${suffixRef.current}`,
    }));
  }, [form.title, form.originalSlug, showForm, slugTouched]);

  const origin = typeof window === 'undefined' ? 'https://www.sobotkiweddings.pl' : window.location.origin;
  const activeGalleries = useMemo(
    () => data?.galleries.filter((gallery) => gallery.active).length || 0,
    [data]
  );

  const openCreateForm = () => {
    suffixRef.current = createSuffix();
    setSlugTouched(false);
    setForm({
      ...emptyForm(),
      folder: data?.folders[0]?.path || '',
    });
    setShowForm(true);
    setError('');
    setNotice('');
  };

  const openEditForm = (gallery: GalleryRecord) => {
    suffixRef.current = '';
    setSlugTouched(true);
    setForm({
      originalSlug: gallery.slug,
      title: gallery.title,
      date: gallery.date,
      folder: gallery.folder,
      slug: gallery.slug,
      active: gallery.active,
    });
    setShowForm(true);
    setError('');
    setNotice('');
  };

  const saveGallery = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', gallery: form }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Nie udało się zapisać galerii.'));
      }

      setData((await response.json()) as AdminData);
      setShowForm(false);
      setNotice(form.originalSlug ? 'Zmiany zostały zapisane.' : 'Galeria jest gotowa.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nie udało się zapisać galerii.');
    } finally {
      setIsLoading(false);
    }
  };

  const setGalleryActive = async (gallery: GalleryRecord, active: boolean) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active', slug: gallery.slug, active }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Nie udało się zmienić galerii.'));
      }

      setData((await response.json()) as AdminData);
      setNotice(active ? 'Galeria jest ponownie aktywna.' : 'Galeria została zarchiwizowana.');
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Nie udało się zmienić galerii.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyGalleryUrl = async (gallery: GalleryRecord) => {
    const url = `${origin}/galeria/${gallery.slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(gallery.slug);
    window.setTimeout(() => setCopiedSlug(''), 1800);
  };

  const downloadQr = async (gallery: GalleryRecord) => {
    const dataUrl = await QRCode.toDataURL(`${origin}/galeria/${gallery.slug}`, {
      width: 1200,
      margin: 4,
      color: { dark: '#111111', light: '#F3F2ED' },
      errorCorrectionLevel: 'H',
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-${gallery.slug}.png`;
    link.click();
  };

  const logout = async () => {
    await fetch('/api/admin-gallery-auth', { method: 'DELETE' });
    setData(null);
    setAuthState('login');
  };

  if (authState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
        <Loader2 size={28} className="animate-spin text-white/50" aria-label="Wczytuję panel" />
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <LoginView
        configured={configured}
        loadError={error}
        onAuthenticated={loadAdminData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-brand-black">
      <header className="bg-[#111111] px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div>
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-white/40">
              Sobotki Portraits
            </p>
            <h1 className="mt-1 font-serif text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">
              Panel galerii
            </h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 font-sans text-[9px] font-bold uppercase tracking-[0.17em] text-white/70 transition-colors hover:border-white/35 hover:text-white"
          >
            <LogOut size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-7 sm:px-8 sm:py-10">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.08] bg-white/[0.45] p-5">
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-black/[0.38]">Galerie</p>
            <p className="mt-2 font-serif text-4xl font-black">{data?.galleries.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.08] bg-white/[0.45] p-5">
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-black/[0.38]">Aktywne</p>
            <p className="mt-2 font-serif text-4xl font-black">{activeGalleries}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.08] bg-white/[0.45] p-5">
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-black/[0.38]">Foldery Dropbox</p>
            <p className="mt-2 font-serif text-4xl font-black">{data?.folders.length || 0}</p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-black uppercase tracking-[-0.04em]">Twoje galerie</h2>
            <p className="mt-1 font-sans text-xs text-black/45">
              Folder główny: {data?.galleryRoot || '/Galerie'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAdminData()}
              disabled={isLoading}
              aria-label="Odśwież foldery i galerie"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black hover:text-white disabled:opacity-40"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              disabled={!data?.folders.length}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 font-sans text-[9px] font-bold uppercase tracking-[0.17em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={16} aria-hidden="true" />
              Nowa galeria
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-[#d42929]/25 bg-[#d42929]/[0.08] px-4 py-3 font-sans text-xs text-[#9f1e1e]" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-700/15 bg-emerald-700/[0.07] px-4 py-3 font-sans text-xs text-emerald-900" role="status">
            <Check size={15} aria-hidden="true" />
            {notice}
          </div>
        )}

        {data?.folders.length === 0 && (
          <div className="mt-7 rounded-2xl border border-dashed border-black/15 p-8 text-center sm:p-12">
            <Folder size={30} strokeWidth={1.4} className="mx-auto text-black/28" aria-hidden="true" />
            <h3 className="mt-5 font-serif text-2xl font-black uppercase">Najpierw dodaj folder na Dropboxie</h3>
            <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-6 text-black/50">
              Utwórz podfolder w {data.galleryRoot}, a następnie kliknij przycisk odświeżania.
            </p>
          </div>
        )}

        {data && data.galleries.length === 0 && data.folders.length > 0 && (
          <div className="mt-7 rounded-2xl border border-dashed border-black/15 p-8 text-center sm:p-12">
            <Image size={30} strokeWidth={1.4} className="mx-auto text-black/28" aria-hidden="true" />
            <h3 className="mt-5 font-serif text-2xl font-black uppercase">Utwórz pierwszą galerię</h3>
            <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-6 text-black/50">
              Wybierzesz folder, nazwę i adres. Panel przygotuje resztę oraz kod QR.
            </p>
          </div>
        )}

        {data && data.galleries.length > 0 && (
          <div className="mt-7 grid gap-4 xl:grid-cols-2">
            {data.galleries.map((gallery) => {
              const publicUrl = `${origin}/galeria/${gallery.slug}`;

              return (
                <article
                  key={gallery.slug}
                  className={`rounded-2xl border p-4 sm:p-5 ${
                    gallery.active
                      ? 'border-black/10 bg-white/55'
                      : 'border-black/[0.07] bg-black/[0.025] opacity-70'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="hidden shrink-0 sm:block">
                      <GalleryQrPreview url={publicUrl} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className={`inline-flex rounded-full px-2.5 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.17em] ${
                            gallery.active ? 'bg-emerald-700/10 text-emerald-800' : 'bg-black/[0.07] text-black/[0.45]'
                          }`}>
                            {gallery.active ? 'Aktywna' : 'Archiwum'}
                          </span>
                          <h3 className="mt-3 truncate font-serif text-2xl font-black uppercase tracking-[-0.035em]">
                            {gallery.title}
                          </h3>
                          {gallery.date && <p className="mt-1 font-playfair text-sm italic text-black/50">{gallery.date}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditForm(gallery)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black hover:text-white"
                          aria-label={`Edytuj galerię ${gallery.title}`}
                        >
                          <Edit3 size={15} aria-hidden="true" />
                        </button>
                      </div>

                      <p className="mt-4 truncate font-sans text-[10px] text-black/42">{gallery.folder}</p>
                      <p className="mt-1 truncate font-sans text-[10px] font-medium text-black/65">{publicUrl}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => void copyGalleryUrl(gallery)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 font-sans text-[8px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white"
                    >
                      {copiedSlug === gallery.slug ? <Check size={14} /> : <Copy size={14} />}
                      {copiedSlug === gallery.slug ? 'Skopiowano' : 'Kopiuj adres'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadQr(gallery)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 font-sans text-[8px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white"
                    >
                      <QrCode size={14} aria-hidden="true" />
                      Pobierz QR
                    </button>
                    {gallery.active && (
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 font-sans text-[8px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white"
                      >
                        <ExternalLink size={14} aria-hidden="true" />
                        Otwórz
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void setGalleryActive(gallery, !gallery.active)}
                      disabled={isLoading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 font-sans text-[8px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white disabled:opacity-40"
                    >
                      {gallery.active ? <Archive size={14} /> : <RotateCcw size={14} />}
                      {gallery.active ? 'Archiwizuj' : 'Przywróć'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={form.originalSlug ? 'Edytuj galerię' : 'Nowa galeria'}>
          <div className="max-h-[95dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[#f3f2ed] p-5 sm:rounded-3xl sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-black/38">
                  {form.originalSlug ? 'Edycja' : 'Nowe wydarzenie'}
                </p>
                <h2 className="mt-1 font-serif text-3xl font-black uppercase tracking-[-0.04em]">
                  {form.originalSlug ? 'Edytuj galerię' : 'Utwórz galerię'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10"
                aria-label="Zamknij formularz"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveGallery} className="mt-7 space-y-5">
              <label className="block font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-black/48">
                Nazwa galerii
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="np. Ania & Marek"
                  required
                  maxLength={100}
                  className="mt-2 min-h-[52px] w-full rounded-xl border border-black/12 bg-white/50 px-4 font-sans text-base font-normal normal-case tracking-normal outline-none focus:border-black/40"
                />
              </label>

              <label className="block font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-black/48">
                Data lub krótki podpis
                <input
                  type="text"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  placeholder="np. 24 sierpnia 2026"
                  maxLength={100}
                  className="mt-2 min-h-[52px] w-full rounded-xl border border-black/12 bg-white/50 px-4 font-sans text-base font-normal normal-case tracking-normal outline-none focus:border-black/40"
                />
              </label>

              <label className="block font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-black/48">
                Folder na Dropboxie
                <select
                  value={form.folder}
                  onChange={(event) => setForm((current) => ({ ...current, folder: event.target.value }))}
                  required
                  className="mt-2 min-h-[52px] w-full rounded-xl border border-black/12 bg-white/50 px-4 font-sans text-sm font-normal normal-case tracking-normal outline-none focus:border-black/40"
                >
                  <option value="" disabled>Wybierz folder</option>
                  {data?.folders.map((folder) => (
                    <option key={folder.path} value={folder.path}>{folder.name}</option>
                  ))}
                </select>
              </label>

              <label className="block font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-black/48">
                Adres galerii
                <div className="mt-2 flex min-h-[52px] items-center rounded-xl border border-black/12 bg-white/50 pl-4 focus-within:border-black/40">
                  <span className="shrink-0 font-sans text-xs font-normal normal-case tracking-normal text-black/35">/galeria/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
                    }}
                    required
                    maxLength={96}
                    className="min-h-[52px] min-w-0 flex-1 bg-transparent pr-4 font-sans text-sm font-normal normal-case tracking-normal outline-none"
                  />
                </div>
                <span className="mt-2 block font-sans text-[10px] font-normal normal-case tracking-normal text-black/35">
                  Losowy fragment utrudnia odgadnięcie adresu osobom bez QR. Nie używaj tutaj nazwisk.
                </span>
              </label>

              {error && <p className="font-sans text-xs text-[#a62020]" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || !form.title || !form.folder || !form.slug}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-black px-6 font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-white disabled:cursor-wait disabled:opacity-35"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {form.originalSlug ? 'Zapisz zmiany' : 'Utwórz galerię i QR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
