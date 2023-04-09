import Splide from '@splidejs/splide';
import '@splidejs/splide/dist/css/splide.min.css';

const carousel = new Splide('.splide', {
  type: 'slide',
  perPage: 1,
  focus: 'center',
  gap: 16,
  rewind: true,
  rewindByDrag: true,
  flickPower: 150,
  rewindSpeed: 600,
  arrows: false,
  pagination: false,
  trimSpace: false,
  start: 2,
  fixedWidth: 256,
  mediaQuery: 'min',
  breakpoints: {
    1072: {
      destroy: true,
    },
    581: {
      drag: 'free',
      trimSpace: true,
      padding: 16,
    },
  },
});

carousel.mount();
