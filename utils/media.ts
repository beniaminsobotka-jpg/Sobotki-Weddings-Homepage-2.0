export const HERO_VIDEO_POSTER = '/media/hero-video-poster.jpg';

export const HERO_VIDEO_SOURCES = [
  {
    src: '/media/hero-video-hevc.mp4',
    type: 'video/mp4; codecs="hvc1"',
  },
  {
    src: '/media/hero-video-fallback.mp4',
    type: 'video/mp4; codecs="avc1.64001f"',
  },
] as const;

const withSizeSuffix = (src: string, suffix: string) => src.replace(/\.avif$/i, `${suffix}.avif`);

export const getPortraitTileSrcSet = (src: string) =>
  [
    `${withSizeSuffix(src, '-1024x683')} 1024w`,
    `${withSizeSuffix(src, '-1536x1024')} 1536w`,
    `${src} 2048w`,
  ].join(', ');
