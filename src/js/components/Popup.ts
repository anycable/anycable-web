export default class Popup {
  private _popup: HTMLDivElement;

  constructor(popupSelector: string) {
    this._popup = document.querySelector(popupSelector) as HTMLDivElement;
    this._handleClickClose = this._handleClickClose.bind(this);
    this._handleEscClose = this._handleEscClose.bind(this);
  }

  init() {
    setTimeout(() => {
      this._popup.style.display = 'inherit'; //prevents flickering while loading
    }, 0);
  }

  open() {
    const popupContainer = this._popup.querySelector(
      '.popup__container'
    ) as HTMLDivElement;
    popupContainer.classList.add('popup__container_opened');
    this._popup.classList.add('popup_opened');
    this._setEventListeners();
    this._toggleScrollHolder();
  }

  close() {
    const popupContainer = this._popup.querySelector(
      '.popup__container'
    ) as HTMLDivElement;
    popupContainer.classList.remove('popup__container_opened');
    this._popup.classList.remove('popup_opened');
    this._removeEventListeners();
    this._toggleScrollHolder();
  }

  _handleClickClose(evt: MouseEvent) {
    if (evt.target) {
      const target = evt.target as Element;
      if (
        target.classList.contains('popup') ||
        target.classList.contains('popup__close-btn')
      ) {
        this.close();
      }
    }
  }

  _handleEscClose(evt: KeyboardEvent) {
    if (evt.key === 'Escape') {
      this.close();
    }
  }

  _setEventListeners() {
    this._popup.addEventListener('click', this._handleClickClose);
    document.addEventListener('keydown', this._handleEscClose);
  }

  _removeEventListeners() {
    this._popup.removeEventListener('click', this._handleClickClose);
    document.removeEventListener('keydown', this._handleEscClose);
  }

  _toggleScrollHolder() {
    document.body.style.overflow === 'hidden'
      ? (document.body.style.overflow = 'visible')
      : (document.body.style.overflow = 'hidden');
  }
}
