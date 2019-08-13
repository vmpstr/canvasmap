export class DetailsControl {
  constructor() {
    this.selection_ = undefined;
    this.createDetailsPane();
  }

  createDetailsPane() {
    this.createStylesheet();

    this.pane_ = document.createElement("div");
    this.pane_.classList.add("details_pane", "initial");
    document.body.appendChild(this.pane_);
  }

  createStylesheet() {
    console.assert(!document.getElementById("details_control_stylesheet"));
    const link = document.createElement("link");
    link.id = "details_control_stylesheet";
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "stylesheets/details_control.css?a=" + (new Date()).valueOf();
    link.media = "all";
    document.head.appendChild(link);
  }

  handleNewSelection(item) {
    this.selection_ = item;
    this.pane_.classList.remove("initial", "hidden");
    this.pane_.classList.add("visible");
  }

  removeSelection() {
    this.selection_ = undefined;
    this.pane_.classList.remove("initial", "visible");
    this.pane_.classList.add("hidden");
  }
}
