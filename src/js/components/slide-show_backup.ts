// const animationTrigger1 = document.querySelector(
//   '#animation-trigger-1'
// ) as HTMLElement;
// const animationTrigger2 = document.querySelector(
//   '#animation-trigger-2'
// ) as HTMLElement;
// const animationTrigger3 = document.querySelector(
//   '#animation-trigger-3'
// ) as HTMLElement;
// const animationTrigger4 = document.querySelector(
//   '#animation-trigger-4'
// ) as HTMLElement;

// const animationFrame1 = document.querySelector(
//   '#animation-frame-1'
// ) as HTMLElement;
// const animationFrame2 = document.querySelector(
//   '#animation-frame-2'
// ) as HTMLElement;
// const animationFrame3 = document.querySelector(
//   '#animation-frame-3'
// ) as HTMLElement;
// const animationFrame4 = document.querySelector(
//   '#animation-frame-4'
// ) as HTMLElement;

// const visibilityClass = 'about-slide__slide-show-frame_visible';

// window.addEventListener('scroll', () => {
//   let scrollOffset1 = window.screen.height / 2 - 200;
//   let scrollOffset2 = window.screen.height / 2;
//   // let firstTriggerTop = animationTrigger1.getBoundingClientRect().top;
//   let secondTriggerTop = animationTrigger2.getBoundingClientRect().top;
//   let thirdTriggerTop = animationTrigger3.getBoundingClientRect().top;
//   let fourthTriggerTop = animationTrigger4.getBoundingClientRect().top;

//   if (secondTriggerTop - scrollOffset1 < 0) {
//     animationFrame2.classList.add(visibilityClass);
//     animationFrame1.classList.remove(visibilityClass);
//   } else {
//     animationFrame2.classList.remove(visibilityClass);
//     animationFrame1.classList.add(visibilityClass);
//     getFrame(animationFrames, 'animation-frame-2')?.classList.remove(
//       visibilityClass
//     );
//     getFrame(animationFrames, 'animation-frame-1')?.classList.add(
//       visibilityClass
//     );
//   }

//   if (thirdTriggerTop - scrollOffset2 < 0) {
//     animationFrame3.classList.add(visibilityClass);
//     animationFrame2.classList.remove(visibilityClass);
//   } else {
//     animationFrame3.classList.remove(visibilityClass);
//   }

//   if (fourthTriggerTop - scrollOffset2 < 0) {
//     animationFrame4.classList.add(visibilityClass);
//     animationFrame3.classList.remove(visibilityClass);
//   } else {
//     animationFrame4.classList.remove(visibilityClass);
//   }
// });
