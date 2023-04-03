const header = document.querySelector('.header') as HTMLElement;
const trigger = document.querySelector('.main-slide') as HTMLElement;
const observerOptions = {
  rootMargin: '-50px 0px 0px 0px',
  threshold: 0,
};

const onEntry: IntersectionObserverCallback = entry => {
  entry.forEach(change =>
    change.isIntersecting
      ? header.classList.add('header_hidden')
      : header.classList.remove('header_hidden')
  );
};

const observer = new IntersectionObserver(onEntry, observerOptions);

observer.observe(trigger);
