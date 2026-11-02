const VIDEO_KEYS = ['creative', 'family'];

export const youtubeVideoId = (value) => {
  if (!value) return '';
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    const host = url.hostname.toLowerCase();
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : '';
  } catch { return ''; }
};

export const dropboxVideoDownloadUrl = (value) => {
  if (!value) return '';
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== 'https:' || url.username || url.password ||
        !['dropbox.com', 'www.dropbox.com'].includes(url.hostname.toLowerCase()) ||
        !/^\/(?:s\/|scl\/fi\/)/.test(url.pathname)) return '';
    url.searchParams.delete('raw');
    url.searchParams.set('dl', '1');
    return url.toString();
  } catch { return ''; }
};

export const normalizeGalleryVideos = (value, strict = false) => Object.fromEntries(
  VIDEO_KEYS.map((key) => {
    const youtube = String(value?.[key]?.youtubeUrl || '').trim().slice(0, 2048);
    const download = String(value?.[key]?.downloadUrl || '').trim().slice(0, 2048);
    const id = youtubeVideoId(youtube);
    const downloadUrl = dropboxVideoDownloadUrl(download);
    if (strict && youtube && !id) throw new Error(`Film ${key === 'creative' ? 'Kreatywny' : 'Rodzinny'}: wklej poprawny link HTTPS do filmu na YouTube.`);
    if (strict && download && !downloadUrl) throw new Error(`Film ${key === 'creative' ? 'Kreatywny' : 'Rodzinny'}: wklej link Dropbox do pliku filmu, a nie do folderu.`);
    return [key, { youtubeUrl: id ? `https://www.youtube.com/watch?v=${id}` : '', downloadUrl }];
  })
);

export const getVisibleVideoItems = (videos) => VIDEO_KEYS.flatMap((key) => {
  const video = normalizeGalleryVideos(videos)[key];
  if (!video.youtubeUrl && !video.downloadUrl) return [];
  const id = youtubeVideoId(video.youtubeUrl);
  return [{
    key,
    title: key === 'creative' ? 'Film Kreatywny' : 'Film Rodzinny',
    embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : '',
    youtubeUrl: video.youtubeUrl,
    downloadUrl: video.downloadUrl,
  }];
});
