let App;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
}

export class ContextMenuControl {
  constructor() {
    document.body.addEventListener("contextmenu", e => this.onContextMenu_(e));
    this.cover_ = document.createElement("div");
    this.cover_.style = `
      position: absolute;
      z-index: 100;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;`;
    this.cover_.addEventListener("click", (e) => {
      this.dismissMenu();
      App.mouseTracker.handledClick(this, e);
    });
  }

  onContextMenu_(e) {
    console.assert(e.composedPath);
    if (e.composedPath()[0].contentEditable == "true")
      return;
    for (let i = 0; i < e.composedPath().length; ++i) {
      if (e.composedPath()[i].getContextMenu) {
        this.onCustomContextMenu(e, e.composedPath()[i].getContextMenu());
        break;
      }
    }
    e.preventDefault();
  }

  onCustomContextMenu(e, menu) {
    e.preventDefault();
    e.stopPropagation();

    console.assert(!this.activeMenu_);
    this.activeMenu_ = menu;
    if (!this.activeMenu_)
      return;

    menu.style.zIndex = "101";
    menu.control = this;

    document.body.append(this.cover_);
    document.body.append(menu);

    menu.showAt(e.clientX, e.clientY);
  }

  dismissMenu() {
    this.activeMenu_.hide();
    this.activeMenu_.remove();
    this.cover_.remove();
    this.activeMenu_ = null;
  }
};
