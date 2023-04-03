import AnimationController from './AnimationController';

const slideShow = new AnimationController({
  triggerClass: 'anim-trigger',
  frameClass: 'anim-frame',
  visibilityClass: 'about-slide__slide-show-frame_visible',
  scrollOffsets: [0, 200],
  showFirstFrame: true,
});

slideShow.init();
