import application from '../app';
import nodeY from '../utils/node-y';

application.component('.js-bubble', {
  init() {
    this.delta = this.node.dataset['delta'] | 0;
    this.invertAnchors = (this.node.dataset['invertAnchors'] || '')
      .split(',')
      .map((id) => document.getElementById(id))
      .filter( (el) => el)
    this.inverted = false;
    this.eventHandler = this.eventHandler.bind(this);
    this.eventHandler();
    this.watch();
  },

  eventHandler() {
    const y = nodeY(this.node);
    const viewTop = document.body.scrollTop || document.documentElement.scrollTop;

    if (viewTop > y + this.delta) {
      this.bubble();
    } else {
      this.unbubble();
    }

    this.maybeInvert(viewTop + this.delta + (this.node.offsetHeight / 2));
  },

  watch() {
    window.addEventListener('scroll', this.eventHandler);
    window.addEventListener('resize', this.eventHandler);
  },

  bubble() {
    if (!this.bubbling) {
      this.bubbling = true;
      this.node.classList.add('is-bubbling');
    }
  },

  unbubble() {
    if (this.bubbling) {
      this.bubbling = false;
      this.node.classList.remove('is-bubbling');
    }
  },

  maybeInvert(y) {
    if (!this.invertAnchors.length) return;

    let invert = false;

    for (let el of this.invertAnchors) {
      const y0 = nodeY(el)
      const y1 = y0 + el.offsetHeight
      if (y0 <= y && y1 > y) {
        invert = true;
        break;
      }
    }

    if (this.inverted === invert) return;

    this.inverted = invert;
    if (this.inverted) {
      this.node.classList.add('is-inverted')
    } else {
      this.node.classList.remove('is-inverted')
    }
  }
});
