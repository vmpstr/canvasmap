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

export let mouseTracker;
export let undoStack;
export let dialogControl;
let contextMenuControl;
let initialized = false;

export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;

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
  import(`./mm-color-picker.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  let contextModule = await import(`./context-menu-control.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  const undoModule = await import(`./undo-stack.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  const dialogModule = await import(`./dialog-control.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });

  mouseTracker = new MouseTracker;
  undoStack = new undoModule.UndoStack;
  contextMenuControl = new contextModule.ContextMenuControl;
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
  });
}
