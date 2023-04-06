import AnimationController from './AnimationController';

const slideShowFrames = new AnimationController({
  triggerClassName: 'anim-trigger',
  frameClassName: 'anim-frame',
  visibilityClassName: 'slide-show__frame_visible',
  scrollStylesClassNames: {
    downScrollClassName: 'slide-show__frame_type_down-scroll',
    upScrollClassName: 'slide-show__frame_type_up-scroll',
  },
  scrollOffsets: [0, 200],
  showFirstFrame: true,
});

slideShowFrames.init();
