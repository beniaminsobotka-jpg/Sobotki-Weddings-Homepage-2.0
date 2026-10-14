const video = document.querySelector('#cloudGalleryVideo');

if (video) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  const syncPlayback = () => {
    if (!visible || document.hidden || reducedMotion.matches) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0.15 }).observe(video);
  }
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  syncPlayback();
}
