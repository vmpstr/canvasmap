import * as App from "./app.mjs";
import * as Nodes from "./nodes.mjs";
import * as Workarounds from "./workarounds.mjs";

const default_label = "new task";

const style = `
:host {
  display: block;

  width: 100%;
  height: 100%;
  background: lightblue;
}
::slotted(*) {
  position: absolute;
  will-change: transform;
}
#self {
  height: 100%;
  overflow: auto;
  position: relative;
}`;

const contextMenu = `
<mm-context-menu-item action=add type=node>
  <div slot=text>Add tree node</div>
  <div slot=shortcut>dblclick</div>
</mm-context-menu-item>
<mm-context-menu-item action=add type=scroller>
  <div slot=text>Add scroller node</div>
  <div slot=shortcut>Shift+dblclick</div>
</mm-context-menu-item>`;

const body = `
<div id=self>
  <slot></slot>
</div>`;

window.customElements.define("mm-map", class extends HTMLElement {
  constructor() {
    super();
    this.nodes_ = [];
    this.selectedNode_ = null;
    this.storage_ = null;
  }

  connectedCallback() {
    if (this.shadowRoot)
      return;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>${style}</style>
      <body>${body}</body>`;

    shadow.addEventListener("click", (e) => this.onClick_(e));
    shadow.addEventListener("dblclick", (e) => this.onDoubleClick_(e));
    shadow.addEventListener("dragover", (e) => {
      Workarounds.mouseTracker.dragPoint = [e.clientX, e.clientY];
      e.preventDefault();
    });

    shadow.querySelector("slot").addEventListener("slotchange", (e) => this.onSlotChange_(e));

    setInterval(() => this.saveToStorage_(), 1000);

  }

  get map() {
    return this;
  }

  getContextMenu() {
    const menu = document.createElement("mm-context-menu");
    menu.innerHTML = contextMenu;
    menu.handler = (item, position) => this.onContextMenuChoice_(item, position);
    return menu;
  }
  onContextMenuChoice_(item, position) {
    if (item.getAttribute("action") == "add")
      this.addNodeForUserAt_(item.getAttribute("type"), position);
  }

  onSlotChange_(e) {
    let nodes = this.shadowRoot.querySelector("slot").assignedNodes();
    this.nodes_ = [];
    for (let i = 0; i < nodes.length; ++i) {
      if (Nodes.isKnownTag(nodes[i].tagName)) {
        this.nodes_.push(nodes[i]);
        nodes[i].map = this;
        nodes[i].setParent(this);
      }
    }
  }

  onClick_(e) {
    if (e.target.id == "self") {
      this.selectedNode_ && this.selectedNode_.deselect();
      App.mouseTracker.handledClick(this, e);
    }
  }

  onDoubleClick_(e) {
    let type = e.shiftKey ? "scroller" : "node";
    this.addNodeForUserAt_(type, [e.clientX, e.clientY]);
    e.stopPropagation();
  }

  addNodeForUserAt_(type, p) {
    const node = Nodes.addNode(type, this, this);

    node.label = default_label;

    const rect = node.getBoundingClientRect();
    node.position = [p[0] - 0.5 * rect.width, p[1] - 0.5 * rect.height];

    // Needs to happen before label edit, since
    // that will start a new transaction.
    App.undoStack.didCreate(node);

    node.select();
    node.startLabelEdit();
  }

  handleKeyDown(e) {
    const node = this.selectedNode_;
    if (!node)
      return;
    if (e.key == "Delete" || e.key == "Backspace") {
      App.undoStack.willDelete(node);
      if (node.parent && node.parent.select)
        node.parent.select();
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
      node.parent.adoptNode(child, Nodes.childOrdinal(node, node.parent) + 1);
    }

    if (child) {
      // Needs to happen before label edit, since
      // that will start a new transaction.
      App.undoStack.didCreate(child);

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
        node.firstElementChild.select();
    } else if (e.key == "ArrowDown") {
      if (node.parent != this) {
        const next = node.nextElementSibling;
        if (next)
          next.select();
        else if (node.unhideChildren())
          node.firstElementChild.select();
      } else if (node.unhideChildren()) {
        node.firstElementChild.select();
      }
    } else if (e.key == "ArrowUp") {
      if (node.parent != this) {
        const prev = node.previousElementSibling;
        if (prev)
          prev.select();
        else
          node.parent.select();
      }
    }
  }

  onDraggedChild(child) {
    const rect = child.getBoundingClientRect();
    for (let i = 0; i < this.nodes_.length; ++i) {
      if (this.nodes_[i] == child)
        continue;
      const node_rect = this.nodes_[i].getBoundingClientRect();
      if (rect.left > node_rect.left && rect.left < node_rect.right &&
          rect.top > node_rect.top && rect.top < node_rect.bottom + 15) {
        this.nodes_[i].unhideChildren();
        this.nodes_[i].adoptNode(child);
      }
    }
  }

  adoptNode(child) {
    child.remove();
    child.setParent(this);
    // This will trigger onSlotChange, which will take care the rest of state.
    this.appendChild(child);
  }

  // Selection -----------------------------------
  nodeSelected(node) {
    if (this.selectedNode_)
      this.selectedNode_.deselect();
    this.selectedNode_ = node;
    node.scrollIntoView();
  }

  nodeDeselected(node) {
    if (this.selectedNode_ == node)
      this.selectedNode_ = null;
  }

  didHideChildren(node) {
    if (!this.selectedNode_)
      return;
    let ancestor = this.selectedNode_.parent;
    while (ancestor) {
      if (ancestor == node) {
        this.selectedNode_.deselect();
        break;
      }
      ancestor = ancestor.parent;
    }
  }

  // Storage -------------------------------------
  setStorage(storage) {
    this.storage_ = storage;
  }

  loadFromStorage() {
    console.assert(this.storage_);

    let nodes = this.storage_.getItem("nodes");
    if (!nodes)
      return;
    nodes = JSON.parse(nodes);
    for (let i = 0; i < nodes.length; ++i) {
      const node = Nodes.addNode(nodes[i].type || "node", this, this);
      node.loadFromData(nodes[i]);
    }
  }

  saveToStorage_() {
    if (!this.storage_)
      return;

    let nodes = [];
    for (let i = 0; i < this.nodes_.length; ++i)
      nodes.push(this.nodes_[i].serializeToData());
    this.storage_.setItem("nodes", JSON.stringify(nodes));
  }
});
