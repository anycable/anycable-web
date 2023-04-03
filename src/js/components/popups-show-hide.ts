import Popup from './Popup';

const tryNowPopup = new Popup('.try-now-popup');
const contactUsPopup = new Popup('.contact-us-popup');

const signUpBtn = document.querySelector('.sign-up-btn');
const tryNowBtns = document.querySelectorAll('.try-now-btn');
const contactUsBtn = document.querySelector('.contact-us-btn');

signUpBtn?.addEventListener('click', () => {
  tryNowPopup.open();
});

tryNowBtns.forEach(btn =>
  btn.addEventListener('click', () => {
    tryNowPopup.open();
  })
);

contactUsBtn?.addEventListener('click', () => {
  contactUsPopup.open();
});
