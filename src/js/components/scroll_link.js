import application from '../app';
import jump from 'jump.js';
import nodeY from '../utils/node-y';

const DELTA = 30;

application.component('.js-scroll-link', {
  init() {
    const h = this.node.clientHeight;

    window.addEventListener('scroll', (e) => {
      const y = nodeY(this.node);
  
      const upperBound = y + h + DELTA;
      const lowerBound = y + h - DELTA;
      
      const viewTop = document.body.scrollTop || document.documentElement.scrollTop
      const viewBottom = viewTop + window.innerHeight;
      
      if (viewBottom > upperBound || viewBottom < lowerBound) {
        this.hide();
      } else {
        this.show();
      }
    });

    const targetId = this.node.dataset['target'];

    this.node.addEventListener('click', () => {
      const target = document.querySelector(targetId);
      jump(target);
    });
  },

  hide() {
    this.node.classList.add('is-hidden');
  },

  show() {
    this.node.classList.remove('is-hidden');
  }
});
