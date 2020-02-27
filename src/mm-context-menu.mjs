const style = `
:host {
  display: none;
  width: max-content;
  box-shadow: 3px 3px 4px 0px rgba(0, 0, 0, 0.5);
  position: absolute;
  background: white;
  z-index: 100;
  left: 50px;
  top: 500px;
}
ul {
  list-style: none;
  padding: 0;
  padding-top: 3px;
  padding-bottom: 3px;
  margin: 0;
}
::slotted(li) {
  font-family: Verdana, sans-serif;
  font-weight: 100;
  font-size: 8pt;
  padding: 5px 20px 5px 20px;
  cursor: default;
}
::slotted(li:hover) {
  background: rgba(0, 0, 0, 0.2);
}`;

const body = `<ul><slot></slot></ul>`;

window.customElements.define("mm-context-menu", class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot)
      return;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>${style}</style>
      <body>${body}</body>`;
    this.shadowRoot.addEventListener("click", (e) => {
      // Find the top level child that was clicked.
      let target = e.target;
      let parent = target.parentElement;
      while (parent && parent != this) {
        target = parent;
        parent = target.parentElement;
      }
      if (parent)
        this.onClick_(target);
    });
  }

  set client(v) {
    this.client_ = v;
  }

  showAt(x, y) {
    this.style.display = "block";
    this.style.left = x + "px";
    this.style.top = y + "px";
    this.position_ = [x, y];
  }

  get position() {
    return this.position_;
  }

  hide() {
    this.style.display = "";
  }

  onClick_(item) {
    if (this.client_)
      this.client_.onContextMenuSelected(item);
  }
});
