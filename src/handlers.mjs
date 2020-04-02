let App;
let Nodes;
let Workarounds;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Nodes = await import(`./nodes.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Workarounds = await import(`./workarounds.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
}

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

    App.undoStack.startNodeDrag(this.node_);
  }

  onDrag_(e) {
    // Workaround for FF.
    let clientPoint;
    if (e.clientX == 0 && e.clientY == 0) {
      clientPoint = Workarounds.mouseTracker.dragPoint;
    } else {
      clientPoint = [e.clientX, e.clientY];
    }

    cancelAnimationFrame(this.dragRafId_);
    this.dragRafId_ = requestAnimationFrame(() => {
      if (!this.dragTarget_) {
        if (e.shiftKey || e.ctrlKey) {
          this.dragTarget_ = this.node_.clone();
          this.node_.parent.adoptNode(
            this.dragTarget_,
            Nodes.childOrdinal(this.node_, this.node_.parent));
          let rect = this.node_.getBoundingClientRect();
          this.dragTarget_.position = [rect.x, rect.y];

          App.undoStack.setNodeDragTarget(this.dragTarget_);
        } else {
          this.dragTarget_ = this.node_;
        }
      }
      console.assert(this.dragTarget_);

      this.dragTarget_.classList.add('dragged');
      this.dragTarget_.position =
        [this.dragOffset_[0] + clientPoint[0],
         this.dragOffset_[1] + clientPoint[1]];
      this.dragTarget_.parent.onDraggedChild(this.dragTarget_);
    });

    e.stopPropagation();
  }

  onDragEnd_(e) {
    console.assert(this.dragTarget_);
    cancelAnimationFrame(this.dragRafId_);
    this.dragTarget_.classList.remove('dragged');
    e.stopPropagation();
    App.undoStack.endNodeDrag();
    this.dragTarget_ = null;
  }
}

export class DragHandleControl {
  constructor(node, target, handles) {
    this.node_ = node;
    this.target_ = target;
    this.dragHandleMode_ = '';
    this.resetCheckId_ = -1;
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
    App.undoStack.startSizeHandleDrag(this.node_);
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
    Workarounds.mouseTracker.dragPoint = [clientPoint[0], clientPoint[1]];

    let new_width =
      Math.floor(this.initialWidth_ + (clientPoint[0] + this.dragOffset_[0]));
    let new_height =
      Math.floor(this.initialHeight_ + (clientPoint[1] + this.dragOffset_[1]));

    if (this.dragHandleMode_ == "ew" || this.dragHandleMode_ == "nwse")
      this.target_.style.width = `${new_width}px`;
    if (this.dragHandleMode_ == "ns" || this.dragHandleMode_ == "nwse")
      this.target_.style.maxHeight = `${new_height}px`;

    // Schedule a rAF to check if we need to reset the values. Since we can
    // receive a lot of drags per frame, we defer the forced layouts to rAF.
    if (this.resetCheckId_ >= 0)
      cancelAnimationFrame(this.resetCheckId_);
    this.resetCheckId_ = requestAnimationFrame(() => {
      const rect = this.target_.getBoundingClientRect();
      if (this.dragHandleMode_ == "ew" || this.dragHandleMode_ == "nwse") {
        // Reset if we're trying to expand past the max-width.
        if (Math.ceil(rect.width) < new_width)
          this.target_.style.width = "";
      }
      if (this.dragHandleMode_ == "ns" || this.dragHandleMode_ == "nwse") {
        // Reset if we're trying to expand past the max-height.
        if (Math.ceil(rect.height) < new_height)
          this.target_.style.maxHeight = "";
      }
    });
    e.stopPropagation();
  }
  onDragEnd_(e) {
    e.stopPropagation();
    App.undoStack.endSizeHandleDrag();
  }
}

export class LabelEditor {
  constructor(node, label) {
    this.node_ = node;
    this.labelElement_ = label;
    this.labelElement_.addEventListener("dblclick", (e) => this.startLabelEdit(e));
    this.labelElement_.innerText = this.node_.label;
    this.labelElement_.title = this.node_.label;
    this.editing_ = false;

    this.endLabelEdit_ = this.endLabelEdit_.bind(this);
  }

  set label(v) {
    this.labelElement_.innerText = v;
    this.labelElement_.title = v;
  }

  startLabelEdit(e) {
    // If we're already editing, we must've double clicked to select a word.
    // Capture the event and do nothing.
    if (this.editing_) {
      console.assert(e);
      e.stopPropagation();
      return;
    }

    App.undoStack.startLabelEdit(this.node_);

    const el = this.labelElement_;

    // This is somewhat optional, but if they only thing we have is
    // a zero-width space, then selection is empty but the cursor
    // doesn't blink... So instead, just clear it so we see the
    // cursor blinking.
    if (el.innerText == '\u200b')
      el.innerText = "";

    // First make this contentEditable,
    // so that the selection selects proper contents.
    el.contentEditable = true;
    // Prevent ellipsis editing.
    el.style.overflow = "visible";
    el.style.width = "min-content";
    this.editing_ = true;

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
    this.editing_ = false;

    e.target.innerText = e.target.innerText.trim();

    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    this.node_.label = e.target.innerText;
    e.preventDefault();

    App.undoStack.endLabelEdit();
  }
}
