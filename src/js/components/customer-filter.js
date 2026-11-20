// Industry filter for the customers logo wall: shows the tiles whose
// data-industry matches the pressed chip, or all of them.
const filters = document.querySelector("[data-controller='customer-filter']");
const wall = document.querySelector('[data-customer-wall]');

if (filters && wall) {
  const chips = filters.querySelectorAll('[data-filter]');
  const tiles = wall.querySelectorAll('[data-industry]');

  filters.addEventListener('click', event => {
    const chip = event.target.closest('[data-filter]');
    if (!chip) return;

    const industry = chip.getAttribute('data-filter');
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    tiles.forEach(tile => {
      tile.hidden =
        industry !== 'all' && tile.getAttribute('data-industry') !== industry;
    });
  });
}
