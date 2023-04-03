import jump from 'jump.js';

const learnMoreBtn = document.querySelector('.main-slide__learn-more-btn');

learnMoreBtn?.addEventListener('click', () => {
  jump('.about-slide', {
    duration: 500,
  });
});
