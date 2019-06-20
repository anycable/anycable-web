import application from '../app';
import triggerGTMEvent from '../utils/gtm';

application.component('.gtm-link', {
  init() {
    const gtmEvent = {
      event: 'link-click',
      eventCategory: this.node.dataset.gtmCategory,
      eventAction: this.node.dataset.gtmAction
    };

    this.node.addEventListener('click', (e) => {
      if (e.currentTarget != this.node) return;

      triggerGTMEvent(gtmEvent);
    });
  }
});
