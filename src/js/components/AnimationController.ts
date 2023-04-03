interface IAnimationController {
  triggerClass: string;
  frameClass: string;
  visibilityClass: string;
  scrollOffsets?: number[];
  showFirstFrame?: boolean;
}

export default class AnimationController {
  private _triggers: Element[];
  private _frames: Element[];
  private _visibilityClass: string;
  private _currIdx: number = 0;
  private _scrollOffsets: number[] = [];
  private _showFirstFrame: boolean = false;

  constructor(options: IAnimationController) {
    this._triggers = Array.from(
      document.querySelectorAll(`.${options.triggerClass}`)
    );
    this._frames = Array.from(
      document.querySelectorAll(`.${options.frameClass}`)
    );
    this._visibilityClass = options.visibilityClass;
    this._scrollOffsets = options.scrollOffsets || this._scrollOffsets;
    this._showFirstFrame = options.showFirstFrame || this._showFirstFrame;
  }

  init() {
    this._showFirstFrame &&
      this._frames[0].classList.add(this._visibilityClass);

    window.addEventListener('scroll', () => {
      const curFrame = this._frames[this._currIdx];
      const prevFrame = this._frames[this._currIdx - 1];
      const trigger =
        this._triggers[this._currIdx].getBoundingClientRect().top -
        window.screen.height / 2;
      const scrollOffset =
        this._scrollOffsets[this._currIdx] ||
        this._scrollOffsets[this._scrollOffsets.length - 1] ||
        0;

      if (trigger + scrollOffset < 0) {
        this._currIdx < this._triggers.length - 1 && this._currIdx++;
        curFrame.classList.add(this._visibilityClass);
        prevFrame && prevFrame.classList.remove(this._visibilityClass);
      } else {
        if (this._currIdx === 0) {
          return;
        }
        this._currIdx > 0 && this._currIdx--;
        curFrame.classList.remove(this._visibilityClass);
        prevFrame && prevFrame.classList.add(this._visibilityClass);
      }
    });
  }
}
