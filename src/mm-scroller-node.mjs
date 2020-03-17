let App;
let Nodes;
let Handlers;
let NodeBaseModule;
let Style;
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
  define();
}

const define = () => {
  const style = `
  ${Style.customVariablesInitialization("scroller")}
  :host {
    display: flex;
    flex-shrink: 1;
    border-radius: var(--effective-border-radius);

    background: var(--effective-background);
    box-sizing: border-box;
  }
  :host(:hover) {
  }
  :host(.dragged) {
    opacity: 40%;
  }
  :host(.selected) {
  }

  .container {
    display: flex;
    flex-direction: column;

    box-sizing: inherit;
    width: 100%;

    padding: 5px 0 5px 0;

    position: relative;
    overflow: hidden;
    max-width: max-content;
    min-width: 30px;
    min-height: 45px;
    border-radius: inherit;
    border: var(--effective-border);
  }
  .container:hover {
    box-shadow: 0 0 2px 0;
  }
  :host(.selected) .container {
    border-color: blue;
    box-shadow: 0 0 3px 0 blue;
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
    width: 100%;
    max-width: max-content;
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
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--effective-background);
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
  .ns_drag_handle {
    position: absolute;
    left: 10px;
    bottom: -3px;
    height: 7px;
    width: calc(100% - 20px);
    cursor: ns-resize;
    opacity: 0.01;
  }

  .divider {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    margin-top: 5px;
  }
  .divider_line {
    border-top: 1px solid grey;
    flex-grow: 1;

    /* fix flex making the height 0.99 -> 0 */
    box-sizing: border-box;
    min-height: 2px;
  }`;

  const contextMenu = `
  <mm-context-menu-item choice=edit>
    <div slot=text>Edit label</div>
    <div slot=shortcut>e</div>
  </mm-context-menu-item>
  <mm-context-menu-item>
    <div slot=text>Convert to</div>
    <div slot=shortcut>&#x27a4;</div>
    <mm-context-menu id=convertmenu slot=submenu>
    </mm-context-menu>
  </mm-context-menu-item>
  <mm-context-menu-item choice=self_style>
    <div slot=text>Self style</div>
  </mm-context-menu-item>`;

  const body = `
  <div class=parent_edge></div>
  <div class=container>
    <div class=label_holder>
      <div class=label></div>
    </div>
    <div class=divider>
      <div class=divider_line></div>
      <div class="child_toggle expanded"></div>
      <div class=divider_line></div>
    </div>
    <div class=child_area>
      <slot></slot>
    </div>
  </div>
  <div class=ew_drag_handle></div>
  <div class=ns_drag_handle></div>
  <div class=nwse_drag_handle></div>`;

  console.debug("defining mm-scroller-node");
  window.customElements.define("mm-scroller-node", class extends NodeBaseModule.NodeBase {
    // Creation and initialization ===============================================
    constructor() {
      super();
    }

    connectedCallback() {
      if (this.shadowRoot) {
        this.computeEdges_();
        return;
      }

      this.createShadow(style, body);
      this.registerEventHandlers_();

      // Set state from deferred data, and children hidden flags.
      if (this.deferredData_) {
        const container = this.shadowRoot.querySelector(".container");
        container.style.width = this.deferredData_.container_width;
        container.style.maxHeight = this.deferredData_.container_maxheight;
        delete this.deferredData_;
      }

      if (this.childrenHidden_) {
        this.shadowRoot.querySelector(".child_area").classList.add("hidden");
        this.map_.didHideChildren(this);
      } else {
        this.shadowRoot.querySelector(".child_area").classList.remove("hidden");
      }

      // Recompute the edges just in case we hid children.
      this.computeEdges_();
    }

    registerEventHandlers_() {
      super.registerEventHandlers_();

      const container = this.shadowRoot.querySelector(".container");
      const label = this.shadowRoot.querySelector(".label");
      const child_area = this.shadowRoot.querySelector(".child_area");

      this.dragControl_ = new Handlers.NodeDragControl(this, container);
      this.dragHandleControl_ = new Handlers.DragHandleControl(
        this, container,
        {'ew': this.shadowRoot.querySelector(".ew_drag_handle"),
         'ns': this.shadowRoot.querySelector(".ns_drag_handle"),
         'nwse': this.shadowRoot.querySelector(".nwse_drag_handle")});

      // TODO(vmpstr): Refactor this.
      child_area.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        if (this.children_ && this.children_.length > 0)
          return;
        const node = Nodes.addNode("node", this, this.map_);
        node.label = "new task";
        this.adoptNode(node);
        App.undoStack.didCreate(node);
        node.select();
        node.startLabelEdit();
      });
      this.addEventListener("dblclick", (e) => {
        this.startLabelEdit();
        e.stopPropagation();
      });

      // TODO(vmpstr): Clean this up; issue 11.
      container.addEventListener("click", (e) => {
        if (e.target == container || e.target == label || e.target == child_area) {
          this.select();
          App.mouseTracker.handledClick(this, e);
        }
      });
    }

    // Getters ===================================================================
    get parent_edge_offset() {
      if (!this.shadowRoot)
        return 0;
      return this.shadowRoot.querySelector(".parent_edge").getBoundingClientRect().top -
             this.shadowRoot.querySelector(".container").getBoundingClientRect().top;
    }
    get node_type() { return "scroller"; }

    getContextMenu() {
      const menu = document.createElement("mm-context-menu");
      menu.innerHTML = contextMenu;
      menu.handler = (item, position) => this.onContextMenuItem_(item, position);
      const submenu = menu.querySelector("#convertmenu");
      const choices = Nodes.similarTypes(this.node_type);
      for (let i = 0; i < choices.length; ++i) {
        const choice = document.createElement("mm-context-menu-item");
        choice.setAttribute("choice", choices[i]);
        choice.innerHTML = `<div slot=text>${Nodes.prettyName(choices[i])}</div>`;
        submenu.appendChild(choice);
      }
      return menu;
    }

    onContextMenuItem_(item, position) {
      const choice = item.getAttribute("choice");
      if (choice == "edit") {
        this.startLabelEdit();
      } else if (choice == "self_style") {
        App.dialogControl.showStyleDialog(this, position);
      } else {
        this.convertToType(choice);
      }
    }

    // Event handlers ============================================================
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

    // Misc ======================================================================
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

    // TODO(vmpstr): This needs a refactor.
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

    // TODO(vmpstr): Use this in storage.
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
    // TODO(vmpstr): Move to a helper.
    loadFromData(data) {
      this.label = data.label || '<deprecated label>';
      this.position = data.position || [0, 0];
      if (this.shadowRoot) {
        const container = this.shadowRoot.querySelector(".container");
        container.style.width = data.container_width;
        container.style.maxHeight = data.container_maxheight;
      } else {
        this.deferredData_ = this.deferredData_ || {};
        this.deferredData_['container_width'] = data.container_width;
        this.deferredData_['container_maxheight'] = data.container_maxheight;
      }

      if (data.styles) {
        for (let i = 0; i < data.styles.length; ++i)
          this.setCustomStyle(`--self-${data.styles[i].name}`, data.styles[i].value);
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
        type: 'scroller',
        position: this.position,
        children_hidden: this.childrenHidden_,
        nodes: [],
        styles: []
      };
      const container = this.shadowRoot.querySelector(".container");
      if (container && container.style.width)
        data['container_width'] = container.style.width;
      if (container && container.style.maxHeight)
        data['container_maxheight'] = container.style.maxHeight;

      const all_styles = Style.getAllBaseCustomStyles();
      for (let i = 0; i < all_styles.length; ++i) {
        const name = all_styles[i].name;
        const self_value = this.getSelfCustomStyle(name);
        if (self_value) {
          data.styles.push({
            name: name,
            value: self_value
          });
        }
      }

      for (let i = 0; i < this.children_.length; ++i)
        data.nodes.push(this.children_[i].serializeToData());
      return data;
    }
  });
}
