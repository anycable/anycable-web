const header = document.querySelector('.header') as HTMLElement;
const trigger = document.querySelector('.main-slide') as HTMLElement;
const observerOptions = {
  rootMargin: '-50px 0px 0px 0px',
  threshold: 0,
};

const onEntry: IntersectionObserverCallback = entry => {
  entry.forEach(change => {
    header.style.display = 'inherit'; //prevents flickering while loading
    change.isIntersecting
      ? header.classList.remove('header_shown')
      : header.classList.add('header_shown');
  });
};

const observer = new IntersectionObserver(onEntry, observerOptions);

trigger && observer.observe(trigger);
