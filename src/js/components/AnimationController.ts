type TScrollStylesClassNames = {
  down: string;
  up: string;
};

type TAnimationControllerOptions = {
  triggerClassName: string;
  frameClassName: string;
  visibilityClassName: string;
  scrollStylesClassNames: TScrollStylesClassNames;
  scrollOffsets?: number[];
  showFirstFrame?: boolean;
};

export default class AnimationController {
  private readonly _triggers: HTMLElement[];
  private readonly _frames: HTMLElement[];
  private readonly _visibilityClassName: string;
  private readonly _scrollStylesClassNames: TScrollStylesClassNames;
  private readonly _scrollOffsets: number[] = [];
  private readonly _showFirstFrame: boolean = false;
  private _currIdx: number = 0;
  private _lastScrollTop: number = 0;
  private _scrollDirection: 'up' | 'down' = 'down';

  constructor(options: TAnimationControllerOptions) {
    this._triggers = Array.from(
      document.querySelectorAll(`.${options.triggerClassName}`)
    );
    this._frames = Array.from(
      document.querySelectorAll(`.${options.frameClassName}`)
    );
    this._visibilityClassName = options.visibilityClassName;
    this._scrollStylesClassNames = options.scrollStylesClassNames;
    this._scrollOffsets = options.scrollOffsets ?? this._scrollOffsets;
    this._showFirstFrame = options.showFirstFrame ?? this._showFirstFrame;
  }

  private _setScrollDirection() {
    const scrollTop = document.documentElement.scrollTop;
    if (scrollTop > this._lastScrollTop) {
      this._scrollDirection = 'down';
    } else if (scrollTop < this._lastScrollTop) {
      this._scrollDirection = 'up';
    }
    this._lastScrollTop = scrollTop < 0 ? 0 : scrollTop;
  }

  private async _getTriggerStates(): Promise<boolean[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this._triggers.map((trigger, idx) => {
      const scrollOffset =
        this._scrollOffsets[idx] ??
        this._scrollOffsets[this._scrollOffsets.length - 1] ??
        0;
      return (
        trigger.getBoundingClientRect().top -
          window.screen.height / 2 +
          scrollOffset <
        0
      );
    });
  }

  private _getInitialFrameIndex(triggerStates: boolean[]) {
    const pureIndex = triggerStates.findIndex(el => !el);
    return pureIndex !== -1
      ? pureIndex - 1 > 0
        ? pureIndex - 1
        : 0
      : this._triggers.length - 1;
  }

  private _toggleInitialStyles() {
    this._frames.forEach(frame => {
      frame.classList.toggle(
        this._scrollStylesClassNames.down,
        this._scrollDirection === 'down'
      );
      frame.classList.toggle(
        this._scrollStylesClassNames.up,
        this._scrollDirection === 'up'
      );
    });
  }

  public init(): void {
    if (!this._frames.length) return;

    this._getTriggerStates()
      .then(triggerStates => {
        if (!Array.isArray(triggerStates)) {
          return;
        }
        this._currIdx = this._getInitialFrameIndex(triggerStates);
        if (this._showFirstFrame) {
          const initialFrame = this._frames[this._currIdx];
          initialFrame.classList.add(this._visibilityClassName);
        }
      })
      .then(() => {
        window.addEventListener('scroll', () => {
          this._toggleInitialStyles();
          const curFrame = this._frames[this._currIdx];
          const prevFrame = this._frames[this._currIdx - 1];
          const trigger =
            this._triggers[this._currIdx].getBoundingClientRect().top -
            window.screen.height / 2;
          const scrollOffset =
            this._scrollOffsets[this._currIdx] ||
            this._scrollOffsets[this._scrollOffsets.length - 1] ||
            0;
          this._setScrollDirection();
          if (trigger + scrollOffset < 0) {
            this._currIdx < this._triggers.length - 1 && this._currIdx++;
            curFrame.classList.add(this._visibilityClassName);
            prevFrame && prevFrame.classList.remove(this._visibilityClassName);
          } else if (this._currIdx > 0) {
            this._currIdx--;
            curFrame.classList.remove(this._visibilityClassName);
            prevFrame && prevFrame.classList.add(this._visibilityClassName);
          }
        });
      });
  }
}
