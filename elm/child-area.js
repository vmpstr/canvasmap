window.customElements.define('child-area', class extends HTMLElement {
  constructor() {
    super();

    this.resizeObserver = new ResizeObserver(() => this.recomputeChildEdgeAnchor());
    this.mutationObserver = new MutationObserver(() => this.recomputeChildEdgeAnchor());
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<slot></slot>`;
    }

    this.resizeObserver.observe(this);
    this.mutationObserver.observe(
      this,
      {
        childList: true,
        subtree: true,
        attributeFilter: ["id"]
      });
  }


  disconnectedCallback() {
    this.resizeObserver.unobserve(this);
    this.mutationObserver.disconnect();
  }

  recomputeChildEdgeAnchor() {
    const last_child = this.lastNonBeaconElement(this.shadowRoot.querySelector("slot").assignedElements());
    if (!last_child) {
      this.sendChildEdgeHeightEvent(0);
      return;
    }
    const total_rect = this.getBoundingClientRect();
    const last_child_rect = last_child.getBoundingClientRect();
    this.sendChildEdgeHeightEvent(last_child_rect.y - total_rect.y);
  }

  lastNonBeaconElement(elements) {
    for (let i = elements.length - 1; i >= 0; i--) {
      if (!elements[i].classList.contains("beacon"))
        return elements[i];
    }
    return null;
  }

  sendChildEdgeHeightEvent(height) {
    const e = new CustomEvent(
      "childedgeheightchanged",
      {
        bubbles: false,
        detail: { height: height }
      });
    this.dispatchEvent(e);
  }
});
