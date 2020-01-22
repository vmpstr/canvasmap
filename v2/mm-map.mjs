const default_label = "new task";
window.customElements.define("mm-map", class extends HTMLElement {
  #nodes = [];
  #selectedNode = null;
  #storage = null;

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

          width: 100%;
          height: 100%;
          background: lightblue;

          position: relative;
        }
        ::slotted(*) {
          position: absolute;
        }
      </style>
      <slot></slot>
    `;

    customElements.whenDefined("mm-node").then(() => {
      const slot = shadow.querySelector("slot");
      slot.addEventListener("slotchange", this.#onSlotChange);
      this.#onSlotChange();
    });

    this.addEventListener("click", (e) => {
      this.#onClick(e);
    });

    this.addEventListener("dblclick", (e) => {
      this.#onDoubleClick(e);
    });

    setInterval(() => { this.#saveToStorage(); }, 1000);
  }

  #onSlotChange = (e) => {
    let nodes = this.shadowRoot.querySelector("slot").assignedNodes();
    this.#nodes = [];
    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i].tagName && nodes[i].tagName.toLowerCase().startsWith("mm-")) {
        this.#nodes.push(nodes[i]);
        nodes[i].setMap(this);
        nodes[i].setParent(this);
      }
    }
  }

  #onClick = (e) => {
    this.#selectedNode && this.#selectedNode.deselect();
    e.stopPropagation();
  }

  #onDoubleClick = (e) => {
    const node = this.#addNode();
    node.label = default_label;

    const rect = node.getBoundingClientRect();
    node.position = [e.clientX - 0.5 * rect.width, e.clientY - 0.5 * rect.height];

    node.select();
    node.startLabelEdit();
    e.stopPropagation();
  }

  #createNode = () => {
    const node = document.createElement("mm-node");
    node.setMap(this);
    return node;
  }

  #addNode = () => {
    const node = this.#createNode();
    this.appendChild(node);
    return node;
  }

  handleKeyDown = (e) => {
    const node = this.#selectedNode;
    if (!node)
      return;
    if (e.key == "Delete" || e.key == "Backspace") {
      node.deselect();
      node.parent.removeChild(node);
      node.remove();
      return;
    }

    let child;
    if (e.key == "Tab" || e.key == "Enter") {
      child = this.#createNode();
      child.label = default_label;
    }

    // Add a child. Note that pressing enter on a root (we're parent) is
    // the same as adding a child (not a sibling).
    if (e.key == "Tab" || (e.key == "Enter" && node.parent == this)) {
      node.unhideChildren();
      node.adoptNode(child);
    } else if (e.key == "Enter") {
      // Add a sibling.
      node.parent.adoptNode(child);
    }

    if (child) {
      child.select();
      child.startLabelEdit();
      e.preventDefault();
    }

    // Arrow navigation.
    if (e.key == "ArrowLeft") {
      if (node.parent != this)
        node.parent.select();
    } else if (e.key == "ArrowRight") {
      if (node.unhideChildren())
        node.firstChild.select();
    } else if (e.key == "ArrowDown") {
      if (node.parent != this) {
        const next = node.parent.nextChild(node);
        if (next)
          next.select();
        else if (node.unhideChildren())
          node.firstChild.select();
      } else if (node.unhideChildren()) {
        node.firstChild.select();
      }
    } else if (e.key == "ArrowUp") {
      if (node.parent != this) {
        const prev = node.parent.prevChild(node);
        if (prev)
          prev.select();
        else
          node.parent.select();
      }
    }
  }

  removeChild = (child) => {
    // Do nothing, since we'll handle this in slot assignment changing
  }

  onDraggedChild = (child) => {
    const rect = child.getBoundingClientRect();
    for (let i = 0; i < this.#nodes.length; ++i) {
      if (this.#nodes[i] == child)
        continue;
      const node_rect = this.#nodes[i].getBoundingClientRect();
      if (rect.left > node_rect.left && rect.left < node_rect.right &&
          rect.top > node_rect.top && rect.top < node_rect.bottom + 15) {
        this.#nodes[i].unhideChildren();
        this.#nodes[i].adoptNode(child);
      }
    }
  }

  adoptNode = (child) => {
    child.remove();
    // This will trigger onSlotChange, which will take care the rest of state.
    this.appendChild(child);
  }

  // Selection -----------------------------------
  nodeSelected(node) {
    if (this.#selectedNode)
      this.#selectedNode.deselect();
    this.#selectedNode = node;
  }

  nodeDeselected(node) {
    if (this.#selectedNode == node)
      this.#selectedNode = null;
  }

  didHideChildren(node) {
    if (!this.#selectedNode)
      return;
    let ancestor = this.#selectedNode.parent;
    while (ancestor) {
      if (ancestor == node) {
        this.#selectedNode.deselect();
        break;
      }
      ancestor = ancestor.parent;
    }
  }

  // Storage -------------------------------------
  setStorage = (storage) => {
    this.#storage = storage;
  }

  loadFromStorage = () => {
    console.assert(this.#storage);

    let nodes = this.#storage.getItem("nodes");
    if (!nodes)
      return;
    nodes = JSON.parse(nodes);
    for (let i = 0; i < nodes.length; ++i) {
      const node = this.#addNode();
      node.loadFromData(nodes[i]);
    }
  }

  #saveToStorage = () => {
    if (!this.#storage)
      return;

    let nodes = [];
    for (let i = 0; i < this.#nodes.length; ++i)
      nodes.push(this.#nodes[i].serializeToData());
    this.#storage.setItem("nodes", JSON.stringify(nodes));
  }
});
