(() => {
  const section = document.getElementById('specialty');
  if (!section) return;
  const track = section.querySelector('.sc-track');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  section.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#sc-"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = section.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    const behavior = motion.matches ? 'instant' : 'smooth';
    if (target.parentElement === track) {
      track.querySelectorAll('.sc-highlight').forEach(card => card.classList.remove('sc-highlight'));
      target.classList.add('sc-highlight');
      const offset = target.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollBy({ left: offset, behavior });
    } else {
      target.scrollIntoView({ behavior, block: 'start' });
    }
  });
})();
