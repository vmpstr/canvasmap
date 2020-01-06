window.customElements.define("mm-map", class extends HTMLElement {
  #nodes
  #selectedNode = null;

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
      </style>
      <slot></slot>
    `;

    customElements.whenDefined("mm-node").then(() => {
      const slot = shadow.querySelector("slot");
      slot.addEventListener("slotchange", this.#onSlotChange);
      this.#onSlotChange();
      this.#doInitialLayout();
    });

    this.addEventListener("click", (e) => {
      this.#onClick(e);
    });

    this.addEventListener("dblclick", (e) => {
      this.#onDoubleClick(e);
    });

    this.addEventListener
  }

  #onSlotChange = (e) => {
    let nodes = this.shadowRoot.querySelector("slot").assignedNodes();
    this.#nodes = [];
    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i].tagName && nodes[i].tagName.toLowerCase() === "mm-node") {
        this.#nodes.push(nodes[i]);
        nodes[i].setMap(this);
      }
    }
  }

  #doInitialLayout = () => {
    let y = 0;
    for (let i = 0; i < this.#nodes.length; ++i) {
      this.#nodes[i].style.top = y + "px";
      this.#nodes[i].style.left = "0px";
      y += this.#nodes[i].getBoundingClientRect().height;
    }
  }

  nodeSelected(node) {
    if (this.#selectedNode)
      this.#selectedNode.deselect();
    this.#selectedNode = node;
  }

  nodeDeselected(node) {
    if (this.#selectedNode == node)
      this.#selectedNode = null;
  }

  #onClick = (e) => {
    this.#selectedNode && this.#selectedNode.deselect();
    e.stopPropagation();
  }

  #onDoubleClick = (e) => {
    const node = document.createElement("mm-node");
    node.setMap(this);
    // Append to the light dom so it's inspectable and gets assigned
    // to the slot.
    this.appendChild(node);
    const rect = node.getBoundingClientRect();
    node.style.left = (e.clientX - 0.5 * rect.width) + "px";
    node.style.top = (e.clientY - 0.5 * rect.height) + "px";
    node.select();
    node.startLabelEdit();
    e.stopPropagation();
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
});
