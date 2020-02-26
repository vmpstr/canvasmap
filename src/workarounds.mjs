class MouseTracker {
  constructor() {
    this.dragPoint_ = [0, 0];
  }

  set dragPoint(v) {
    this.dragPoint_ = v;
  }
  get dragPoint() {
    return this.dragPoint_;
  }
};

export const mouseTracker = new MouseTracker();
