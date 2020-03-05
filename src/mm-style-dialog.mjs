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
    width: 250px;
    box-shadow: 0 0 10px 0;
    border-radius: 5px;
    border: 1px solid black;
  }
  .container {
    position: relative;
    display: flex;
    flex-direction: column;

    width: calc(100% - 10px);
    height: calc(100% - 10px);

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
  .dialog_control {
    font-weight: bold;
    display: flex;
    flex-direction: row;
    width: max-content;
  }
  .maximize_button {
  }
  .close_button {
  }

  /* property selection */
  .selection_container {
    display: flex;
    flex-direction: row;
    justify-content: center;

    width: 100%;
  }
  .property_title {
  }
  .property_selector {
  }

  .properties_container {
    position: relative;
  }

  .property_container {
    position: absolute;
    top: 0;
    left: 0;

    display: flex;
    flex-direction: column;
    width: 100%;
  }

  /* description */
  .property_description {
  }

  /* property editing */
  .property_editor_container {
    background: lightgreen;
  }`;

  const body = `
    <div class=container>
      <div class=header>
        <div class=title></div>
        <div class=dialog_control>
          <div class=maximize_button>m</div>
          <div class=close_button>X</div>
        </div>
      </div>
      <div class=selection_container>
        <div class=property_title>property:&nbsp;</div>
        <select class=property_selector></select>
      </div>
      <div class=properties_container></div>
    </div>
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

      this.customizeForNode_();
      this.registerEventHandlers_();
    }

    customizeForNode_() {
      this.shadowRoot.querySelector(".title").innerText =
        `${Nodes.prettyName(this.node_.node_type)} style`;

      const select = this.shadowRoot.querySelector(".property_selector");
      select.addEventListener("change", () => this.selectionChanged_());

      const propertiesContainer = this.shadowRoot.querySelector(".properties_container");

      this.styles_ = Style.getSelectionStylesForType(this.node_.node_type);
      console.assert(this.styles_.length);
      for (let i = 0; i < this.styles_.length; ++i) {
        let option = document.createElement("option");
        if (i == 0)
          option.selected = "selected";
        option.value = i;
        option.innerText = this.styles_[i].selection_name;
        select.appendChild(option);

        let container = document.createElement("div");
        container.classList.add("property_container");
        container.id = `property_container_${i}`;
        container.style.visibility = "hidden";
        container.style.zIndex = "-1";
        propertiesContainer.appendChild(container);

        let description = document.createElement("div");
        description.classList.add("property_description");
        description.innerText = this.styles_[i].description;
        container.appendChild(description);

        let control = document.createElement("div");
        control.classList.add("property_editor_container");
        container.appendChild(control);
        // TODO(vmpstr): construct the editor for the given property.

      }

      let maxHeight = 0;
      for (let i = 0; i < this.styles_.length; ++i) {
        const height =
          propertiesContainer.querySelector(`#property_container_${i}`)
            .getBoundingClientRect().height;
        maxHeight = Math.max(maxHeight, height);
      }
      propertiesContainer.style.minHeight = `${Math.ceil(maxHeight)}px`;

      this.selectedOption_ = 0;
      this.selectionChanged_();
    }

    selectionChanged_() {
      const select = this.shadowRoot.querySelector(".property_selector");
      console.assert(select.value >= 0 && select.value < this.styles_.length);

      const currentContainer =
        this.shadowRoot.querySelector(`#property_container_${this.selectedOption_}`);
      currentContainer.style.visibility = "hidden";
      currentContainer.style.zIndex = "-1";

      this.selectedOption_ = select.value;

      const newContainer =
        this.shadowRoot.querySelector(`#property_container_${this.selectedOption_}`);
      newContainer.style.visibility = "visible";
      newContainer.style.zIndex = "0";
    }

    registerEventHandlers_() {
      const closeButton = this.shadowRoot.querySelector(".close_button");
      closeButton.addEventListener("click", () => App.dialogControl.hideDialog());

      const header = this.shadowRoot.querySelector(".header");
      header.setAttribute("draggable", true);
      header.addEventListener("dragstart", (e) => this.onDragStart_(e));
      header.addEventListener("drag", (e) => this.onDrag_(e));
      header.addEventListener("dragend", (e) => this.onDragEnd_(e));
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

