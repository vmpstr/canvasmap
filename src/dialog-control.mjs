let App;
let StyleDialogModule;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  StyleDialogModule = await import(`./mm-style-dialog.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
}

export class DialogControl {
  constructor() {
  }

  showStyleDialog(node, position) {
    this.hideDialog();

    this.activeDialog_ = document.createElement("mm-style-dialog");
    this.activeDialog_.node = node;
    this.activeDialog_.position = position;
    document.body.appendChild(this.activeDialog_);
  }

  hideDialog() {
    if (this.activeDialog_)
      this.activeDialog_.remove();
  }
};
