type StatusEvent = {
  type: 'status';
  event: 'online' | 'offline';
  from: 'any' | 'action';
  delay: number;
};

type MessageEvent = {
  type: 'message';
  from: 'any' | 'action';
  text: string;
  delay: number;
};

type Event = StatusEvent | MessageEvent;

type TDemoControllerOptions = {
  element: HTMLElement;
  roomId: string | undefined;
  scenario: Event[];
};

class Chat {
  private readonly _el: HTMLElement;
  private readonly _header: HTMLElement;
  private readonly _messages: HTMLElement;
  private readonly _form: HTMLElement;
  private readonly _statusLink: HTMLElement;
  private readonly _input: HTMLInputElement;
  private _isOnline: boolean = true;
  private _hasHistory: boolean = false;
  private _history: string[] = [];

  constructor(el: HTMLElement, history: boolean = false) {
    this._el = el;
    this._hasHistory = history;
    this._header = el.querySelector('.demo__chat__header')!;
    this._messages = el.querySelector('.demo__chat__messages')!;
    this._form = el.querySelector('.demo__chat__form')!;
    this._input = el.querySelector('.demo__chat__input')!;
    this._statusLink = el.querySelector('.demo__chat__status')!;

    // Disable event handlers while demo is just an emulation
    this._statusLink.addEventListener('click', e => e.preventDefault());
    this._input.style['pointerEvents'] = 'none';
    this._form.addEventListener('submit', e => e.preventDefault());
  }

  get online(): boolean {
    return this._isOnline;
  }

  addMessage(text: string, mine: boolean) {
    if (!mine && !this._isOnline) {
      if (this._hasHistory) {
        this._history.push(text);
      }
      return;
    }

    let message = document.createElement('div');
    message.classList.add('demo__chat__message');
    message.textContent = text;
    if (!mine) {
      message.classList.add('demo__chat__message_theirs');
    }

    this._messages.insertBefore(message, this._form);
  }

  addStatusMessage(text: string) {
    let message = document.createElement('div');
    message.classList.add('demo__chat__status_message');
    message.textContent = text;

    this._messages.insertBefore(message, this._form);
  }

  markOnline() {
    this._header.classList.remove('demo__chat__header_offline');
    this._header.classList.add('demo__chat__header_online');
    this._statusLink.textContent = 'online';
    this._isOnline = true;
    this.addStatusMessage('Connection restored');

    if (this._hasHistory) {
      while (this._history.length > 0) {
        this.addMessage(this._history.shift()!, false);
      }
    }
  }

  markOffline() {
    this._header.classList.remove('demo__chat__header_online');
    this._header.classList.add('demo__chat__header_offline');
    this._statusLink.textContent = 'offline';
    this._isOnline = false;
    this.addStatusMessage('No connection');
  }

  reset() {
    // remove all children with .demo__chat__message class from this._messages
    this._messages.querySelectorAll('.demo__chat__message').forEach(el => {
      el.remove();
    });
    this._messages
      .querySelectorAll('.demo__chat__status_message')
      .forEach(el => {
        el.remove();
      });
  }
}

export default class DemoController {
  private readonly _el: HTMLElement;
  private readonly _roomId: string;
  private readonly _anyChat: Chat;
  private readonly _actionChat: Chat;
  private readonly _scenario: Event[];
  private _currentScenario: Event[];

  constructor(options: TDemoControllerOptions) {
    this._roomId = options.roomId || Date.now().toString();
    this._el = options.element;
    this._anyChat = new Chat(
      this._el.querySelector('[data-demo-target="any"]')!,
      true
    );
    this._actionChat = new Chat(
      this._el.querySelector('[data-demo-target="action"]')!
    );

    this._scenario = options.scenario;
  }

  init(): void {
    this.playScenario();
  }

  private cleanup(): void {
    this._anyChat.reset();
    this._actionChat.reset();
  }

  private playScenario(): void {
    this._currentScenario = this._scenario.slice();
    this.scheduleNextEvent();
  }

  private scheduleNextEvent(): void {
    if (this._currentScenario.length === 0) {
      setTimeout(() => {
        this.cleanup();
        this.playScenario();
      }, 3000);
      return;
    }

    let event = this._currentScenario.shift()!;

    setTimeout(() => {
      this.playEvent(event);
    }, event.delay);
  }

  private playEvent(event: Event): void {
    switch (event.type) {
      case 'status':
        let target = event.from === 'any' ? this._anyChat : this._actionChat;
        if (event.event === 'online') {
          target.markOnline();
        } else {
          target.markOffline();
        }
        break;
      case 'message':
        let [author, recipient] =
          event.from === 'any'
            ? [this._anyChat, this._actionChat]
            : [this._actionChat, this._anyChat];

        author.addMessage(event.text, true);
        recipient.addMessage(event.text, false);

        break;
    }

    this.scheduleNextEvent();
  }
}
