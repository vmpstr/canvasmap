import * as Nodes from "./nodes.mjs";

export class NodeDragControl {
  constructor(node, target) {
    this.node_ = node;
    this.target_ = target;
    this.target_.setAttribute("draggable", true);
    this.target_.addEventListener("dragstart", (e) => this.onDragStart_(e));
    this.target_.addEventListener("drag", (e) => this.onDrag_(e));
    this.target_.addEventListener("dragend", (e) => this.onDragEnd_(e));
  }

  onDragStart_(e) {
    const rect = this.node_.getBoundingClientRect();
    this.dragOffset_ = [rect.x - e.clientX, rect.y - e.clientY];

    e.stopPropagation();
    e.dataTransfer.setDragImage(new Image(), 0, 0);

    gUndoStack.startNodeDrag(this.node_);
  }

  onDrag_(e) {
    // Workaround.
    if (e.clientX == 0 && e.clientY == 0)
      return;

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
      [this.dragOffset_[0] + e.clientX,
       this.dragOffset_[1] + e.clientY];
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
