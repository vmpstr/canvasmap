window.customElements.define("mm-context-menu", class extends HTMLElement {
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
          display: block;
          width: 300px;
          box-shadow: 0 0 3px 0 rgba(0, 0, 0, 0.2);
          position: absolute;
          background: white;
          z-index: 100;
          left: 50px;
          top: 500px;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        ::slotted(li) {
          font-weight: 500;
          font-size: 14pt;
          padding: 5px 40px 5px 20px;
          cursor: pointer;
        }
        ::slotted(li:hover) {
          background: rgba(0, 0, 0, 0.2);
        }
      </style>
      <ul><slot></slot></ul>
    `;
  }
});
