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
  coverPhoto: string;
  photoCount: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminGalleryPhoto = {
  id: string;
  name: string;
  thumbnailUrl: string;
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

const formatPhotoCount = (count: number | null) => {
  if (count === null) {
    return 'Liczba zdjęć niedostępna';
  }

  if (count === 1) {
    return '1 zdjęcie';
  }

  const modulo100 = count % 100;
  const modulo10 = count % 10;

  if ((modulo100 < 12 || modulo100 > 14) && modulo10 >= 2 && modulo10 <= 4) {
    return `${count} zdjęcia`;
  }

  return `${count} zdjęć`;
};

const loadCanvasImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nie udało się przygotować kodu QR.'));
    image.src = source;
  });

const canvasToA4Pdf = async (canvas: HTMLCanvasElement) => {
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się utworzyć pliku PDF.'))),
      'image/jpeg',
      0.98
    );
  });
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets = Array<number>(6).fill(0);
  let byteLength = 0;

  const append = (value: string | Uint8Array) => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes);
    byteLength += bytes.byteLength;
  };
  const beginObject = (id: number) => {
    offsets[id] = byteLength;
    append(`${id} 0 obj\n`);
  };

  append('%PDF-1.4\n%Sobotki Portraits\n');
  beginObject(1);
  append('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  beginObject(2);
  append('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  beginObject(3);
  append(
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n'
  );
  beginObject(4);
  append(
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`
  );
  append(jpegBytes);
  append('\nendstream\nendobj\n');

  const pageContent = encoder.encode('q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n');
  beginObject(5);
  append(`<< /Length ${pageContent.byteLength} >>\nstream\n`);
  append(pageContent);
  append('endstream\nendobj\n');

  const xrefOffset = byteLength;
  append('xref\n0 6\n0000000000 65535 f \n');
  for (let id = 1; id <= 5; id += 1) {
    append(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdfBytes = new Uint8Array(byteLength);
  let writeOffset = 0;

  chunks.forEach((chunk) => {
    pdfBytes.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  });

  return new Blob([pdfBytes.buffer], { type: 'application/pdf' });
};

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
  const [oauthCode, setOauthCode] = useState('');
  const [oauthError, setOauthError] = useState('');
  const [oauthRefreshToken, setOauthRefreshToken] = useState('');
  const [isOauthLoading, setIsOauthLoading] = useState(false);
  const [oauthTokenCopied, setOauthTokenCopied] = useState(false);
  const [coverGallery, setCoverGallery] = useState<GalleryRecord | null>(null);
  const [coverPhotos, setCoverPhotos] = useState<AdminGalleryPhoto[]>([]);
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState('');
  const [coverError, setCoverError] = useState('');
  const [isCoverLoading, setIsCoverLoading] = useState(false);
  const [cardGeneratingSlug, setCardGeneratingSlug] = useState('');
  const suffixRef = useRef('');

  useEffect(() => {
    if (!coverGallery && !showForm) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const lenis = (window as any).lenis;
    document.body.style.overflow = 'hidden';
    lenis?.stop?.();

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start?.();
    };
  }, [coverGallery, showForm]);

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

  const startDropboxAuthorization = async () => {
    setIsOauthLoading(true);
    setOauthError('');

    try {
      const response = await fetchWithTimeout('/api/admin-dropbox-oauth');

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Nie udało się otworzyć Dropboxa.'));
      }

      const payload = await response.json();

      if (!payload.authorizeUrl) {
        throw new Error('Dropbox nie zwrócił adresu autoryzacji.');
      }

      window.open(payload.authorizeUrl, '_blank', 'noopener,noreferrer');
    } catch (authorizationError) {
      setOauthError(
        getRequestErrorMessage(authorizationError, 'Nie udało się otworzyć Dropboxa.')
      );
    } finally {
      setIsOauthLoading(false);
    }
  };

  const exchangeDropboxCode = async (event: FormEvent) => {
    event.preventDefault();
    setIsOauthLoading(true);
    setOauthError('');
    setOauthRefreshToken('');

    try {
      const response = await fetchWithTimeout('/api/admin-dropbox-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: oauthCode }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Nie udało się wygenerować refresh tokenu.')
        );
      }

      const payload = await response.json();

      if (!payload.refreshToken) {
        throw new Error('Dropbox nie zwrócił refresh tokenu.');
      }

      setOauthRefreshToken(payload.refreshToken);
      setOauthCode('');
    } catch (exchangeError) {
      setOauthError(
        getRequestErrorMessage(exchangeError, 'Nie udało się wygenerować refresh tokenu.')
      );
    } finally {
      setIsOauthLoading(false);
    }
  };

  const copyRefreshToken = async () => {
    await navigator.clipboard.writeText(oauthRefreshToken);
    setOauthTokenCopied(true);
    window.setTimeout(() => setOauthTokenCopied(false), 1800);
  };

  const openCoverPicker = async (gallery: GalleryRecord) => {
    setCoverGallery(gallery);
    setCoverPhotos([]);
    setSelectedCoverPhoto(gallery.coverPhoto || '');
    setCoverError('');
    setIsCoverLoading(true);

    try {
      const response = await fetchWithTimeout(
        `/api/admin-galleries?photosFor=${encodeURIComponent(gallery.slug)}`
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Nie udało się wczytać zdjęć.'));
      }

      const payload = await response.json();
      setCoverPhotos(Array.isArray(payload.photos) ? payload.photos : []);
      setSelectedCoverPhoto(payload.coverPhoto || '');
    } catch (photoError) {
      setCoverError(getRequestErrorMessage(photoError, 'Nie udało się wczytać zdjęć.'));
    } finally {
      setIsCoverLoading(false);
    }
  };

  const saveCoverPhoto = async (photoName: string) => {
    if (!coverGallery) {
      return;
    }

    setIsCoverLoading(true);
    setCoverError('');

    try {
      const response = await fetchWithTimeout('/api/admin-galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_cover',
          slug: coverGallery.slug,
          photoName,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Nie udało się ustawić okładki.'));
      }

      setData((await response.json()) as AdminData);
      setCoverGallery(null);
      setNotice(photoName ? 'Okładka galerii została ustawiona.' : 'Okładka została usunięta.');
    } catch (saveError) {
      setCoverError(getRequestErrorMessage(saveError, 'Nie udało się ustawić okładki.'));
    } finally {
      setIsCoverLoading(false);
    }
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

  const downloadGalleryCard = async (gallery: GalleryRecord) => {
    setCardGeneratingSlug(gallery.slug);
    setError('');

    try {
      await document.fonts.ready;
      await Promise.all([
        document.fonts.load('800 180px "podium-sharp-variable"'),
        document.fonts.load('italic 58px "Playfair Display"'),
        document.fonts.load('700 32px "DM Sans"'),
      ]);

      const galleryUrl = `${origin}/galeria/${gallery.slug}`;
      const qrDataUrl = await QRCode.toDataURL(galleryUrl, {
        width: 1600,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
      const qrImage = await loadCanvasImage(qrDataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = 2480;
      canvas.height = 3508;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Nie udało się przygotować karty A4.');
      }

      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#000000';
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      const drawFittedText = (
        text: string,
        y: number,
        maxWidth: number,
        initialSize: number,
        font: (size: number) => string
      ) => {
        let size = initialSize;
        context.font = font(size);

        while (context.measureText(text).width > maxWidth && size > 24) {
          size -= 2;
          context.font = font(size);
        }

        context.fillText(text, canvas.width / 2, y);
      };

      drawFittedText(
        'POBIERZ ZDJĘCIA NA TELEFON',
        560,
        2110,
        210,
        (size) => `800 ${size}px "podium-sharp-variable", "Arial Narrow", sans-serif`
      );
      drawFittedText(
        'Zeskanuj kod QR, aby otworzyć galerię zdjęć z dzisiejszej imprezy',
        760,
        2050,
        60,
        (size) => `italic ${size}px "Playfair Display", serif`
      );

      const qrSize = 1600;
      context.drawImage(qrImage, (canvas.width - qrSize) / 2, 930, qrSize, qrSize);

      drawFittedText(
        'SOBOTKI PORTRAITS',
        3070,
        1200,
        125,
        (size) => `600 ${size}px "podium-sharp-variable", "Arial Narrow", sans-serif`
      );

      context.strokeStyle = '#D8D8D8';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(620, 3270);
      context.lineTo(1860, 3270);
      context.stroke();

      const galleryLabel = [gallery.title, gallery.date].filter(Boolean).join(' · ');
      drawFittedText(
        `KARTA DO GALERII: ${galleryLabel}`.toUpperCase(),
        3340,
        1900,
        30,
        (size) => `700 ${size}px "DM Sans", sans-serif`
      );

      const pdf = await canvasToA4Pdf(canvas);
      const pdfUrl = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `karta-a4-${gallery.slug}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (cardError) {
      setError(
        cardError instanceof Error ? cardError.message : 'Nie udało się przygotować karty A4.'
      );
    } finally {
      setCardGeneratingSlug('');
    }
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

        {!data && (
          <section className="mt-7 rounded-2xl border border-black/10 bg-white/60 p-5 sm:p-7">
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
              Trwałe połączenie
            </p>
            <h3 className="mt-2 font-serif text-2xl font-black uppercase tracking-[-0.035em]">
              Połącz Dropbox przez OAuth
            </h3>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-black/55">
              Panel poprosi Dropbox o właściwe uprawnienia i wygeneruje refresh token, który nie
              wygasa po kilku godzinach.
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-black/[0.08] p-4">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-black/65">
                  1. Autoryzuj konto
                </p>
                <p className="mt-2 font-sans text-xs leading-5 text-black/48">
                  Dropbox otworzy się w nowej karcie. Zatwierdź dostęp, a następnie skopiuj
                  wyświetlony kod.
                </p>
                <button
                  type="button"
                  onClick={() => void startDropboxAuthorization()}
                  disabled={isOauthLoading}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-white disabled:opacity-40"
                >
                  <ExternalLink size={15} aria-hidden="true" />
                  Otwórz autoryzację Dropbox
                </button>
              </div>

              <form onSubmit={exchangeDropboxCode} className="rounded-xl border border-black/[0.08] p-4">
                <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-black/65">
                  2. Wklej kod Dropbox
                  <input
                    type="text"
                    value={oauthCode}
                    onChange={(event) => setOauthCode(event.target.value)}
                    autoComplete="off"
                    className="mt-3 min-h-12 w-full rounded-xl border border-black/10 bg-white px-3 font-mono text-xs outline-none focus:border-black/35"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isOauthLoading || !oauthCode.trim()}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 px-5 font-sans text-[9px] font-bold uppercase tracking-[0.16em] disabled:opacity-35"
                >
                  {isOauthLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                  Wygeneruj refresh token
                </button>
              </form>
            </div>

            {oauthError && (
              <p className="mt-4 font-sans text-xs leading-5 text-[#a62020]" role="alert">
                {oauthError}
              </p>
            )}

            {oauthRefreshToken && (
              <div className="mt-5 rounded-xl border border-emerald-800/15 bg-emerald-700/[0.06] p-4">
                <p className="font-sans text-xs font-bold text-emerald-950">
                  Refresh token został wygenerowany.
                </p>
                <p className="mt-2 font-sans text-xs leading-5 text-emerald-950/65">
                  Skopiuj go teraz i dodaj w Vercelu jako <code>DROPBOX_REFRESH_TOKEN</code> dla
                  Production. Usuń wtedy <code>DROPBOX_ACCESS_TOKEN</code>. Token zniknie po
                  odświeżeniu tej strony.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="password"
                    readOnly
                    value={oauthRefreshToken}
                    aria-label="Wygenerowany refresh token"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-emerald-900/10 bg-white px-3 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void copyRefreshToken()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-950 px-4 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-white"
                  >
                    {oauthTokenCopied ? <Check size={14} /> : <Copy size={14} />}
                    {oauthTokenCopied ? 'Skopiowano' : 'Kopiuj'}
                  </button>
                </div>
              </div>
            )}
          </section>
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.17em] ${
                              gallery.active ? 'bg-emerald-700/10 text-emerald-800' : 'bg-black/[0.07] text-black/[0.45]'
                            }`}>
                              {gallery.active ? 'Aktywna' : 'Archiwum'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.055] px-2.5 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.13em] text-black/55">
                              <Image size={11} aria-hidden="true" />
                              {formatPhotoCount(gallery.photoCount)}
                            </span>
                          </div>
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
                    <button
                      type="button"
                      onClick={() => void downloadGalleryCard(gallery)}
                      disabled={cardGeneratingSlug === gallery.slug}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 font-sans text-[8px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-40"
                    >
                      {cardGeneratingSlug === gallery.slug ? (
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Download size={14} aria-hidden="true" />
                      )}
                      Pobierz kartę A4
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
                      onClick={() => void openCoverPicker(gallery)}
                      disabled={isLoading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 font-sans text-[8px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white disabled:opacity-40"
                    >
                      <Image size={14} aria-hidden="true" />
                      {gallery.coverPhoto ? 'Zmień okładkę' : 'Ustaw okładkę'}
                    </button>
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

      {coverGallery && (
        <div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Ustaw okładkę galerii ${coverGallery.title}`}
        >
          <div className="flex max-h-[95dvh] w-full max-w-5xl flex-col rounded-t-3xl bg-[#f3f2ed] sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-black/[0.08] p-5 sm:p-7">
              <div>
                <p className="font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-black/38">
                  {coverGallery.title}
                </p>
                <h2 className="mt-1 font-serif text-3xl font-black uppercase tracking-[-0.04em]">
                  Ustaw okładkę
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCoverGallery(null)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10"
                aria-label="Zamknij wybór okładki"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div
              data-lenis-prevent
              className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-4 sm:p-7"
            >
              {isCoverLoading && coverPhotos.length === 0 && (
                <div className="flex min-h-56 items-center justify-center" role="status">
                  <Loader2 size={26} className="animate-spin text-black/35" aria-hidden="true" />
                  <span className="sr-only">Wczytuję zdjęcia</span>
                </div>
              )}

              {!isCoverLoading && coverPhotos.length === 0 && !coverError && (
                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                  <Image size={30} className="text-black/25" aria-hidden="true" />
                  <p className="mt-4 font-serif text-2xl font-black uppercase">
                    W galerii nie ma jeszcze zdjęć
                  </p>
                </div>
              )}

              {coverPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {coverPhotos.map((photo, index) => {
                    const selected = selectedCoverPhoto === photo.name;

                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setSelectedCoverPhoto(photo.name)}
                        className={`group relative aspect-[4/5] overflow-hidden rounded-xl border-2 bg-black/[0.06] transition ${
                          selected ? 'border-black' : 'border-transparent hover:border-black/30'
                        }`}
                        aria-label={`Wybierz zdjęcie ${index + 1} jako okładkę`}
                        aria-pressed={selected}
                      >
                        <img
                          src={photo.thumbnailUrl}
                          alt={`Zdjęcie ${index + 1}`}
                          loading={index < 8 ? 'eager' : 'lazy'}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                        {selected && (
                          <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                            <Check size={16} aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {coverError && (
                <p className="mt-4 font-sans text-xs text-[#a62020]" role="alert">
                  {coverError}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] p-4 sm:p-6">
              <button
                type="button"
                onClick={() => void saveCoverPhoto('')}
                disabled={isCoverLoading || !coverGallery.coverPhoto}
                className="min-h-11 rounded-full border border-black/10 px-5 font-sans text-[9px] font-bold uppercase tracking-[0.16em] disabled:opacity-30"
              >
                Usuń okładkę
              </button>
              <button
                type="button"
                onClick={() => void saveCoverPhoto(selectedCoverPhoto)}
                disabled={isCoverLoading || !selectedCoverPhoto}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-white disabled:opacity-30"
              >
                {isCoverLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                Ustaw wybrane zdjęcie
              </button>
            </div>
          </div>
        </div>
      )}

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
