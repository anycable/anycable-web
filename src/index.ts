import './index.scss';
import './js/index.js';
import './js/components/slide-show';
import './js/components/carousel';

//to prevent flickering on load
window.addEventListener('load', () => {
  document.body.style.visibility = 'visible';
});
