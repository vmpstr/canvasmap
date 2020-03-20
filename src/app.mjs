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
let contextMenuControl;
let initialized = false;

export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;

  // No deps.
  mouseTracker = new MouseTracker;

  // No mm- deps.
  const undoModule = await import(`./undo-stack.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  undoStack = new undoModule.UndoStack;

  let contextModule = await import(`./context-menu-control.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  contextMenuControl = new contextModule.ContextMenuControl;

  // Mms async.
  import(`./mm-map.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  import(`./mm-node.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  import(`./mm-context-menu.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  import(`./mm-context-menu-item.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  import(`./mm-scroller-node.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  import(`./mm-color-sample.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });

  // Has mm- deps.
  const dialogModule = await import(`./dialog-control.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  dialogControl = new dialogModule.DialogControl;

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
