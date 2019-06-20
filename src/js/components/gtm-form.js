import application from '../app';
import triggerGTMEvent from '../utils/gtm';

application.component('.gtm-form', {
  init() {
    const gtmEvent = {
      event: 'form-submission',
      eventCategory: this.node.dataset.gtmCategory,
      eventAction: this.node.dataset.gtmAction
    };

    this.node.addEventListener('submit', (e) => {
      if (e.currentTarget != this.node) return;

      triggerGTMEvent(gtmEvent);
    });
  }
});
