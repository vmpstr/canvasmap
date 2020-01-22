window.customElements.define("mm-node", class extends HTMLElement {
  #map
  #parent
  #children = []
  #position = [0, 0]
  #label = ''
  #childResizeObserver;
  #childrenHidden = false;

  constructor() {
    super();
  }

  connectedCallback() {
    if (this.shadowRoot) {
      this.#computeEdges();
      return;
    }

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .label {
          box-sizing: border-box;
          width: 100%;
          max-width: min-content;

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
          width: 100%;
          max-width: min-content;
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
        }
        .ew_drag_handle:hover {
          cursor: ew-resize;
        }
        .ew_drag_handle.hidden {
          display: none;
        }

        :host(.selected) .label {
          border-color: blue;
          box-shadow: 0 0 2px 0 blue;
        }
        :host(.dragged) {
          opacity: 20%;
        }
      </style>
        <div class=label_holder>
          <div class=parent_edge></div>
          <div class=child_edge></div>
          <div class="child_toggle expanded"></div>
          <div class=label>${this.label}</div>
          <div class=ew_drag_handle></div>
        </div>
      <div class=child_area>
        <slot></slot>
      </div>
    `;
    const label = this.shadowRoot.querySelector(".label");
    label.setAttribute("draggable", true);
    label.setAttribute("title", this.label);

    const drag_handle = this.shadowRoot.querySelector(".ew_drag_handle");
    drag_handle.setAttribute("draggable", true);

    label.addEventListener("dblclick", (e) => {
      this.startLabelEdit();
      e.stopPropagation();
    });
    label.addEventListener("click", (e) => {
      this.select();
      e.stopPropagation();
    });

    label.addEventListener("dragstart", (e) => {
      this.#onDragStart(e);
    });
    label.addEventListener("drag", (e) => {
      this.#onDrag(e);
    });
    label.addEventListener("dragend", (e) => {
      this.#onDragEnd(e);
    });

    drag_handle.addEventListener("dragstart", (e) => {
      this.#onDragHandleStart(e);
    });
    drag_handle.addEventListener("drag", (e) => {
      this.#onDragHandle(e);
    });
    drag_handle.addEventListener("dragend", (e) => {
      this.#onDragHandleEnd(e);
    });

    if (this.#from_data && this.#from_data.label_width) {
      const label_holder = this.shadowRoot.querySelector(".label_holder");
      label_holder.style.width = this.#from_data.label_width;
    }

    this.#childResizeObserver = new ResizeObserver(this.#onChildSizeChanged);

    const slot = shadow.querySelector("slot");
    slot.addEventListener("slotchange", this.#onSlotChange);

    const child_toggle = this.shadowRoot.querySelector(".child_toggle");
    child_toggle.addEventListener("click", (e) => {
      this.#onChildToggle(e);
    });
    child_toggle.addEventListener("dblclick", (e) => {
      e.stopPropagation();
    });

    if (this.#childrenHidden) {
      this.shadowRoot.querySelector(".child_area").classList.add("hidden");
      this.#map.didHideChildren(this);
    } else {
      this.shadowRoot.querySelector(".child_area").classList.remove("hidden");
    }
    this.#computeEdges();

  }

  setMap = (map) => {
    this.#map = map;
  }

  setParent = (parent) => {
    this.#parent = parent;
    this.#computeStyleFromPosition();
    this.#computeEdges();
  }

  #onSlotChange = () => {
    for (let i = 0; i < this.#children.length; ++i) {
      this.#childResizeObserver.unobserve(this.#children[i]);
    }
    this.#repopulateChildren();
    for (let i = 0; i < this.#children.length; ++i) {
      this.#childResizeObserver.observe(this.#children[i]);
    }
    this.#computeEdges();
  }

  #onChildSizeChanged = () => {
    this.#computeEdges();
  }

  #onChildToggle = (e) => {
    this.#childrenHidden = !this.#childrenHidden;
    if (!this.shadowRoot)
      return;

    if (this.#childrenHidden) {
      this.shadowRoot.querySelector(".child_area").classList.add("hidden");
      this.#map.didHideChildren(this);
    } else {
      this.shadowRoot.querySelector(".child_area").classList.remove("hidden");
    }
    this.#computeEdges();

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  unhideChildren = () => {
    if (this.#childrenHidden)
      this.#onChildToggle();
  }

  #computeEdges = () => {
    if (!this.shadowRoot || !this.#parent)
      return;
    if (this.#parent.has_child_edges) {
      this.shadowRoot.querySelector(".parent_edge").style.display = "";
    } else {
      this.shadowRoot.querySelector(".parent_edge").style.display = "none";
    }

    if (this.#children.length && !this.#childrenHidden) {
      this.shadowRoot.querySelector(".child_edge").style.display = "";
      const last_child = this.#children[this.#children.length - 1];
      let extent = last_child.getBoundingClientRect().top + last_child.parent_edge_offset - this.shadowRoot.querySelector(".label_holder").getBoundingClientRect().bottom;
      this.shadowRoot.querySelector(".child_edge").style.height = extent + "px";
    } else {
      this.shadowRoot.querySelector(".child_edge").style.display = "none";
    }

    const toggle = this.shadowRoot.querySelector(".child_toggle");
    if (this.#children.length)
      toggle.style.display = "";
    else
      toggle.style.display = "none";

    toggle.classList.remove("expanded");
    toggle.classList.remove("collapsed");
    if (this.#childrenHidden)
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
    return this.#childrenHidden;
  }

  get has_child_edges() {
    return true;
  }

  get parent() {
    return this.#parent;
  }

  set position(v) {
    console.assert(v);
    this.#position = v;
    this.#computeStyleFromPosition();
  }

  get position() {
    return this.#position;
  }

  get label() {
    return this.#label;
  }
  set label(v) {
    this.#label = v;

    // Might be setting label before connecting.
    if (!this.shadowRoot)
      return;

    const label = this.shadowRoot.querySelector(".label");
    label.innerHTML = v;
    label.title = v;
  }

  #createNode = () => {
    const node = document.createElement("mm-node");
    node.setMap(this.#map);
    return node;
  }

  resetPosition = () => {
    this.style.left = '0';
    this.style.top = '0';
    const rect = this.getBoundingClientRect();
    this.position = [rect.x, rect.y];
  }

  #computeStyleFromPosition = () => {
    console.assert(getComputedStyle(this).getPropertyValue("position") != "static");
    this.style.left = '0';
    this.style.top = '0';
    const rect = this.getBoundingClientRect();
    this.style.left = (this.#position[0] - rect.x) + "px";
    this.style.top = (this.#position[1] - rect.y) + "px";
  }

  #endLabelEdit = (e) => {
    if (e.type === "keydown") {
      // Propagate tab, since we might do something like add a child.
      // TODO(vmpstr): Whitelist propagatable keys. Arrow keys?
      if (e.key !== "Tab")
        e.stopPropagation();
      if (e.key !== "Enter")
        return;
    }
    e.target.removeEventListener("keydown", this.#endLabelEdit);
    e.target.removeEventListener("focusout", this.#endLabelEdit);
    e.target.contentEditable = false;
    this.shadowRoot.querySelector('.ew_drag_handle').classList.remove('hidden');
    // Restore ellipsis if necessary.
    e.target.style.overflow = "";
    e.target.style.width = "";

    e.target.innerText = e.target.innerText.trim();
    this.#label = e.target.innerText;

    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    this.label = e.target.innerText;
    e.preventDefault();
  };

  startLabelEdit = () => {
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
    el.addEventListener("keydown", this.#endLabelEdit);
    el.addEventListener("focusout", this.#endLabelEdit);
  }

  select = () => {
    this.#map.nodeSelected(this);
    this.classList.add('selected');
  }

  deselect = () => {
    this.#map.nodeDeselected(this);
    this.classList.remove('selected');
  }

  #dragOffset = [0, 0];
  #onDragStart = (e) => {
    const rect = this.getBoundingClientRect();
    this.#dragOffset[0] = rect.x - e.clientX;
    this.#dragOffset[1] = rect.y - e.clientY;
    this.classList.add('dragged');
    e.stopPropagation();
  }
  #onDrag = (e) => {
    if (e.clientX == 0 && e.clientY == 0)
      return;
    this.style.left = this.style.top = 0;
    const rect = this.getBoundingClientRect();
    this.position = [this.#dragOffset[0] + e.clientX,
                     this.#dragOffset[1] + e.clientY];
    this.#parent.onDraggedChild(this);
    e.stopPropagation();
  }

  #onDragEnd = (e) => {
    this.classList.remove('dragged');
    e.stopPropagation();
  }

  #labelContainerInitialWidth;
  #onDragHandleStart = (e) => {
    this.#labelContainerInitialWidth =
      this.shadowRoot.querySelector('.label_holder').getBoundingClientRect().width;
    this.#dragOffset[0] = -e.clientX;
    this.#dragOffset[1] = -e.clientY;
    e.stopPropagation();
  }
  #onDragHandle = (e) => {
    if (e.clientX == 0 && e.clientY == 0)
      return;

    let new_width =
      this.#labelContainerInitialWidth + (e.clientX + this.#dragOffset[0]);
    if (new_width < 10)
      new_width = 10;

    const label_holder = this.shadowRoot.querySelector(".label_holder");
    label_holder.style.width = new_width + "px";
    // Reset if we're trying to expand past the max-width.
    if (label_holder.getBoundingClientRect().width < new_width)
      label_holder.style.width = "";
    e.stopPropagation();
  }
  #onDragHandleEnd = (e) => {
    e.stopPropagation();
  }

  onDraggedChild = (child) => {
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
        (this.#parent != this.#map && child_rect.x < rect.x)) {
      this.#parent.adoptNode(child);
    } else {
      let child_index = -1;
      let next_item = null;
      let next_distance = 1e6;
      let previous_item = null;
      let previous_distance = 1e6;
      for (let i = 0; i < this.#children.length; ++i) {
        const next_item_rect = this.#children[i].getBoundingClientRect();
        if (next_item_rect.y > child_rect.y) {
          const local_distance = next_item_rect.y - child_rect.y;
          if (local_distance < next_distance) {
            next_distance = local_distance;
            next_item = this.#children[i];
          }
        } else if (next_item_rect.y < child_rect.y && child_rect.x > next_item_rect.x + 25 /* TODO: margin?*/) {
          const local_distance = child_rect.y - next_item_rect.y;
          if (local_distance < previous_distance) {
            previous_distance = local_distance;
            previous_item = this.#children[i];
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

  #repopulateChildren = () => {
    let nodes = this.shadowRoot.querySelector("slot").assignedNodes();
    this.#children = [];
    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i].tagName && nodes[i].tagName.toLowerCase().startsWith("mm-"))
        this.#children.push(nodes[i]);
    }
  }

  adoptNode = (child) => {
    // Need to know where to position the child.
    child.remove();
    child.setParent(this);
    this.appendChild(child);
    child.resetPosition();
  }

  // Storage -------------------------------------
  #from_data
  loadFromData = (data) => {
    this.label = data.label || '<deprecated label>';
    this.position = data.position || [0, 0];
    if (data.label_width) {
      if (this.shadowRoot) {
        this.shadowRoot.querySelector(".label_holder").style.width = data.label_width;
      } else {
        if (!this.#from_data)
          this.#from_data = {};
        this.#from_data['label_width'] = data.label_width;
      }
    }
    // TODO(vmpstr): backcompat.
    if (!data.nodes)
      return;
    for (let i = 0; i < data.nodes.length; ++i) {
      // The order here is important since adoptNode resets the position
      // information.
      const node = this.#createNode();
      node.loadFromData(data.nodes[i]);
      this.adoptNode(node);
    }
    if (data.children_hidden)
      this.#onChildToggle();
  }

  serializeToData = () => {
    let data = {
      label: this.label,
      position: this.position,
      children_hidden: this.#childrenHidden,
      nodes: []
    };
    const label_holder = this.shadowRoot && this.shadowRoot.querySelector(".label_holder");
    if (label_holder && label_holder.style.width)
      data['label_width'] = label_holder.style.width;
    for (let i = 0; i < this.#children.length; ++i)
      data.nodes.push(this.#children[i].serializeToData());
    return data;
  }
});
