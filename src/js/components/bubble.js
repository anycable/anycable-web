import application from '../app';
import nodeY from '../utils/node-y';

application.component('.js-bubble', {
  init() {
    this.delta = this.node.dataset['delta'] | 0;
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
  }
});
