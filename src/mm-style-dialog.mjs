let App;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  define();
}

const define = () => {
  const style = `
  :host {
    position: absolute;
    background: white;
    width: 200px;
    height: 200px;
    box-shadow: 0 0 10px 0;
    border-radius: 5px;
  }
  #close {
    user-select: none;
    position: absolute;
    top: 0;
    right: 0;
  }`;

  const body = `
    <div id=close>X</div>
  `;

  console.debug("defining mm-style-dialog");
  window.customElements.define("mm-style-dialog", class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      if (this.shadowRoot)
        return;

      console.assert(this.node_);

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>${style}</style>
        <body>${body}</body>`;

      this.shadowRoot.querySelector("#close").addEventListener("click",
        () => App.dialogControl.hideDialog());
    }

    set position(v) {
      this.style.left = `${v[0]}px`;
      this.style.top = `${v[1]}px`;
    }
    set node(v) { this.node_ = v; }
  });
}

