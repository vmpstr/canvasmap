let initialized = false;
let App;
let Style;
let Workarounds;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Style = await import(`./style.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });

  await import(`./mm-color-picker.mjs?v=${version()}`).then(async m => await m.initialize(version));

  define();
}

const define = () => {
  const style = `
    :host {
      position: relative;
      background: url(${Style.checkerUrl}) repeat;
      --rgba: 0, 0, 0, 1;
    }
    .sample {
      width: 100%;
      height: 100%;
      background: rgba(var(--rgba));
      border-radius: inherit;
    }
    #picker {
      position: absolute;
      width: 300px;
      height: 300px;
    }
  `;

  const body = `
    <div class=sample></div>
  `;

  window.customElements.define("mm-color-sample", class extends HTMLElement {
    constructor() {
      super();
      this.rgba_ = [0, 0, 0, 1];
      this.callbacks_ = [];
    }

    connectedCallback() {
      if (this.shadowRoot)
        return;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>${style}</style>
        <body>${body}</body>`;

      this.picker_ = document.createElement("mm-color-picker");
      this.picker_.id = "picker";
      console.assert(window.customElements.get("mm-color-picker"));
      this.picker_.setRgbaNoNotify(this.rgba_);
        
      this.registerEventHandlers_();
    }

    registerEventHandlers_() {
      this.picker_.onChange((v) => {
        this.style.setProperty("--rgba", `${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}`);
        this.rgba_ = v;
        for (let i = 0; i < this.callbacks_.length; ++i)
          this.callbacks_[i](v);
      });

      this.shadowRoot.addEventListener("click", (e) => {
        // Order matters, we dismiss the picker on click handled.
        if (this.picker_.isConnected) {
          App.mouseTracker.handledClick(this, e);
        } else {
          App.mouseTracker.handledClick(this, e);
          this.shadowRoot.appendChild(this.picker_);
          this.picker_.style.top = "50%;";
          const rect = this.getBoundingClientRect();
          this.picker_.style.left = `calc(50% - ${Math.min(rect.x, this.picker_.getBoundingClientRect().width / 2)}px)`;
        }
      });
    }

    set rgba(v) {
      this.style.setProperty("--rgba", `${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}`);
      if (this.picker_)
        this.picker_.setRgbaNoNotify(v);
      this.rgba_ = v;
    }
    get rgba() {
      return this.rgba_;
    }

    onChange(callback) {
      this.callbacks_.push(callback);
    }
  });
}

