window.customElements.define("mm-node", class extends HTMLElement {
  #root

  constructor() {
    super();

    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.innerHTML = `
      <style>
        :host {
          border: 1px solid black;
          border-radius: 10px;
          width: 130px;
          height: 40px;

          position: absolute;
          top: 350px;
          left: 150px;

          display: flex;
          justify-content: center;
        }
        :host > .label {
          margin: auto;
          display: table-cell;
        }
      </style>
      <div class=label>new task</div>
    `;
    this.setAttribute("draggable", true);
  }
});
