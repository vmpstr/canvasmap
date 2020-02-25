import * as Nodes from "./nodes.mjs";

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
    // TODO(vmpstr): Change this?
    window.gMouseTracker = [e.clientX, e.clientY];

    e.stopPropagation();
    e.dataTransfer.setDragImage(new Image(), 0, 0);

    gUndoStack.startNodeDrag(this.node_);
  }

  onDrag_(e) {
    // Workaround for FF.
    let clientPoint;
    if (e.clientX == 0 && e.clientY == 0) {
      clientPoint = [gMouseTracker[0], gMouseTracker[1]];
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
    window.gMouseTracker = [e.clientX, e.clientY];
    e.stopPropagation();
  }
  onDrag_(e) {
    // Workaround for FF.
    let clientPoint;
    if (e.clientX == 0 && e.clientY == 0) {
      clientPoint = [gMouseTracker[0], gMouseTracker[1]];
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
