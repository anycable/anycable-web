import Popup from './Popup';

const tryNowPopup = new Popup('.try-now-popup');

const signUpBtn = document.querySelector('.sign-up-btn');
const tryNowBtns = document.querySelectorAll('.try-now-btn');

tryNowPopup.init(); //prevents flickering while loading

signUpBtn?.addEventListener('click', () => {
  tryNowPopup.open();
});

tryNowBtns.forEach(btn =>
  btn.addEventListener('click', () => {
    tryNowPopup.open();
  })
);
