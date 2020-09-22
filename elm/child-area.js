window.customElements.define('child-area', class extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) {
      this.resizeObserver.observe(this);
      return;
    }

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<slot></slot>`;

    shadow.querySelector("slot").addEventListener("slotchange", () => this.onSlotChange());
    this.resizeObserver = new ResizeObserver(() => this.onSizeChange());
    this.resizeObserver.observe(this);
  }


  disconnectedCallback() {
    this.resizeObserver.unobserve(this);
  }

  onSizeChange() {
    this.recomputeChildEdgeAnchor();
  }

  onSlotChange() {
    this.recomputeChildEdgeAnchor();
  }

  recomputeChildEdgeAnchor() {
    // TODO(vmpstr): Recompute from last child and fire event.
    console.log(this.getBoundingClientRect());
  }
});
