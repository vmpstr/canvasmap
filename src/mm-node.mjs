let App;
let Nodes;
let Handlers;
let NodeBaseModule;
let Style;
let ContextMenuHelpers;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Nodes = await import(`./nodes.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Handlers = await import(`./handlers.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  NodeBaseModule = await import(`./node-base.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Style = await import(`./style.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  ContextMenuHelpers = await import(`./context-menu-helpers.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  define();
}

const define = () => {
  const style = `
  ${Style.customVariablesInitialization("node")}
  :host {
    display: flex;
    flex-shrink: 1;
    border-radius: var(${Style.toEffective("border-radius")});
  }
  .container {
    width: 100%;
    position: relative;
    border-radius: inherit;
  }
  .label {
    box-sizing: border-box;
    width: 100%;

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    padding-left: var(${Style.toEffective("horizontal-padding")});
    padding-right: var(${Style.toEffective("horizontal-padding")});
    padding-top: var(${Style.toEffective("vertical-padding")});
    padding-bottom: var(${Style.toEffective("vertical-padding")});
  }
  ${Style.selectors.kChildArea} {
    position: relative;
    contain: layout;
    margin-left: 30px;
    width: calc(100% - 30px);
    max-width: max-content;
  }
  ${Style.selectors.kChildArea}${Style.selectors.kHidden} {
    min-height: 10px;
  }
  ${Style.selectors.kChildArea}${Style.selectors.kHidden} > * {
    display: none;
  }
  ::slotted(*) {
    position: relative;
    margin-top: 5px;
    width: 100%;
    max-width: max-content;
  }
  .label_flexer {
    display: flex;
    position: relative;
    flex-shrink: 1;
    max-width: max-content;
    width: 100%;
    border-radius: inherit;
  }
  .label_holder {
    width: 100%;
    min-width: 20px;
    max-width: max-content;
    position: relative;
    border-radius: inherit;
    background: var(${Style.toEffective("background")});
    border: var(${Style.toEffective("border")});
    box-sizing: border-box;
  }

  .label_selection {
    width: 100%;
    max-width: max-content;
    border-radius: inherit;
    box-shadow: 0px 2px 3px 0px rgba(0,0,0,0.5);
    transition: box-shadow 200ms, transform 200ms, z-index 200ms;
  }
  .label_selection:hover {
    box-shadow: 0px 10px 10px 0px rgba(0,0,0,0.3);
    z-index: 10;
  }

  @media (min-resolution: 192dpi) {
    .label_selection:hover {
      transform: scale(1.01);
    }
  }
  :host(.has_parent_edge) .label_selection {
    transform-origin: left;
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
    background: var(${Style.toEffective("background")});
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
    box-sizing: content-box;
    top: 15%;
    right: -4px;
    width: 9px;
    height: 70%;
    opacity: 0.01;
  }
  .ew_drag_handle_cursor {
    cursor: ew-resize;
    margin: 1px;
    width: 100%;
    height: 100%;
  }

  :host(.selected) .label_selection {
    margin: -1px;
    border: 1px solid blue;

  }
  :host(.selected) .label_selection:hover {
    box-shadow: 0px 10px 10px 0px rgba(0,0,255,0.5);
  }
  :host(.selected) .label_selection {
    box-shadow: 0px 2px 3px 0px rgba(0,0,255,0.7);
  }

  :host(.dragged) {
    opacity: 40%;
  }`;

  const body = `
  <div class=container>
    <div class=label_flexer>
      <div class=label_selection>
        <div class=label_holder>
          <div class=label></div>
        </div>
        <div class=ew_drag_handle><div class=ew_drag_handle_cursor></div></div>
        <div class="child_toggle expanded"></div>
        <div class=parent_edge></div>
        <div class=child_edge></div>
      </div>
    </div>
    <div class=${Style.classes.kChildArea}>
      <slot></slot>
    </div>
  </div>`;

  console.debug("defining mm-node");
  window.customElements.define("mm-node", class extends NodeBaseModule.NodeBase {
    // Creation and initialization ===============================================
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

      this.registerEventHandlers_();

      if (this.deferredData_) {
        const label_holder = this.shadowRoot.querySelector(".label_holder");
        label_holder.style.width = this.deferredData_.label_width;
        delete this.deferredData_;
      }

      const child_area = this.shadowRoot.querySelector(Style.selectors.kChildArea);
      if (this.childrenHidden_) {
        child_area.classList.add(Style.classes.kHidden);
        this.map_.didHideChildren(this);
      } else {
        child_area.classList.remove(Style.classes.kHidden);
      }

      // Recompute the edges just in case we hid children.
      this.computeEdges_();
    }

    registerEventHandlers_() {
      super.registerEventHandlers_();

      const label = this.shadowRoot.querySelector(".label");
      const drag_handle = this.shadowRoot.querySelector(".ew_drag_handle");
      const label_holder = this.shadowRoot.querySelector(".label_holder");

      this.dragControl_ = new Handlers.NodeDragControl(this, label_holder);
      this.dragHandleControl_ = new Handlers.DragHandleControl(
        this, label_holder, {'ew': drag_handle});

      label_holder.addEventListener("click", (e) => {
        this.select();
        App.mouseTracker.handledClick(this, e);
      });
    }

    // Getters ===================================================================
    get has_child_edges() { return true; }
    get parent_edge_offset() {
      if (!this.shadowRoot)
        return 0;
      return this.shadowRoot.querySelector(".parent_edge").getBoundingClientRect().top -
             this.shadowRoot.querySelector(".label_flexer").getBoundingClientRect().top;
    }
    get node_type() { return "node"; }
    get hero() { return this.shadowRoot.querySelector(".label_holder"); }

    getContextMenu() {
      return ContextMenuHelpers.createMenu([
        ContextMenuHelpers.menus.editLabel(() => this.startLabelEdit()),
        ContextMenuHelpers.menus.convertTo(this.node_type, (type) => this.convertToType(type)),
        ContextMenuHelpers.menus.selfStyle((action, position) => this.selfStyleAction(action, position))
      ]);
    }

    // Misc ======================================================================
    computeEdges_() {
      if (!this.shadowRoot || !this.parent_)
        return;
      if (this.parent_.has_child_edges) {
        this.shadowRoot.querySelector(".parent_edge").style.display = "";
        this.classList.add("has_parent_edge");
      } else {
        this.shadowRoot.querySelector(".parent_edge").style.display = "none";
        this.classList.remove("has_parent_edge");
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

      if (this.children_.length && !this.childrenHidden_) {
        this.shadowRoot.querySelector(".child_edge").style.display = "";
        const last_child = this.children_[this.children_.length - 1];
        const child_toggle_rect = this.shadowRoot.querySelector(".child_toggle").getBoundingClientRect();
        const child_edge = this.shadowRoot.querySelector(".child_edge");
        let extent =
            Math.max(last_child.getBoundingClientRect().top +
                     last_child.parent_edge_offset -
                     child_toggle_rect.bottom, 0);
        child_edge.style.top = `calc(${child_toggle_rect.height}px + 100%)`;
        child_edge.style.height = extent + "px";
      } else {
        this.shadowRoot.querySelector(".child_edge").style.display = "none";
      }
    }

    onDraggedChild(child) {
      const rect = this.getBoundingClientRect();
      const child_rect = child.getBoundingClientRect();
      const padding_slack = 15;
      if (child_rect.left > rect.right ||
          child_rect.right < rect.left ||
          (child_rect.top - padding_slack) > (rect.bottom - child_rect.height) ||
          child_rect.top < rect.top ||
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
        let saw_child = false;
        for (let i = 0; i < this.children_.length; ++i) {
          if (this.children_[i] == child) {
            saw_child = true;
            continue;
          }

          const next_item_rect = this.children_[i].getBoundingClientRect();
          if ((!saw_child && (next_item_rect.y + 0.5 * next_item_rect.height > child_rect.y)) ||
              (saw_child && (next_item_rect.y + 0.5 * next_item_rect.height - child_rect.height > child_rect.y))) {
            const local_distance = next_item_rect.y - child_rect.y;
            if (local_distance < next_distance) {
              next_distance = local_distance;
              next_item = this.children_[i];
            }
          } else if (!saw_child && child_rect.x > next_item_rect.x + 25 /* TODO: margin?*/) {
            const local_distance = child_rect.y - next_item_rect.y;
            if (local_distance < previous_distance) {
              previous_distance = local_distance;
              previous_item = this.children_[i];
            }
          }
        }
        child.remove();
        if (previous_item && !previous_item.childrenHidden()) {
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

    getSizingInfo() {
      return {
        label_width: this.shadowRoot.querySelector(".label_holder").style.width
      };
    }
    setSizingInfo(info) {
      this.shadowRoot.querySelector(".label_holder").style.width =
        info.label_width;
    }

    // Storage -------------------------------------
    loadFromData(data) {
      this.label = data.label || '<deprecated label>';
      this.position = data.position || [0, 0];
      if (this.shadowRoot) {
        this.shadowRoot.querySelector(".label_holder").style.width = data.label_width;
      } else {
        if (!this.deferredData_)
          this.deferredData_ = {};
        this.deferredData_['label_width'] = data.label_width;
      }

      // TODO(vmpstr): backcompat
      if (data.styles) {
        for (let i = 0; i < data.styles.length; ++i)
          this.setCustomStyle(Style.toSelf(data.styles[i].name), data.styles[i].value);
      }

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
        nodes: [],
        styles: []
      };
      // Serialize width of the element.
      const label_holder = this.shadowRoot && this.shadowRoot.querySelector(".label_holder");
      if (label_holder && label_holder.style.width)
        data['label_width'] = label_holder.style.width;

      const all_styles = Style.getAllCustomStyles();
      for (let i = 0; i < all_styles.length; ++i) {
        const name = all_styles[i];
        const self_value = this.getSelfCustomStyle(name);
        if (self_value) {
          data.styles.push({
            name: name,
            value: self_value
          });
        }
      }

      // Serialize children.
      for (let i = 0; i < this.children_.length; ++i)
        data.nodes.push(this.children_[i].serializeToData());
      return data;
    }
  });
};
