import { UndoStack } from "./undo-stack.mjs";

class MouseTracker {
  constructor() {
    document.body.addEventListener(
      "click", (e) => this.handledClick(document.body, e));
  }

  handledClick(object, e) {
    console.debug("click handled by " + object.tagName);
    e.stopPropagation();
  }
}

export const mouseTracker = new MouseTracker;

export function initialize() {
  import("./mm-map.mjs");
  import("./mm-node.mjs");
  import("./mm-context-menu.mjs");
  import("./mm-context-menu-item.mjs");
  import("./mm-scroller-node.mjs");

  const promises = [
    customElements.whenDefined('mm-map'),
    customElements.whenDefined('mm-node'),
    customElements.whenDefined('mm-context-menu'),
    customElements.whenDefined('mm-context-menu-item'),
    customElements.whenDefined('mm-scroller-node')
  ];

  window.gUndoStack = new UndoStack();

  Promise.all(promises).then(() => {
    const map = document.createElement('mm-map');
    document.body.appendChild(map);
    window.addEventListener('keydown', (e) => {
      if (gUndoStack.handleKeyDown(e)) return;
      map.handleKeyDown(e);
    });
    map.setStorage(window.localStorage);
    map.loadFromStorage();
  });
}
