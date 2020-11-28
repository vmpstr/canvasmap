window.customElements.define('node-label', class extends HTMLElement {
  constructor() {
    super();
    this.endLabelEdit_ = this.endLabelEdit_.bind(this);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
      <style>
      div { white-space: pre; }
      </style>
      <div id=label></div>`;
    }

    this.label_ = this.shadowRoot.querySelector("#label");
    this.label_.innerText = this.getAttribute("label");
    this.labelObserver_ = new MutationObserver(() => { this.updateLabel() });
    this.labelObserver_.observe(this, { attributes : true, attributeFilter : ["label"] });
  }

  updateLabel() {
    this.label_.innerText = this.getAttribute("label");
  }

  setLabel(label) {
    const e = new CustomEvent(
      "labelchanged",
      {
        bubbles: false,
        detail: { label: label }
      });
    this.dispatchEvent(e);
  }

  edit() {
    if (this.editing_)
      return;

    const el = this.label_;

    // This is somewhat optional, but if they only thing we have is
    // a zero-width space, then selection is empty but the cursor
    // doesn't blink... So instead, just clear it so we see the
    // cursor blinking.
    if (el.innerText == '\u200b')
      el.innerText = "";

    // First make this contentEditable,
    // so that the selection selects proper contents.
    el.contentEditable = true;
    // Prevent ellipsis editing.
    el.style.overflow = "visible";
    el.style.width = "min-content";
    this.editing_ = true;

    // Create a new range for all of the contents.
    const range = document.createRange();
    range.selectNodeContents(el);

    // Replace the current selection.
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Add event listeners so we can stop editing.
    el.addEventListener("keydown", this.endLabelEdit_);
    el.addEventListener("focusout", this.endLabelEdit_);
  }

  endLabelEdit_(e) {
    if (e.type === "keydown") {
      // Propagate tab, since we might do something like add a child.
      // TODO(vmpstr): Whitelist propagatable keys. Arrow keys? Esc?
      if (e.key !== "Tab")
        e.stopPropagation();
      if (e.key !== "Enter" && e.key !== "Tab")
        return;
    }
    e.target.removeEventListener("keydown", this.endLabelEdit_);
    e.target.removeEventListener("focusout", this.endLabelEdit_);
    e.target.contentEditable = false;
    // Restore ellipsis if necessary.
    e.target.style.overflow = "";
    e.target.style.width = "";
    this.editing_ = false;

    e.target.innerText = e.target.innerText.trim();

    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    this.setLabel(e.target.innerText);
    e.preventDefault();
  }
});
