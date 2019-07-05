import { RunLoop } from './run_loop.mjs';

export class SelectionControl {
  constructor(layout) {
    this.layout_ = layout;
    this.selection_candidate_ = null;
    this.selection_ = null;
  }

  cancel() {
    this.removeSelection();
    this.removeCandidate();
  }

  handleClick(p) {
    if (!this.selection_candidate_) {
      const item = this.layout_.getItemAtPoint(p);
      // This can happen if the selection was programmatically changed,
      // and then no mouse move happened, but a click did.
      if (!item || item == this.selection_) {
        if (!item)
          this.removeSelection();
        return;
      } else {
        this.selection_candidate_ = item;
      }
    }

    if (this.selection_)
      this.selection_.markSelection("none");
    this.selection_ = this.selection_candidate_;
    this.selection_candidate_ = null;
    this.selection_.markSelection("selected");
    RunLoop.postTaskAndDraw();
  }

  handleMouseMove(p) {
    const new_candidate = this.layout_.getItemAtPoint(p);
    if (!new_candidate) {
      this.removeCandidate();
      return;
    }
      
    if (new_candidate == this.selection_candidate_)
      return;

    this.removeCandidate();
    if (new_candidate == this.selection_)
      return;

    this.selection_candidate_ = new_candidate;
    this.selection_candidate_.markSelection("candidate");
    RunLoop.postTaskAndDraw();
  }

  removeCandidate() {
    if (this.selection_candidate_) {
      this.selection_candidate_.markSelection("none");
      this.selection_candidate_ = null;
      RunLoop.postTaskAndDraw();
    }
  }

  removeSelection() {
    if (this.selection_) {
      this.selection_.markSelection("none");
      this.selection_ = null;
      RunLoop.postTaskAndDraw();
    }
  }

  get selected() {
    return this.selection_;
  }

  set selected(v) {
    if (this.selection_candidate_ == v)
      this.removeCandidate();
    if (this.selection_ != v)
      this.removeSelection();
    this.selection_ = v;
    this.selection_.markSelection("selected");
    RunLoop.postTaskAndDraw();
  }

}
