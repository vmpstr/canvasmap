import * as Nodes from "./nodes.mjs";
import * as Handlers from "./handlers.mjs";

const style = `
:host {
  display: block;
}
.label {
  box-sizing: border-box;
  width: 100%;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  border: 1px solid black;
  border-radius: 10px;
  padding: 10px;
}
.label:hover {
  box-shadow: 0 0 2px 0;
}
.child_area {
  position: relative;
  contain: layout;
  margin-left: 30px;
}
.child_area.hidden {
  min-height: 10px;
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
  width: max-content;
  max-width: max-content;
  min-width: 20px;

  position: relative;
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
.child_edge {
  position: absolute;
  top: 100%;
  border-left: 1px solid black;
  width: 1px;
  left: 14px;
  height: 50px;
}
.child_toggle {
  position: absolute;
  top: 100%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  left: 9px;
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
.ew_drag_handle {
  position: absolute;
  top: 15%;
  right: -2px;
  width: 5px;
  height: 70%;
  opacity: 0.01;
  cursor: ew-resize;
}
:host(.selected) .label {
  border-color: blue;
  box-shadow: 0 0 3px 0 blue;
}
:host(.dragged) {
  opacity: 40%;
}`;

const body = `
<div class=label_holder>
  <div class=parent_edge></div>
  <div class=child_edge></div>
  <div class="child_toggle expanded"></div>
  <div class=label></div>
  <div class=ew_drag_handle></div>
</div>
<div class=child_area>
  <slot></slot>
</div>`;

window.customElements.define("mm-node", class extends HTMLElement {
  constructor() {
    super();
    this.children_ = []
    this.position_ = [0, 0]
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

    const label = this.shadowRoot.querySelector(".label");
    this.labelEditor_ = new Handlers.LabelEditor(this, label);

    label.addEventListener("click", (e) => {
      if (e.target == label)
        this.select();
    });

    const drag_handle = this.shadowRoot.querySelector(".ew_drag_handle");
    const label_holder = this.shadowRoot.querySelector(".label_holder");

    this.dragControl_ = new Handlers.NodeDragControl(this, label);
    this.dragHandleControl_ = new Handlers.DragHandleControl(
      this, label_holder, {'ew': drag_handle});

    if (this.fromData_) {
      label_holder.style.width = this.fromData_.label_width;
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

  // You probably want adoptNode().
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

    if (this.children_.length && !this.childrenHidden_) {
      this.shadowRoot.querySelector(".child_edge").style.display = "";
      const last_child = this.children_[this.children_.length - 1];
      let extent = last_child.getBoundingClientRect().top + last_child.parent_edge_offset - this.shadowRoot.querySelector(".label_holder").getBoundingClientRect().bottom;
      this.shadowRoot.querySelector(".child_edge").style.height = extent + "px";
    } else {
      this.shadowRoot.querySelector(".child_edge").style.display = "none";
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
           this.shadowRoot.querySelector(".label_holder").getBoundingClientRect().top;
  }

  get children_hidden() {
    return this.childrenHidden_;
  }

  get has_child_edges() {
    return true;
  }

  get parent() {
    return this.parent_;
  }

  // Position is in screen coordinates. 
  // TODO(vmpstr): it will become hard to reason about this, so we need better
  // spaces or explicit separation between fixed position and free nodes.
  get position() {
    return this.position_;
  }
  set position(v) {
    console.assert(v);
    this.position_ = v;
    this.computeStyleFromPosition_();
  }

  get label() {
    return this.label_;
  }
  set label(v) {
    this.label_ = v;
    if (this.labelEditor_)
      this.labelEditor_.label = v;
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

  startLabelEdit() {
    console.assert(this.labelEditor_);
    this.labelEditor_.startLabelEdit();
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
    const clone = Nodes.createNode("node", this.map_);
    clone.label = this.label;
    return clone;
  }

  getSizingInfo() {
    return {
      label_width: this.shadowRoot.querySelector(".label_holder").style.width
    };
  }
  setSizingInfo(info) {
    this.shadowRoot.querySelector(".label_holder").style.width =
      info.label_width;
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

  // Storage -------------------------------------
  loadFromData(data) {
    this.label = data.label || '<deprecated label>';
    this.position = data.position || [0, 0];
    if (this.shadowRoot) {
      this.shadowRoot.querySelector(".label_holder").style.width = data.label_width;
    } else {
      if (!this.fromData_)
        this.fromData_ = {};
      this.fromData_['label_width'] = data.label_width;
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
      type: 'node',
      position: this.position,
      children_hidden: this.childrenHidden_,
      nodes: []
    };
    const label_holder = this.shadowRoot && this.shadowRoot.querySelector(".label_holder");
    if (label_holder && label_holder.style.width)
      data['label_width'] = label_holder.style.width;
    for (let i = 0; i < this.children_.length; ++i)
      data.nodes.push(this.children_[i].serializeToData());
    return data;
  }
});
