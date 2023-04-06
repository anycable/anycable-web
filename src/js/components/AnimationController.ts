type TScrollStylesClassNames = {
  downScrollClassName: string;
  upScrollClassName: string;
};

interface IAnimationController {
  triggerClassName: string;
  frameClassName: string;
  visibilityClassName: string;
  scrollOffsets?: number[];
  showFirstFrame?: boolean;
  scrollStylesClassNames: TScrollStylesClassNames;
}

export default class AnimationController {
  private _triggers: Element[];
  private _frames: Element[];
  private _visibilityClassName: string;
  private _currIdx: number = 0;
  private _scrollOffsets: number[] = [];
  private _showFirstFrame: boolean = false;
  private _lastScrollTop: number = 0;
  private _scrollDirection: 'up' | 'down' = 'down';
  private _scrollStylesClassNames: TScrollStylesClassNames;

  constructor(options: IAnimationController) {
    this._triggers = Array.from(
      document.querySelectorAll(`.${options.triggerClassName}`)
    );
    this._frames = Array.from(
      document.querySelectorAll(`.${options.frameClassName}`)
    );
    this._visibilityClassName = options.visibilityClassName;
    this._scrollOffsets = options.scrollOffsets || this._scrollOffsets;
    this._showFirstFrame = options.showFirstFrame || this._showFirstFrame;
    this._scrollStylesClassNames = options.scrollStylesClassNames;
  }

  private _setScrollDirection() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > this._lastScrollTop) {
      // downscroll code
      this._scrollDirection = 'down';
    } else if (scrollTop < this._lastScrollTop) {
      // upscroll code
      this._scrollDirection = 'up';
    }
    this._lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  private _getTriggersStates() {
    return new Promise(resolve => {
      setTimeout(() => {
        const triggersState = this._triggers.map((trigger, idx) => {
          const scrollOffset =
            this._scrollOffsets[idx] ||
            this._scrollOffsets[this._scrollOffsets.length - 1] ||
            0;
          return (
            trigger.getBoundingClientRect().top -
              window.screen.height / 2 +
              scrollOffset <
            0
          );
        });
        resolve(triggersState);
      }, 300);
    });
  }

  private _getInitFrameIdx(triggersState: boolean[]) {
    const pureIdx = triggersState.findIndex(el => el === false);
    return pureIdx !== -1
      ? pureIdx - 1 > 0
        ? pureIdx - 1
        : 0
      : this._triggers.length - 1;
  }

  private _toggleInitStyles() {
    if (this._scrollDirection === 'down') {
      this._frames.forEach(frame => {
        frame.classList.add(this._scrollStylesClassNames.downScrollClassName);
        frame.classList.remove(this._scrollStylesClassNames.upScrollClassName);
      });
    } else {
      this._frames.forEach(frame => {
        frame.classList.remove(
          this._scrollStylesClassNames.downScrollClassName
        );
        frame.classList.add(this._scrollStylesClassNames.upScrollClassName);
      });
    }
  }

  public init() {
    this._getTriggersStates()
      .then(triggersState => {
        if (!Array.isArray(triggersState)) {
          return;
        }
        const initFrameIdx = this._getInitFrameIdx(triggersState);
        this._currIdx = initFrameIdx;
        this._showFirstFrame &&
          this._frames[initFrameIdx].classList.add(this._visibilityClassName);
      })
      .then(() => {
        window.addEventListener('scroll', () => {
          this._toggleInitStyles();
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
          } else {
            if (this._currIdx === 0) {
              return;
            }
            this._currIdx > 0 && this._currIdx--;
            curFrame.classList.remove(this._visibilityClassName);
            prevFrame && prevFrame.classList.add(this._visibilityClassName);
          }
        });
      });
  }
}
