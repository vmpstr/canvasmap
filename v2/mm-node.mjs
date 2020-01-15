window.customElements.define("mm-node", class extends HTMLElement {
  #map
  #parent
  #children = []
  #position = [0, 0]
  #label = ''

  constructor() {
    super();
  }

  connectedCallback() {
    if (this.shadowRoot)
      return;

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
        .child_area {
          position: relative;
          contain: layout;
          margin-left: 30px;
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
        .ew_drag_handle {
          /* debug */
          background: blue;

          position: absolute;
          top: 15%;
          right: -2px;
          width: 5px;
          height: 70%;
        }
        .ew_drag_handle:hover {
          cursor: ew-resize;
        }


        :host(.selected) .label {
          border-color: blue;
        }
        :host(.dragged) {
          opacity: 20%;
        }
      </style>
        <div class=label_holder>
          <div class=label>${this.label}</div>
          <div class=ew_drag_handle></div>
        </div>
      <div class=child_area>
        <slot></slot>
      </div>
    `;
    const label = this.shadowRoot.querySelector(".label");
    label.setAttribute("draggable", true);
    this.addEventListener("dblclick", (e) => {
      this.startLabelEdit();
      e.stopPropagation();
    });
    label.addEventListener("click", (e) => {
      this.select();
      e.stopPropagation();
    });

    this.addEventListener("dragstart", (e) => {
      this.#onDragStart(e);
    });
    this.addEventListener("drag", (e) => {
      this.#onDrag(e);
    });
    this.addEventListener("dragend", (e) => {
      this.#onDragEnd(e);
    });
  }

  setMap = (map) => {
    this.#map = map;
  }

  setParent = (parent) => {
    this.#parent = parent;
    this.#computeStyleFromPosition();
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
      e.stopPropagation();
      if (e.key !== "Enter") 
        return;
    }
    e.target.removeEventListener("keydown", this.#endLabelEdit);
    e.target.removeEventListener("focusout", this.#endLabelEdit);
    e.target.contentEditable = false;
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
      this.removeChild(child);
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
        previous_item.adoptNode(child);
      } else {
        // next_item may be null.
        this.insertBefore(child, next_item);
      }
      child.resetPosition();

      // We need to do this so the serializing remembers the order.
      this.#repopulateChildren();
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
    this.appendChild(child);
    child.setParent(this);
    child.resetPosition();
    this.#children.push(child);
  }

  removeChild = (child) => {
    for (let i = 0; i < this.#children.length; ++i) {
      if (this.#children[i] == child) {
        this.#children.splice(i, 1);
        break;
      }
    }
  }

  // Storage -------------------------------------
  loadFromData = (data) => {
    this.label = data.label || '<deprecated label>';
    this.position = data.position || [0, 0];
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
  }

  serializeToData = () => {
    let data = {
      label: this.label,
      position: this.position,
      nodes: []
    };
    for (let i = 0; i < this.#children.length; ++i)
      data.nodes.push(this.#children[i].serializeToData());
    return data;
  }
});
