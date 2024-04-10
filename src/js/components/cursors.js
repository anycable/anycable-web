import 'anycable-elements/cursors-element';

// Show cursors only on desktop
const mql = window.matchMedia('(min-width: 1024px)');

mql.addEventListener('change', e => {
  const cursors = document.querySelector('anycable-cursors');
  if (!cursors) return;

  if (e.matches) {
    cursors.connect();
  } else {
    cursors.disconnect();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const cursors = document.querySelector('anycable-cursors');
  if (cursors && !mql.matches) {
    cursors.disconnect();
  }
});
