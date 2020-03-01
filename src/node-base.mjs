import * as Nodes from "./nodes.mjs";
import * as Handlers from "./handlers.mjs";

export class NodeBase extends HTMLElement {
  constructor() {
    super();
    this.children_ = [];
    this.position_ = [0, 0];
    this.childrenHidden_ = false;
  }

  createShadow(style, body) {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <body>${body}</body>`;
  }

  registerEventHandlers_() {
    const label = this.shadowRoot.querySelector(".label");
    const slot = this.shadowRoot.querySelector("slot");
    const child_toggle = this.shadowRoot.querySelector(".child_toggle");

    console.assert(label);
    console.assert(slot);
    console.assert(child_toggle);

    this.labelEditor_ = new Handlers.LabelEditor(this, label);
    this.childResizeObserver_ = new ResizeObserver(() => this.computeEdges_());

    slot.addEventListener("slotchange", (e) => this.onSlotChange_(e));
    child_toggle.addEventListener("click", (e) => this.onChildToggle_(e));
    child_toggle.addEventListener("dblclick", (e) => e.stopPropagation());
  }

  // Getters ===================================================================
  get has_child_edges() { return false; }
  get label() { return this.label_; }
  get map() { return this.map_; }
  get parent() { return this.parent_; }
  // Position is in screen coordinates. 
  // TODO(vmpstr): it will become hard to reason about this, so we need better
  // spaces or explicit separation between fixed position and free nodes.
  get position() { return this.position_; }

  // Setters ===================================================================
  set label(v) {
    this.label_ = v;
    if (this.labelEditor_)
      this.labelEditor_.label = v;
  }
  set map(v) { this.map_ = v; }
  set position(v) {
    console.assert(v);
    this.position_ = v;
    this.computeStyleFromPosition_();
  }

  // TODO(vmpstr): Audit this.
  setParent(parent) {
    this.parent_ = parent;
    this.computeStyleFromPosition_();
    this.computeEdges_();
  }

  // Event handlers ============================================================
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

  // Misc ======================================================================
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

  unhideChildren() {
    if (this.childrenHidden_)
      this.onChildToggle_();
    return this.children_.length > 0;
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

  clone() {
    const clone = Nodes.createNode(this.node_type, this.map_);
    clone.label = this.label;
    clone.position = this.position;
    return clone;
  }

  cloneWithChildrenAsType(type) {
    const clone = Nodes.createNode(type, this.map_);
    clone.label = this.label;
    clone.position = this.position;
    while (this.children.length)
      clone.adoptNode(this.children[0]);
    return clone;
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
}
