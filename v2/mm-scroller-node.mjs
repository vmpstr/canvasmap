import * as Nodes from "./nodes.mjs";
import * as Handlers from "./handlers.mjs";

const style = `
:host {
  display: block;
}
.container {
  display: flex;
  flex-direction: column;

  box-sizing: border-box;
  width: 100%;

  border: 1px solid black;
  border-radius: 10px;
  padding: 5px 0 5px 0;

  position: relative;
  overflow: hidden;
  max-width: max-content;
  min-width: 30px;
  min-height: 45px;
}
.container:hover {
  box-shadow: 0 0 2px 0;
}

.label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  /* workaround for ff? */
  width: calc(100% + 5px);
}
.child_area {
  margin-top: 5px;
  position: relative;
  contain: layout;
  overflow-y: auto;
  overflow-x: hidden;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 5px;

  min-height: 10px;

  background: rgba(0, 0, 0, 0.05);
}
.child_area.hidden > * {
  display: none;
}
::slotted(*) {
  position: relative;
  margin-top: 5px;
  width: max-content;
}
.label_holder {
  max-width: min-content;

  position: relative;
  padding: 0 10px 0 10px;
}
.parent_edge {
  position: absolute;
  bottom: 50%;
  right: 100%;
  width: 15px;
  height: 30%;
  border-bottom: 1px solid black;
  border-left: 1px solid black;
  border-radius: 0px 0px 0px 10px;
}
.child_toggle {
  position: absolute;
  left: calc(50% - 5px);
  top: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: powderblue;
  border: 1px solid black;
  z-index: 1;
}
.child_toggle:hover {
  cursor: pointer;
}
.child_toggle.collapsed:hover {
  background: springgreen;
}
.child_toggle.expanded:hover {
  background: indianred;
}
.nwse_drag_handle {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  opacity: 0.01;
}
.ew_drag_handle {
  position: absolute;
  top: 10px;
  right: -3px;
  width: 7px;
  height: calc(100% - 20px);
  cursor: ew-resize;
  opacity: 0.01;
}
.ew_drag_handle.hidden {
  display: none;
}
.ns_drag_handle {
  position: absolute;
  left: 10px;
  bottom: -3px;
  height: 7px;
  width: calc(100% - 20px);
  cursor: ns-resize;
  opacity: 0.01;
}

:host(.selected) .container {
  border-color: blue;
  box-shadow: 0 0 3px 0 blue;
}
:host(.dragged) {
  opacity: 40%;
}
.divider {
  width: 100%;
  border-top: 1px solid grey;
  margin-top: 5px;
  position: relative;

  /* fix flex making the height 0.99 -> 0 */
  box-sizing: border-box;
  min-height: 2px;
}`;

const body = `
<div class=parent_edge></div>
<div class=container>
  <div class=label_holder>
    <div class=label></div>
  </div>
  <div class=divider>
    <div class="child_toggle expanded"></div>
  </div>
  <div class=child_area>
    <slot></slot>
  </div>
</div>
<div class=ew_drag_handle></div>
<div class=ns_drag_handle></div>
<div class=nwse_drag_handle></div>`;

window.customElements.define("mm-scroller-node", class extends HTMLElement {
  constructor() {
    super();
    this.children_ = [];
    this.position_ = [0, 0];
    this.label_ = '';
    this.childrenHidden_ = false;
  }

  connectedCallback() {
    if (this.shadowRoot) {
      this.computeEdges_();
      return;
    }

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>${style}</style>
      <body>${body}</body>`;

    const container = this.shadowRoot.querySelector(".container");

    this.dragControl_ = new Handlers.NodeDragControl(this, container);
    this.dragHandleControl_ = new Handlers.DragHandleControl(
      this, container,
      {'ew': this.shadowRoot.querySelector(".ew_drag_handle"),
       'ns': this.shadowRoot.querySelector(".ns_drag_handle"),
       'nwse': this.shadowRoot.querySelector(".nwse_drag_handle")});

    const label = this.shadowRoot.querySelector(".label");
    const child_area = this.shadowRoot.querySelector(".child_area");
    container.addEventListener("click", (e) => {
      if (e.target == container || e.target == label || e.target == child_area)
        this.select();
    });

    label.innerHTML = this.label;
    label.setAttribute("title", this.label);
    label.addEventListener("dblclick", (e) => {
      this.startLabelEdit();
      e.stopPropagation();
    });

    if (this.fromData_) {
      container.style.width = this.fromData_.container_width;
      container.style.maxHeight = this.fromData_.container_maxheight;
    }

    this.childResizeObserver_ = new ResizeObserver((e) => this.onChildSizeChanged_(e));

    const slot = shadow.querySelector("slot");
    slot.addEventListener("slotchange", (e) => this.onSlotChange_(e));

    const child_toggle = this.shadowRoot.querySelector(".child_toggle");
    child_toggle.addEventListener("click", (e) => {
      this.onChildToggle_(e);
    });
    child_toggle.addEventListener("dblclick", (e) => {
      e.stopPropagation();
    });

    if (this.childrenHidden_) {
      this.shadowRoot.querySelector(".child_area").classList.add("hidden");
      this.map_.didHideChildren(this);
    } else {
      this.shadowRoot.querySelector(".child_area").classList.remove("hidden");
    }
    this.computeEdges_();

  }

  set map(v) {
    this.map_ = v;
  }
  get map() {
    return this.map_;
  }

  setParent(parent) {
    this.parent_ = parent;
    this.computeStyleFromPosition_();
    this.computeEdges_();
  }

  onSlotChange_() {
    for (let i = 0; i < this.children_.length; ++i) {
      this.childResizeObserver_.unobserve(this.children_[i]);
    }
    this.repopulateChildren_();
    for (let i = 0; i < this.children_.length; ++i) {
      this.childResizeObserver_.observe(this.children_[i]);
    }
    this.computeEdges_();
  }

  onChildSizeChanged_() {
    this.computeEdges_();
  }

  onChildToggle_(e) {
    this.childrenHidden_ = !this.childrenHidden_;
    if (!this.shadowRoot)
      return;

    if (this.childrenHidden_) {
      this.shadowRoot.querySelector(".child_area").classList.add("hidden");
      this.map_.didHideChildren(this);
    } else {
      this.shadowRoot.querySelector(".child_area").classList.remove("hidden");
    }
    this.computeEdges_();

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  unhideChildren() {
    if (this.childrenHidden_)
      this.onChildToggle_();
    return this.children_.length > 0;
  }

  get firstChild() {
    if (this.children_.length)
      return this.children_[0];
    return null;
  }

  nextChild(child) {
    for (let i = 0; i < this.children_.length - 1; ++i) {
      if (this.children_[i] == child)
        return this.children_[i + 1];
    }
    return null;
  }

  prevChild(child) {
    for (let i = 1; i < this.children_.length; ++i) {
      if (this.children_[i] == child)
        return this.children_[i - 1];
    }
    return null;
  }

  computeEdges_() {
    if (!this.shadowRoot || !this.parent_)
      return;
    if (this.parent_.has_child_edges) {
      this.shadowRoot.querySelector(".parent_edge").style.display = "";
    } else {
      this.shadowRoot.querySelector(".parent_edge").style.display = "none";
    }

    const toggle = this.shadowRoot.querySelector(".child_toggle");
    if (this.children_.length)
      toggle.style.display = "";
    else
      toggle.style.display = "none";

    toggle.classList.remove("expanded");
    toggle.classList.remove("collapsed");
    if (this.childrenHidden_)
      toggle.classList.add("collapsed");
    else
      toggle.classList.add("expanded");
  }

  get parent_edge_offset() {
    if (!this.shadowRoot)
      return 0;
    return this.shadowRoot.querySelector(".parent_edge").getBoundingClientRect().top -
           this.shadowRoot.querySelector(".container").getBoundingClientRect().top;
  }

  get children_hidden() {
    return this.childrenHidden_;
  }

  get parent() {
    return this.parent_;
  }

  set position(v) {
    console.assert(v);
    this.position_ = v;
    this.computeStyleFromPosition_();
  }

  get position() {
    return this.position_;
  }

  get label() {
    return this.label_;
  }
  set label(v) {
    this.label_ = v;

    // Might be setting label before connecting.
    if (!this.shadowRoot)
      return;

    const label = this.shadowRoot.querySelector(".label");
    label.innerHTML = v;
    label.title = v;
  }

  resetPosition() {
    this.style.left = '0';
    this.style.top = '0';
    const rect = this.getBoundingClientRect();
    this.position = [rect.x, rect.y];
  }

  computeStyleFromPosition_() {
    console.assert(getComputedStyle(this).getPropertyValue("position") != "static");
    this.style.left = '0';
    this.style.top = '0';
    const rect = this.getBoundingClientRect();
    this.style.left = (this.position_[0] - rect.x) + "px";
    this.style.top = (this.position_[1] - rect.y) + "px";
  }

  endLabelEdit_(e) {
    if (e.type === "keydown") {
      // Propagate tab, since we might do something like add a child.
      // TODO(vmpstr): Whitelist propagatable keys. Arrow keys?
      if (e.key !== "Tab")
        e.stopPropagation();
      if (e.key !== "Enter")
        return;
    }
    e.target.removeEventListener("keydown", this.endLabelEditHandle_);
    e.target.removeEventListener("focusout", this.endLabelEditHandle_);
    e.target.contentEditable = false;
    this.shadowRoot.querySelector('.ew_drag_handle').classList.remove('hidden');
    // Restore ellipsis if necessary.
    e.target.style.overflow = "";
    e.target.style.width = "";

    e.target.innerText = e.target.innerText.trim();
    this.label_ = e.target.innerText;

    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&x_200b;'

    this.label = e.target.innerText;
    e.preventDefault();

    gUndoStack.endLabelEdit();
  };

  startLabelEdit() {
    gUndoStack.startLabelEdit(this);

    const el = this.shadowRoot.querySelector(".label");

    // This is somewhat optional, but if they only thing we have is
    // a zero-width space, then selection is empty but the cursor
    // doesn't blink... So instead, just clear it so we see the
    // cursor blinking.
    if (el.innerText == '\u200b')
      el.innerHTML = "";

    // First make this contentEditable,
    // so that the selection selects proper contents.
    el.contentEditable = true;
    this.shadowRoot.querySelector('.ew_drag_handle').classList.add('hidden');
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
    this.endLabelEditHandle_ = (e) => this.endLabelEdit_(e);
    el.addEventListener("keydown", this.endLabelEditHandle_);
    el.addEventListener("focusout", this.endLabelEditHandle_);
  }

  select() {
    this.map_.nodeSelected(this);
    this.classList.add('selected');
  }

  deselect() {
    this.map_.nodeDeselected(this);
    this.classList.remove('selected');
  }

  clone() {
    const clone = Nodes.createNode("scroller", this.map_);
    clone.label = this.label;
    return clone;
  }

  onDraggedChild(child) {
    const rect = this.getBoundingClientRect();
    const child_rect = child.getBoundingClientRect();
    const padding_slack = 15;
    if (child_rect.left > rect.right ||
        child_rect.right < rect.left ||
        (child_rect.top - padding_slack) > rect.bottom ||
        child_rect.bottom < rect.top ||
        // If our parent isn't our map (ie we're a child of something
        // then if the x is to our x's left, reparent up.
        // TODO(vmpstr): this might not be true for other non-tree maps.
        (this.parent_ != this.map_ && child_rect.x < rect.x)) {
      this.parent_.adoptNode(child);
    } else {
      let child_index = -1;
      let next_item = null;
      let next_distance = 1e6;
      let previous_item = null;
      let previous_distance = 1e6;
      for (let i = 0; i < this.children_.length; ++i) {
        const next_item_rect = this.children_[i].getBoundingClientRect();
        if (next_item_rect.y > child_rect.y) {
          const local_distance = next_item_rect.y - child_rect.y;
          if (local_distance < next_distance) {
            next_distance = local_distance;
            next_item = this.children_[i];
          }
        } else if (next_item_rect.y < child_rect.y && child_rect.x > next_item_rect.x + 25 /* TODO: margin?*/) {
          const local_distance = child_rect.y - next_item_rect.y;
          if (local_distance < previous_distance) {
            previous_distance = local_distance;
            previous_item = this.children_[i];
          }
        }
      }
      child.remove();
      if (previous_item) {
        previous_item.unhideChildren();
        previous_item.adoptNode(child);
      } else {
        // next_item may be null.
        this.insertBefore(child, next_item);
      }
      child.resetPosition();
    }
  }

  repopulateChildren_() {
    let nodes = this.shadowRoot.querySelector("slot").assignedNodes();
    this.children_ = [];
    for (let i = 0; i < nodes.length; ++i) {
      if (Nodes.isKnownTag(nodes[i].tagName))
        this.children_.push(nodes[i]);
    }
  }

  adoptNode(child, ordinal) {
    if (ordinal === undefined)
      ordinal = this.children.length;
    console.assert(ordinal <= this.children.length);

    // Need to know where to position the child.
    child.remove();
    child.setParent(this);
    this.insertBefore(child, this.children[ordinal]);
    child.resetPosition();
  }

  getSizingInfo() {
    const container = this.shadowRoot.querySelector(".container");
    return {
      width: container.style.width,
      maxHeight: container.style.maxHeight
    };
  }
  setSizingInfo(info) {
    const container = this.shadowRoot.querySelector(".container");
    container.style.width = info.width;
    container.style.maxHeight = info.maxHeight;
  }

  // Storage -------------------------------------
  loadFromData(data) {
    this.label = data.label || '<deprecated label>';
    this.position = data.position || [0, 0];
    if (this.shadowRoot) {
      const container = this.shadowRoot.querySelector(".container");
      container.style.width = data.container_width;
      container.style.maxHeight = data.container_maxheight;
    } else {
      if (!this.fromData_)
        this.fromData_ = {};
      this.fromData_['container_width'] = data.container_width;
      this.fromData_['container_maxheight'] = data.container_maxheight;
    }

    // TODO(vmpstr): backcompat.
    if (!data.nodes)
      return;
    for (let i = 0; i < data.nodes.length; ++i) {
      // The order here is important since adoptNode resets the position
      // information.
      const node = Nodes.createNode(data.nodes[i].type, this.map_);
      node.loadFromData(data.nodes[i]);
      this.adoptNode(node);
    }
    if (data.children_hidden)
      this.onChildToggle_();
  }

  serializeToData() {
    let data = {
      label: this.label,
      type: 'scroller',
      position: this.position,
      children_hidden: this.childrenHidden_,
      nodes: []
    };
    const container = this.shadowRoot.querySelector(".container");
    if (container && container.style.width)
      data['container_width'] = container.style.width;
    if (container && container.style.maxHeight)
      data['container_maxheight'] = container.style.maxHeight;

    for (let i = 0; i < this.children_.length; ++i)
      data.nodes.push(this.children_[i].serializeToData());
    return data;
  }
});
