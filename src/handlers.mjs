import * as Nodes from "./nodes.mjs";
import * as Workarounds from "./workarounds.mjs";

export class NodeDragControl {
  constructor(node, target) {
    this.node_ = node;
    target.setAttribute("draggable", true);
    target.addEventListener("dragstart", (e) => this.onDragStart_(e));
    target.addEventListener("drag", (e) => this.onDrag_(e));
    target.addEventListener("dragend", (e) => this.onDragEnd_(e));
  }

  onDragStart_(e) {
    const rect = this.node_.getBoundingClientRect();
    this.dragOffset_ = [rect.x - e.clientX, rect.y - e.clientY];
    Workarounds.mouseTracker.dragPoint = [e.clientX, e.clientY];

    e.stopPropagation();
    e.dataTransfer.setDragImage(new Image(), 0, 0);

    gUndoStack.startNodeDrag(this.node_);
  }

  onDrag_(e) {
    // Workaround for FF.
    let clientPoint;
    if (e.clientX == 0 && e.clientY == 0) {
      clientPoint = Workarounds.mouseTracker.dragPoint;
    } else {
      clientPoint = [e.clientX, e.clientY];
    }

    let rect = this.node_.getBoundingClientRect();
    if (!this.dragTarget_) {
      if (e.shiftKey || e.ctrlKey) {
        this.dragTarget_ = this.node_.clone();
        this.node_.parent.adoptNode(
          this.dragTarget_,
          Nodes.childOrdinal(this.node_, this.node_.parent));
        this.dragTarget_.position = [rect.x, rect.y];

        gUndoStack.setNodeDragTarget(this.dragTarget_);
      } else {
        this.dragTarget_ = this.node_;
      }
    }
    e.stopPropagation();

    console.assert(this.dragTarget_);

    this.dragTarget_.classList.add('dragged');
    this.dragTarget_.style.left = 0;
    this.dragTarget_.style.top = 0;
    rect = this.dragTarget_.getBoundingClientRect();

    this.dragTarget_.position =
      [this.dragOffset_[0] + clientPoint[0],
       this.dragOffset_[1] + clientPoint[1]];
    this.dragTarget_.parent.onDraggedChild(this.dragTarget_);
  }

  onDragEnd_(e) {
    console.assert(this.dragTarget_);
    this.dragTarget_.classList.remove('dragged');
    e.stopPropagation();
    gUndoStack.endNodeDrag();
    this.dragTarget_ = null;
  }
}

export class DragHandleControl {
  constructor(node, target, handles) {
    this.node_ = node;
    this.target_ = target;
    this.dragHandleMode_ = '';
    for (let direction in handles) {
      console.assert(["ew", "ns", "nwse"].includes(direction));
      const handle = handles[direction];

      handle.setAttribute("draggable", true);
      handle.addEventListener("dragstart", (e) => this.onDragStart_(e, direction));
      handle.addEventListener("drag", (e) => this.onDrag_(e));
      handle.addEventListener("dragend", (e) => this.onDragEnd_(e));
    }
  }

  onDragStart_(e, mode) {
    gUndoStack.startSizeHandleDrag(this.node_);
    this.dragHandleMode_ = mode;
    const rect = this.target_.getBoundingClientRect();
    this.initialWidth_ = rect.width;
    this.initialHeight_ = rect.height;
    this.dragOffset_ = [-e.clientX, -e.clientY];
    Workarounds.mouseTracker.dragPoint = [e.clientX, e.clientY];
    e.stopPropagation();
  }
  onDrag_(e) {
    // Workaround for FF.
    let clientPoint;
    if (e.clientX == 0 && e.clientY == 0) {
      clientPoint = Workarounds.mouseTracker.dragPoint;
    } else {
      clientPoint = [e.clientX, e.clientY];
    }

    let new_width =
      this.initialWidth_ + (clientPoint[0] + this.dragOffset_[0]);
    let new_height =
      this.initialHeight_ + (clientPoint[1] + this.dragOffset_[1]);

    if (this.dragHandleMode_ == "ew" || this.dragHandleMode_ == "nwse") {
      this.target_.style.width = new_width + "px";
      // Reset if we're trying to expand past the max-width.
      if (this.target_.getBoundingClientRect().width + 10 < new_width)
        this.target_.style.width = "";
    }
    if (this.dragHandleMode_ == "ns" || this.dragHandleMode_ == "nwse") {
      this.target_.style.maxHeight = new_height + "px";
      // Reset if we're trying to expand past the max-height.
      if (this.target_.getBoundingClientRect().height + 10 < new_height)
        this.target_.style.maxHeight = "";
    }
    e.stopPropagation();
  }
  onDragEnd_(e) {
    e.stopPropagation();
    gUndoStack.endSizeHandleDrag();
  }
}

export class LabelEditor {
  constructor(node, label) {
    this.node_ = node;
    this.labelElement_ = label;
    this.labelElement_.addEventListener("dblclick", (e) => this.startLabelEdit(e));
    this.labelElement_.innerHTML = this.node_.label;
    this.labelElement_.title = this.node_.label;

    this.endLabelEdit_ = this.endLabelEdit_.bind(this);
  }

  set label(v) {
    this.labelElement_.innerHTML = v;
    this.labelElement_.title = v;
  }

  startLabelEdit(e) {
    gUndoStack.startLabelEdit(this.node_);

    const el = this.labelElement_;

    // This is somewhat optional, but if they only thing we have is
    // a zero-width space, then selection is empty but the cursor
    // doesn't blink... So instead, just clear it so we see the
    // cursor blinking.
    if (el.innerText == '\u200b')
      el.innerHTML = "";

    // First make this contentEditable,
    // so that the selection selects proper contents.
    el.contentEditable = true;
    // Prevent ellipsis editing.
    el.style.overflow = "visible";
    el.style.width = "min-content";

    // Create a new range for all of the contents.
    const range = document.createRange();
    range.selectNodeContents(el);

    // Replace the current selection.
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Add event listeners so we can stop editing.
    el.addEventListener("keydown", this.endLabelEdit_);
    el.addEventListener("focusout", this.endLabelEdit_);

    if (e)
      e.stopPropagation();
  }

  endLabelEdit_(e) {
    if (e.type === "keydown") {
      // Propagate tab, since we might do something like add a child.
      // TODO(vmpstr): Whitelist propagatable keys. Arrow keys? Esc?
      if (e.key !== "Tab")
        e.stopPropagation();
      if (e.key !== "Enter" && e.key !== "Tab")
        return;
    }
    e.target.removeEventListener("keydown", this.endLabelEdit_);
    e.target.removeEventListener("focusout", this.endLabelEdit_);
    e.target.contentEditable = false;
    // Restore ellipsis if necessary.
    e.target.style.overflow = "";
    e.target.style.width = "";

    e.target.innerText = e.target.innerText.trim();

    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    this.node_.label = e.target.innerText;
    e.preventDefault();

    gUndoStack.endLabelEdit();
  }
}