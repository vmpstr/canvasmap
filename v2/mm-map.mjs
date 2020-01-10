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
    node.label = "new task";

    const rect = node.getBoundingClientRect();
    node.position = [e.clientX - 0.5 * rect.width, e.clientY - 0.5 * rect.height];

    node.select();
    node.startLabelEdit();
    e.stopPropagation();
  }

  #addNode = () => {
    const node = document.createElement("mm-node");
    node.setMap(this);
    this.appendChild(node);
    return node;
  }

  handleKeyDown = (e) => {
    if (e.key == "Delete" || e.key == "Backspace") {
      const node = this.#selectedNode;
      if (!node)
        return;
      node.deselect();
      node.remove();
    }
  }

  onDraggedChild = (child) => {
    const rect = child.getBoundingClientRect();
    for (let i = 0; i < this.#nodes.length; ++i) {
      if (this.#nodes[i] == child)
        continue;
      const node_rect = this.#nodes[i].getBoundingClientRect();
      if (rect.left > node_rect.left && rect.left < node_rect.right &&
          rect.top > node_rect.top && rect.top < node_rect.bottom + 15) {
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
