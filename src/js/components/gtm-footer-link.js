import application from '../app';
import triggerGTMEvent from '../utils/gtm';

application.component('.gtm-footer-link', {
  init() {
    const gtmEvent = {
      event: 'link-click',
      eventCategory: 'footerLinks',
      eventAction: this.node.dataset.gtmAction || this.node.textContent.replace(/\s+/, '-').toLowerCase().trim()
    };

    this.node.addEventListener('click', (e) => {
      if (e.currentTarget != this.node) return;

      triggerGTMEvent(gtmEvent);
    });
  }
});
