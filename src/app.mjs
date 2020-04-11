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

  removeClickObserver(observer) {
    for (let i = 0; i < this.clickObservers_.length; ++i) {
      if (this.clickObservers_[i] == observer) {
        this.clickObservers_.splice(i, 1);
        break;
      }
    }
  }
}

export let mouseTracker;
export let undoStack;
export let dialogControl;
export let pasteBuffer;

export const pbk =  {
  kStyle: "style",
  kNode: "node"
}

let contextMenuControl;
let initialized = false;

export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;

  // No deps.
  mouseTracker = new MouseTracker;

  // No mm- deps.
  const undoModule = await import(`./undo-stack.mjs?v=${version()}`)
  await undoModule.initialize(version)
  undoStack = new undoModule.UndoStack;

  const pasteModule = await import(`./paste-buffer.mjs?v=${version()}`)
  await pasteModule.initialize(version)
  pasteBuffer = new pasteModule.PasteBuffer;

  const contextModule = await import(`./context-menu-control.mjs?v=${version()}`)
  await contextModule.initialize(version)
  contextMenuControl = new contextModule.ContextMenuControl;

  // Mms async.
  const mmMap = await import(`./mm-map.mjs?v=${version()}`)
  await mmMap.initialize(version)

  const mmNode = await import(`./mm-node.mjs?v=${version()}`)
  await mmNode.initialize(version)

  const mmContextMenu = await import(`./mm-context-menu.mjs?v=${version()}`)
  await mmContextMenu.initialize(version)

  const mmContextMenuItem = await import(`./mm-context-menu-item.mjs?v=${version()}`)
  await mmContextMenuItem.initialize(version)

  const mmScrollerNode = await import(`./mm-scroller-node.mjs?v=${version()}`)
  await mmScrollerNode.initialize(version)

  const mmColorSample = await import(`./mm-color-sample.mjs?v=${version()}`)
  await mmColorSample.initialize(version)

  // Has mm- deps.
  const dialogControlModule = await import(`./dialog-control.mjs?v=${version()}`)
  await dialogControlModule.initialize(version)
  dialogControl = new dialogControlModule.DialogControl;

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
    undoStack.onChange(() => map.saveToStorage());
  });
}
