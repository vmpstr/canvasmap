window.customElements.define("mm-node", class extends HTMLElement {
  #root
  #endEditHandler
  #zwspCode


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
    this.#endEditHandler = (e) => { this.endLabelEdit(e); }
  }

  startLabelEdit() {
    const el = this.#root.querySelector(".label");

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
    el.addEventListener("keydown", this.#endEditHandler);
    el.addEventListener("focusout", this.#endEditHandler);
  }

  endLabelEdit(e) {
    if (e.type === "keydown") {
      if (e.key !== "Enter") 
        return;
    }
    e.target.removeEventListener("keydown", this.#endEditHandler);
    e.target.removeEventListener("focusout", this.#endEditHandler);
    e.target.contentEditable = false;
    e.target.style.overflow = "";

    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    e.preventDefault();
  }
});
