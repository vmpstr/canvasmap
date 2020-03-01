let App;
let Nodes;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Nodes = await import(`./nodes.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  define();
}

const style = `
:host {
  display: none;
  width: max-content;
  box-shadow: 3px 3px 4px 0px rgba(0, 0, 0, 0.5), 0 0 3px 0 rgba(0, 0, 0, 0.7);
  position: absolute;
  background: white;
  z-index: 100;
}`;

const body = `
  <slot></slot>
  <div id=subcontainer></div>`;

const define = () => {
  console.debug("defining mm-context-menu");
  window.customElements.define("mm-context-menu", class extends HTMLElement {
    constructor() {
      super();
      this.visible_ = false;
      this.containerOffset_ = [0, 0];
      this.position_ = [0, 0];
      this.submenu_ = null;
      this.items_ = [];
      this.submenuHovered_ = false;
      this.submenuIndex_ = -1;
      this.hoveredIndex_ = -1;
      this.checkIfSubmenuNeedsUpdate_ = this.checkIfSubmenuNeedsUpdate_.bind(this);
    }

    connectedCallback() {
      if (this.shadowRoot) {
        this.recomputeContainerOffset_();
        this.adjustStyle_();
        return;
      }

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>${style}</style>
        <body>${body}</body>`;
      this.addEventListener("click", (e) => {
        // Find the top level child that was clicked.
        // TODO(vmpstr): I thought ShadowDOM is supposed to hide the internals?
        let target = e.target;
        let parent = target.parentElement;
        while (parent && parent != this) {
          target = parent;
          parent = target.parentElement;
        }
        if (parent)
          this.onClick_(target, e);
      });
      this.addEventListener("slotchange", () => this.onSlotChange_());
      this.onSlotChange_();
      this.addEventListener("mousemove", this.checkIfSubmenuNeedsUpdate_);

      this.recomputeContainerOffset_();
      this.adjustStyle_();
      if (this.deferredSubmenuCheckPosition_) {
        this.checkIfSubmenuNeedsUpdate_({
          clientX: this.deferredSubmenuCheckPosition_[0],
          clientY: this.deferredSubmenuCheckPosition_[1]});
        delete this.deferredSubmenuCheckPosition_;
      }
    }

    onSlotChange_(e) {
      this.items_ = [];
      const nodes = this.shadowRoot.querySelector("slot").assignedNodes();
      for (let i = 0; i < nodes.length; ++i) {
        if (Nodes.isKnownTag(nodes[i].tagName))
          this.items_.push(nodes[i]);
      }
    }

    hoveredElement_(position) {
      let node = this.shadowRoot.elementFromPoint(position[0], position[1]);
      while (node) {
        if (node == this.submenu_)
          return node;
        if (this.items_.includes(node))
          return node;
        node = node.parentElement;
      }
      return null;
    }
    checkIfSubmenuNeedsUpdate_(e) {
      if (!this.shadowRoot) {
        this.deferredSubmenuCheckPosition_ = [e.clientX, e.clientY];
        return;
      }
      const hovered = this.hoveredElement_([e.clientX, e.clientY]);
      if (!hovered)
        return;

      if (this.submenu_) {
        if (hovered == this.submenu_)
          return;
        const index = Nodes.childOrdinal(hovered, this);
        if (this.submenuIndex_ == index)
          return;
        this.removeSubmenu_();
      }

      const submenu = hovered.getSubmenu();
      if (submenu) {
        const rect = hovered.getBoundingClientRect();
        this.showSubmenu_(hovered, submenu, [rect.x + rect.width, rect.y]);
      }
    }

    set handler(v) { this.handler_ = v; }
    set control(v) { this.control_ = v; }

    showAt(x, y) {
      this.style.display = "block";
      this.recomputeContainerOffset_();
      this.position_ = [x, y];
      this.visible_ = true;
      this.adjustStyle_();
      this.checkIfSubmenuNeedsUpdate_({ clientX: x, clientY: y });
    }

    get visible() { return this.visible_; }

    hide() {
      this.style.display = "";
      this.visible_ = false;
    }

    adjustStyle_() {
      this.style.left = (this.position_[0] - this.containerOffset_[0]) + "px";
      this.style.top = (this.position_[1] - this.containerOffset_[1]) + "px";
    }

    recomputeContainerOffset_() {
      const left = this.style.left;
      const top = this.style.top;
      this.style.left = this.style.top = 0;
      const rect = this.getBoundingClientRect();
      this.containerOffset_ = [rect.x, rect.y];
      this.style.left = left;
      this.style.top = top;
    }

    removeSubmenu_() {
      if (!this.submenu_)
        return;
      this.submenu_.hide();
      this.submenu_.remove();
      this.submenu_.removeEventListener("mouseenter", this.checkIfSubmenuNeedsUpdate_);
      this.submenu_.removeEventListener("mouseout", this.checkIfSubmenuNeedsUpdate_);
      this.items_[this.submenuIndex_].classList.remove("active");
      this.submenuIndex_ = -1;
      this.submenu_ = null;
    }

    showSubmenu_(item, submenu, position) {
      this.submenu_ = submenu;
      this.submenuIndex_ = Nodes.childOrdinal(item, this);
      submenu.showAt(position[0], position[1]);
      submenu.handler = (item, position) => this.onSubmenuClick_(item, position);
      submenu.addEventListener("mouseenter", this.checkIfSubmenuNeedsUpdate_);
      submenu.addEventListener("mouseout", this.checkIfSubmenuNeedsUpdate_);
      item.classList.add("active");
      this.shadowRoot.querySelector("#subcontainer").appendChild(submenu);
    }

    onSubmenuClick_(item, position) {
      if (this.handler_) {
        // Ignore passed position, and use our position.
        this.handler_(item, this.position_);
      }
      this.removeSubmenu_();
      if (this.control_)
        this.control_.dismissMenu();
    }

    onClick_(item, e) {
      const submenu = item.getSubmenu();
      if (submenu != this.submenu_)
        this.removeSubmenu_();

      if (submenu) {
        if (!this.submenu_) {
          const rect = item.getBoundingClientRect();
          this.showSubmenu_(item, submenu, [rect.x + rect.width, rect.y]);
        }
        return;
      }

      if (this.handler_)
        this.handler_(item, this.position_);
      if (this.control_)
        this.control_.dismissMenu();
      App.mouseTracker.handledClick(this, e);
    }
  });
};
