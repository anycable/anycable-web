import application from '../app';
import nodeY from '../utils/node-y';

// Keep illustration in the middle of the screen (y-coordinate).
// Illustration container must have position: absolute.
// Parent must have overflow: hidden.
application.component('.js-slide-illustration', {
  init() {
    this.eventHandler = this.eventHandler.bind(this);
    this.moveNode = this.moveNode.bind(this);
    this.eventHandler();
    this.watch();
  },

  eventHandler() {
    if (!this.node.offsetParent) return;

    requestAnimationFrame(this.moveNode);
  },

  moveNode() {
    const y = nodeY(this.node);
    const viewTop = document.body.scrollTop || document.documentElement.scrollTop;

    // The middle of the screen coordinate
    const screenY = (document.documentElement.clientHeight / 2);
    // The parent's current top position
    const parentY = nodeY(this.node.offsetParent);
    // The distance between the parent top and the middle of the screen
    const delta = (viewTop - parentY) + screenY;
    const h = this.node.offsetHeight;
    // The required shift is equal to delta + el.height / 2.
    const shift = delta - h / 2;

    this.node.style.top = `${shift}px`;
  },

  watch() {
    window.addEventListener('scroll', this.eventHandler);
    window.addEventListener('resize', this.eventHandler);
  },
});
