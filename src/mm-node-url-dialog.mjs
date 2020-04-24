let App;
let Nodes;
let Style;
let Workarounds;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Nodes = await import(`./nodes.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Style = await import(`./style.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Workarounds = await import(`./workarounds.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  define();
}

const define = () => {
  const style = `
  :host {
    position: absolute;
    background: white;
    width: 350px;
    box-shadow: 0 0 10px 0;
    border-radius: 5px;
    border: 1px solid black;
    will-change: transform;
  }
  .container {
    position: relative;
    display: flex;
    flex-direction: column;

    width: calc(100% - 10px);

    margin: 3px;
  }
  .container > * {
    padding: 2px;
  }
  
  /* header and header contents */
  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    background: lightgrey;
    user-select: none;
    border: 1px solid grey;
  }
  .title {
    font-weight: semi-bold;
  }

  .url_entry {
    display: flex;
    flex-direction: row;
  }
  .url_entry > .label {
    flex-shrink: 1;
  }
  .url_entry > .entry {
    flex-grow: 1;
  }

  .track_changes_entry {
    display: flex;
    flex-direction: row;
  }
  .track_changes_entry > .entry {
  }
  .track_changes_entry > .label {
  }

  .dialog_control {
    display: flex;
    flex-direction: row;
  }
  .dialog_control > .save {
  }
  .dialog_control > .cancel {
  }`;

  const body = `
    <div class=container>
      <div class=header>
        <div class=title>Edit URL</div>
      </div>
      <div class=url_entry>
        <div class=label>URL</div>
        <input type=text class=entry></input>
      </div>
      <div class=track_changes_entry>
        <input disabled id=track_input type=checkbox class=entry>
        <label for=track_input>Track changes</label>
      </div>
      <div class=dialog_control>
        <input class=save type=button value="Save"></input>
        <input class=cancel type=button value="Cancel"></input>
      </div>
    </div>
  `;

  console.debug("defining mm-node-url-dialog");
  window.customElements.define("mm-node-url-dialog", class extends HTMLElement {
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
      this.registerCallbacks_();

      const url_entry = this.shadowRoot.querySelector(".url_entry > .entry");
      url_entry.value = this.node_.url;
      url_entry.select();

      const track_input = this.shadowRoot.querySelector(".track_changes_entry > .entry");
      if (this.node_.trackUrl)
        track_input.setAttribute("checked", "");

      this.onInputChanged_();
    }

    registerCallbacks_() {
      const container = this.shadowRoot.querySelector(".container");
      const url_input = this.shadowRoot.querySelector(".url_entry > .entry");
      const cancel = this.shadowRoot.querySelector(".dialog_control > .cancel");
      const save = this.shadowRoot.querySelector(".dialog_control > .save");
      const track_input = this.shadowRoot.querySelector(".track_changes_entry > .entry");
      container.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key == "Tab") {
          if (!container.contains(e.target) || e.target == cancel) {
            e.preventDefault();
            url_input.select();
          }
        } else if (e.key == "Escape") {
          this.cancel_();
        }
      });

      url_input.addEventListener("keydown", (e) => {
        if (e.key == "Enter")
          this.save_();
      });

      url_input.addEventListener("input", (e) => {
        this.onInputChanged_();
      });

      cancel.addEventListener("click", () => this.cancel_());
      save.addEventListener("click", () => this.save_());
    }

    cancel_() {
      App.dialogControl.hideDialog();
    }
    save_() {
      const url_input = this.shadowRoot.querySelector(".url_entry > .entry");
      const track_input = this.shadowRoot.querySelector(".track_changes_entry > .entry");

      this.node_.url = url_input.value;
      this.node_.trackUrl = track_input.checked;
      App.dialogControl.hideDialog();
    }
    onInputChanged_() {
      const url_input = this.shadowRoot.querySelector(".url_entry > .entry");
      const track_input = this.shadowRoot.querySelector(".track_changes_entry > .entry");

      const github_regex = /^(https?:\/\/)?(www.)?github.com\/[^\/]+\/issues\/\d+$/;
      if (github_regex.test(url_input.value)) {
        track_input.removeAttribute("disabled");
      } else {
        track_input.setAttribute("disabled", "");
        track_input.removeAttribute("checked");
      }
    }

    set position(v) {
      this.style.left = `${v[0]}px`;
      this.style.top = `${v[1]}px`;
    }
    set node(v) { this.node_ = v; }

    onDragStart_(e) {
      const rect = this.getBoundingClientRect();
      this.dragOffset_ = [rect.x - e.clientX, rect.y - e.clientY];
      Workarounds.mouseTracker.dragPoint = [e.clientX, e.clientY];

      e.stopPropagation();
      e.dataTransfer.setDragImage(new Image(), 0, 0);
    }

    onDrag_(e) {
      // Workaround for FF.
      let clientPoint;
      if (e.clientX == 0 && e.clientY == 0) {
        clientPoint = Workarounds.mouseTracker.dragPoint;
      } else {
        clientPoint = [e.clientX, e.clientY];
      }
      Workarounds.mouseTracker.dragPoint = [clientPoint[0], clientPoint[1]];

      this.style.left = `${this.dragOffset_[0] + clientPoint[0]}px`;
      this.style.top = `${this.dragOffset_[1] + clientPoint[1]}px`;
      e.stopPropagation();
    }

    onDragEnd_(e) {
      e.stopPropagation();
    }
  });
}
