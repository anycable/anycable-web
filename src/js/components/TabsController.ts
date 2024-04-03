export default class TabsController {
  private readonly el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  init() {
    const buttons = Array.from(
      this.el.querySelectorAll('button[data-tabs-target]')
    );

    buttons.forEach(button => {
      button.addEventListener('click', this._handleButtonClick);
    });
  }

  private _handleButtonClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const tabId = target.dataset.tabsTarget;

    if (!tabId) {
      return;
    }

    this._showTab(tabId);
  };

  private _showTab(tabId: string) {
    const tabs = Array.from(this.el.querySelectorAll('[data-tabs-id]'));
    const buttons = Array.from(
      this.el.querySelectorAll('button[data-tabs-target]')
    );

    tabs.forEach(tab => {
      const tabEl = tab as HTMLElement;
      if (tabEl.dataset.tabsId === tabId) {
        tabEl.style.display = 'block';
      } else {
        tabEl.style.display = 'none';
      }
    });

    buttons.forEach(button => {
      const buttonEl = button as HTMLElement;
      if (buttonEl.dataset.tabsTarget === tabId) {
        buttonEl.classList.add('active-tab');
      } else {
        buttonEl.classList.remove('active-tab');
      }
    });
  }
}
