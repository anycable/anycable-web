import './index.scss';
import './js/index.js';
import jump from 'jump.js';
import Popup from './js/components/Popup';

// Header show/hide
// ----------------
const header = document.querySelector('.header');
const trigger = document.querySelector('.main-slide');
const observerOptions = {
  rootMargin: '-50px 0px 0px 0px',
  threshold: 0,
};

const onEntry: IntersectionObserverCallback = entry => {
  entry.forEach(change => {
    if (!header) {
      return;
    }
    change.isIntersecting
      ? header.classList.add('header_hidden')
      : header.classList.remove('header_hidden');
  });
};

const observer = new IntersectionObserver(onEntry, observerOptions);

trigger && observer.observe(trigger);

// Popups show/hide
// -----------------------
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

// Learn more scroll
// -----------------------
const learnMoreBtn = document.querySelector('.main-slide__learn-more-btn');

learnMoreBtn?.addEventListener('click', () => {
  jump('.about-slide', {
    duration: 500,
  });
});

//to prevent flickering on load
window.addEventListener('load', () => {
  document.body.style.visibility = 'visible';
});

const animationTrigger1 = document.querySelector(
  '#animation-trigger-1'
) as HTMLElement;
const animationTrigger2 = document.querySelector(
  '#animation-trigger-2'
) as HTMLElement;
const animationTrigger3 = document.querySelector(
  '#animation-trigger-3'
) as HTMLElement;
const animationTrigger4 = document.querySelector(
  '#animation-trigger-4'
) as HTMLElement;

const animationFrame1 = document.querySelector(
  '#animation-frame-1'
) as HTMLElement;
const animationFrame2 = document.querySelector(
  '#animation-frame-2'
) as HTMLElement;
const animationFrame3 = document.querySelector(
  '#animation-frame-3'
) as HTMLElement;
const animationFrame4 = document.querySelector(
  '#animation-frame-4'
) as HTMLElement;

window.addEventListener('scroll', () => {
  let scrollOffset1 = window.screen.height / 2 - 200;
  let scrollOffset2 = window.screen.height / 2;
  let scrollOffset3 = window.screen.height / 2;
  let firstTriggerTop = animationTrigger1.getBoundingClientRect().top;
  let secondTriggerTop = animationTrigger2.getBoundingClientRect().top;
  let thirdTriggerTop = animationTrigger3.getBoundingClientRect().top;
  let fourthTriggerTop = animationTrigger4.getBoundingClientRect().top;

  if (secondTriggerTop - scrollOffset1 < 0) {
    animationFrame2.classList.add('visible');
    animationFrame1.classList.remove('visible');
    animationFrame3.classList.remove('visible');
    animationFrame4.classList.remove('visible');
  } else {
    animationFrame2.classList.remove('visible');
    animationFrame1.classList.add('visible');
  }

  if (thirdTriggerTop - scrollOffset2 < 0) {
    animationFrame3.classList.add('visible');
    animationFrame1.classList.remove('visible');
    animationFrame2.classList.remove('visible');
    animationFrame4.classList.remove('visible');
  } else {
    animationFrame3.classList.remove('visible');
  }

  if (fourthTriggerTop - scrollOffset3 < 0) {
    animationFrame4.classList.add('visible');
    animationFrame1.classList.remove('visible');
    animationFrame2.classList.remove('visible');
    animationFrame3.classList.remove('visible');
  } else {
    animationFrame4.classList.remove('visible');
  }
});
