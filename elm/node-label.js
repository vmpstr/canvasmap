window.customElements.define('node-label', class extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<div id=label></div>`;
    }

    this.label_ = this.shadowRoot.querySelector("#label");
    this.label_.innerText = this.getAttribute("label");
    this.labelObserver_ = new MutationObserver(() => { this.updateLabel() });
    this.labelObserver_.observe(this, { attributes : true, attributeFilter : ["label"] });
  }

  updateLabel() {
    this.label_.innerText = this.getAttribute("label");
  }
});
