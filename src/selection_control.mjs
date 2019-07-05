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

  selectParent() {
    if (!this.selection_ || !this.selection_.parent)
      return;
    this.selected = this.selection_.parent;
  }

  selectChild() {
    if (!this.selection_ || !this.selection_.children.length)
      return;
    this.selected = this.selection_.children[0];
  }

  selectPreviousSibling() {
    if (!this.selection_ || !this.selection_.parent)
      return;
    const length = this.selection_.parent.children.length;
    for (let i = 0; i < length; ++i) {
      if (this.selection_.parent.children[i].id == this.selection_.id) {
        if (i == 0)
          this.selectParent();
        else
          this.selected = this.selection_.parent.children[i - 1];
        return;
      }
    }
  }

  selectNextSibling() {
    if (!this.selection_)
      return;
    if (!this.selection_.parent) {
      this.selectChild();
      return;
    }
    const length = this.selection_.parent.children.length;
    // Iterating to length - 1, so that we can +1 unconditionally.
    for (let i = 0; i < length - 1; ++i) {
      if (this.selection_.parent.children[i].id == this.selection_.id) {
        this.selected = this.selection_.parent.children[i + 1];
        return;
      }
    }
    this.selectChild();
  }

}
