// The phone menu is a native <details>. After a link inside it is followed
// to an anchor on this page, or the visitor clicks elsewhere or presses
// Escape, the menu closes.
const menu = document.querySelector<HTMLDetailsElement>('.header__menu');

if (menu) {
  const close = () => {
    menu.open = false;
  };
  menu.addEventListener('click', event => {
    if ((event.target as Element).closest('a')) close();
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target as Node)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      close();
      menu.querySelector('summary')?.focus();
    }
  });
}
