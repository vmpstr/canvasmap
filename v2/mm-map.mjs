import * as Nodes from "./nodes.mjs";

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
          will-change: transform;
        }
        #self {
          height: 100%;
        }

        /* contextmenu formatting */
        li > div:first-child {
          float: left;
        }
        li > div:last-child {
          contain: layout;
          text-align: right;
        }
      </style>
      <mm-context-menu id=context>
        <li id="node"><div>Add tree node</div><div>dblclick</div></li>
        <li id="scroller"><div>Add scroller node</div><div>Shift+dblclick</div></li>
      </mm-context-menu>
      <div id=self></div>
      <slot></slot>
    `;

    shadow.addEventListener("click", this.#onClick);
    shadow.addEventListener("dblclick", this.#onDoubleClick);
    shadow.addEventListener("contextmenu", this.#onContextMenu);

    shadow.querySelector("slot").addEventListener("slotchange", this.#onSlotChange);
    shadow.querySelector("#context").client = this;

    setInterval(() => { this.#saveToStorage(); }, 1000);
  }

  onContextMenuSelected = (item) => {
    const context = this.shadowRoot.querySelector("#context");
    this.#addNodeForUserAt(item.id, context.position[0], context.position[1]);
  }

  #onContextMenu = (e) => {
    if (e.target.id == "self") {
      this.shadowRoot.querySelector("#context").showAt(e.clientX, e.clientY);
      e.preventDefault();
    } else {
      this.shadowRoot.querySelector("#context").hide();
    }
  }

  #onSlotChange = (e) => {
    let nodes = this.shadowRoot.querySelector("slot").assignedNodes();
    this.#nodes = [];
    for (let i = 0; i < nodes.length; ++i) {
      if (Nodes.isKnownTag(nodes[i].tagName)) {
        this.#nodes.push(nodes[i]);
        nodes[i].map = this;
        nodes[i].setParent(this);
      }
    }
  }

  #onClick = (e) => {
    if (e.target.id == "self")
      this.#selectedNode && this.#selectedNode.deselect();
    this.shadowRoot.querySelector("#context").hide();
  }

  #onDoubleClick = (e) => {
    let type = e.shiftKey ? "scroller" : "node";
    this.#addNodeForUserAt(type, e.clientX, e.clientY);
    e.stopPropagation();
  }

  #addNodeForUserAt = (type, x, y) => {
    const node = Nodes.addNode(type, this, this);

    node.label = default_label;

    const rect = node.getBoundingClientRect();
    node.position = [x - 0.5 * rect.width, y - 0.5 * rect.height];

    // Needs to happen before label edit, since
    // that will start a new transaction.
    gUndoStack.didCreate(node);

    node.select();
    node.startLabelEdit();
  }

  handleKeyDown = (e) => {
    const node = this.#selectedNode;
    if (!node)
      return;
    if (e.key == "Delete" || e.key == "Backspace") {
      gUndoStack.willDelete(node);
      node.deselect();
      node.remove();
      return;
    }

    let child;
    if (e.key == "Tab" || e.key == "Enter") {
      child = Nodes.createNode("node", this);
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
      // Needs to happen before label edit, since
      // that will start a new transaction.
      gUndoStack.didCreate(child);

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
      const node = Nodes.addNode(nodes[i].type || "node", this, this);
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
