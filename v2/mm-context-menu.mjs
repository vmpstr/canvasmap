window.customElements.define("mm-context-menu", class extends HTMLElement {
  #client;
  #position;

  constructor() {
    super();
  }

  connectedCallback() {
    if (this.shadowRoot)
      return;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: none;
          width: 250px;
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
        }
      </style>
      <ul><slot></slot></ul>
    `;
    this.shadowRoot.addEventListener("click", (e) => {
      let target = e.target;
      let parent = target.parentElement;
      while (parent && parent != this) {
        target = parent;
        parent = target.parentElement;
      }
      if (parent)
        this.#onClick(target);
    });
  }

  set client(v) {
    this.#client = v;
  }

  showAt = (x, y) => {
    this.style.display = "block";
    this.style.left = x + "px";
    this.style.top = y + "px";
    this.#position = [x, y];
  }

  get position() {
    return this.#position;
  }

  hide = () => {
    this.style.display = "";
  }

  #onClick = (item) => {
    if (this.#client)
      this.#client.onContextMenuSelected(item);
  }
});
