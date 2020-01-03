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
          padding: 10px;

          position: absolute;
          top: 350px;
          left: 150px;

          display: flex;
          justify-content: center;
        }
        :host > .label {
          margin: auto;
          display: table-cell;
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      </style>
      <div class=label>new task</div>
    `;
    this.setAttribute("draggable", true);
    this.addEventListener("dblclick", () => { this.startLabelEdit(); });
  }

  #endLabelEdit = (e) => {
    if (e.type === "keydown") {
      if (e.key !== "Enter") 
        return;
    }
    e.target.removeEventListener("keydown", this.#endLabelEdit);
    e.target.removeEventListener("focusout", this.#endLabelEdit);
    e.target.contentEditable = false;
    // Restore ellipsis if necessary.
    e.target.style.overflow = "";

    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    e.preventDefault();
  };

  startLabelEdit = () => {
    const el = this.#root.querySelector(".label");

    // This is somewhat optional, but if they only thing we have is
    // a zero-width space, then selection is empty but the cursor
    // doesn't blink... So instead, just clear it so we see the
    // cursor blinking.
    if (el.innerText == '\u200b')
      el.innerHTML = "";

    // First make this contentEditable,
    // so that the selection selects proper contents.
    el.contentEditable = true;
    // Prevent ellipsis editing.
    el.style.overflow = "visible";

    // Create a new range for all of the contents.
    const range = document.createRange();
    range.selectNodeContents(el);

    // Replace the current selection.
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Add event listeners so we can stop editing.
    el.addEventListener("keydown", this.#endLabelEdit);
    el.addEventListener("focusout", this.#endLabelEdit);
  }
});
