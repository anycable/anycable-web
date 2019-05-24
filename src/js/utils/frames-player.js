export class FramesPlayer {
  constructor(node, frames) {
    this.node = node;
    this.frames = frames.split(",");
    this.indexes = this.frames.map(function(frame){
      return frame.match(/frame\-(\d+)/)[1] | 0;
    });
  }

  get firstIndex() {
    return this.indexes[0];
  }

  get lastIndex() {
    return this.indexes[this.indexes.length - 1];
  }

  stop() {
    if (this.delayedFrameId) {
      clearTimeout(this.delayedFrameId);
      delete this.delayedFrameId;
    }

    if (this.currentIndex != void 0) {
      this.node.classList.remove(this.frames[this.currentIndex]);
      delete this.currentIndex;
    }
  }

  play() {
    this.goToFrame(0, 1);
  }

  goToFrame(index, nextIndex) {
    this.stop();

    this.currentIndex = index;
    this.node.classList.add(this.frames[this.currentIndex]);

    if (nextIndex >= 0 && nextIndex < this.frames.length) {
      this.delayedFrameId = setTimeout(() => {
        this.goToFrame(nextIndex, nextIndex + 1);
      },
      1000);
    }
  }
}
