(function () {
  'use strict';
  const gallery = document.getElementById('sport-gallery');
  if (!gallery) return;
  const track = gallery.querySelector('.sport-gallery-track');
  const cards = Array.from(track.querySelectorAll('.sport-gallery-card'));
  if (cards.length < 2) return;
  const controls = gallery.querySelector('.gallery-controls');
  const toggle = gallery.querySelector('[data-gallery-toggle]');
  const counter = gallery.querySelector('[data-gallery-counter]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let onScreen = !('IntersectionObserver' in window);
  let interactionUntil = 0;
  let timer;
  let interactionTimer;

  const offsets = () => cards.map(card => card.offsetLeft - cards[0].offsetLeft);
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  function updateCounter() {
    const positions = offsets();
    let index = 0;
    positions.forEach((position, candidate) => {
      if (Math.abs(position - track.scrollLeft) < Math.abs(positions[index] - track.scrollLeft)) index = candidate;
    });
    gallery.dataset.galleryIndex = String(index);
    counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
  }
  function go(direction) {
    const positions = offsets();
    const limit = maxScroll();
    const current = track.scrollLeft;
    let destination;
    if (direction > 0) destination = current >= limit - 3 ? 0 : (positions.find(position => position > current + 3) ?? limit);
    else destination = current <= 3 ? limit : ([...positions].reverse().find(position => position < current - 3) ?? 0);
    track.scrollTo({ left: Math.min(limit, destination), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  function syncAutoplay() {
    window.clearTimeout(timer);
    const paused = userPaused || hovered || focused || document.hidden || !onScreen || Date.now() < interactionUntil || maxScroll() < 2;
    gallery.dataset.autoplay = paused ? 'paused' : 'running';
    if (!paused) timer = window.setTimeout(() => { go(1); syncAutoplay(); }, 5000);
  }
  function updateToggle() {
    toggle.textContent = userPaused ? '播放' : '暂停';
    toggle.setAttribute('aria-label', userPaused ? '播放自动切换' : '暂停自动切换');
  }
  function pauseForInteraction() {
    interactionUntil = Date.now() + 8000;
    window.clearTimeout(interactionTimer);
    interactionTimer = window.setTimeout(syncAutoplay, 8050);
    syncAutoplay();
  }
  gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => { go(-1); pauseForInteraction(); });
  gallery.querySelector('[data-gallery-next]').addEventListener('click', () => { go(1); pauseForInteraction(); });
  toggle.addEventListener('click', () => { userPaused = !userPaused; interactionUntil = 0; updateToggle(); syncAutoplay(); });
  gallery.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovered = true; syncAutoplay(); } });
  gallery.addEventListener('pointerleave', () => { hovered = false; syncAutoplay(); });
  gallery.addEventListener('focusin', () => { focused = true; syncAutoplay(); });
  gallery.addEventListener('focusout', event => { focused = gallery.contains(event.relatedTarget); syncAutoplay(); });
  track.addEventListener('pointerdown', pauseForInteraction, { passive: true });
  track.addEventListener('wheel', pauseForInteraction, { passive: true });
  track.addEventListener('scroll', updateCounter, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') track.scrollTo({ left: event.key === 'Home' ? 0 : maxScroll(), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    else go(event.key === 'ArrowRight' ? 1 : -1);
    pauseForInteraction();
  });
  document.addEventListener('visibilitychange', syncAutoplay);
  reducedMotion.addEventListener('change', () => { userPaused = reducedMotion.matches; updateToggle(); syncAutoplay(); });
  window.addEventListener('resize', () => { updateCounter(); syncAutoplay(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; syncAutoplay(); }, { threshold: .15 });
    observer.observe(gallery);
  }
  controls.hidden = false;
  updateCounter();
  updateToggle();
  syncAutoplay();
})();
