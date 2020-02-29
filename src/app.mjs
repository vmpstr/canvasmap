import { UndoStack } from "./undo-stack.mjs";

class MouseTracker {
  constructor() {
    this.clickObservers_ = [];
    document.body.addEventListener(
      "click", (e) => this.handledClick(document.body, e));
  }

  handledClick(object, e) {
    console.debug("click handled by " + object.tagName);
    e.stopPropagation();
    for (let i = 0; i < this.clickObservers_.length; ++i)
        this.clickObservers_[i](object, e);
  }

  registerClickObserver(observer) {
    this.clickObservers_.push(observer);
  }
}

export const mouseTracker = new MouseTracker;
export const undoStack = new UndoStack;
let contextMenuControl;

export async function initialize() {
  const t = Date.now();
  import(`./mm-map.mjs?${t}`);
  import(`./mm-node.mjs?${t}`);
  import(`./mm-context-menu.mjs?${t}`);
  import(`./mm-context-menu-item.mjs?${t}`);
  import(`./mm-scroller-node.mjs?${t}`);

  let contextModule = await import(`./context-menu-control.mjs?${t}`);
  contextMenuControl = new contextModule.ContextMenuControl;

  const promises = [
    customElements.whenDefined('mm-map'),
    customElements.whenDefined('mm-node'),
    customElements.whenDefined('mm-context-menu'),
    customElements.whenDefined('mm-context-menu-item'),
    customElements.whenDefined('mm-scroller-node')
  ];

  Promise.all(promises).then(() => {
    const map = document.createElement('mm-map');
    document.body.appendChild(map);
    window.addEventListener('keydown', (e) => {
      if (undoStack.handleKeyDown(e)) return;
      map.handleKeyDown(e);
    });
    map.setStorage(window.localStorage);
    map.loadFromStorage();
  });
}
