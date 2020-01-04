window.customElements.define("mm-map", class extends HTMLElement {
  #nodes

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background: lightblue;
          position: relative;
        }
      </style>
      <slot></slot>
    `;

    customElements.whenDefined("mm-node").then(() => {
      const slot = shadow.querySelector("slot");
      slot.addEventListener("slotchange", this.#onSlotChange);
      this.#onSlotChange();
    });
  }

  #onSlotChange = (e) => {
    let nodes = this.shadowRoot.querySelector("slot").assignedNodes();
    let y = 0;
    this.#nodes = [];
    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i].tagName && nodes[i].tagName.toLowerCase() === "mm-node") {
        this.#nodes.push(nodes[i]);
        nodes[i].setMap(this);
        nodes[i].style.top = y + "px";
        nodes[i].style.left = "0px";
        y += nodes[i].getBoundingClientRect().height;
      }
    }
  }
});
