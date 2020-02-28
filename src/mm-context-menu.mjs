const style = `
:host {
  display: none;
  width: max-content;
  box-shadow: 3px 3px 4px 0px rgba(0, 0, 0, 0.5);
  position: absolute;
  background: white;
  z-index: 100;
}`;

const body = `<slot></slot>`;

window.customElements.define("mm-context-menu", class extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (this.shadowRoot)
      return;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>${style}</style>
      <body>${body}</body>`;
    this.addEventListener("click", (e) => {
      // Find the top level child that was clicked.
      // TODO(vmpstr): I thought ShadowDOM is supposed to hide the internals?
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
    this.client_.map.context_menu = this;
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

