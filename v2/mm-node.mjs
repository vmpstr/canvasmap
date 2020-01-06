window.customElements.define("mm-node", class extends HTMLElement {
  #map

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
          border: 1px solid black;
          border-radius: 10px;
          padding: 10px;

          position: absolute;

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
    this.addEventListener("dblclick", (e) => {
      this.startLabelEdit();
      e.stopPropagation();
    });
    this.addEventListener("click", (e) => {
      this.select();
      e.stopPropagation();
    });

    this.addEventListener("dragstart", (e) => {
      this.#onDragStart(e);
    });
    this.addEventListener("drag", (e) => {
      this.#onDrag(e);
    });
    this.addEventListener("dragend", (e) => {
      this.#onDragEnd(e);
    });
  }

  setMap = (map) => {
    this.#map = map;
  }

  #endLabelEdit = (e) => {
    if (e.type === "keydown") {
      e.stopPropagation();
      if (e.key !== "Enter") 
        return;
    }
    e.target.removeEventListener("keydown", this.#endLabelEdit);
    e.target.removeEventListener("focusout", this.#endLabelEdit);
    e.target.contentEditable = false;
    // Restore ellipsis if necessary.
    e.target.style.overflow = "";

    e.target.innerText = e.target.innerText.trim();
    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    e.preventDefault();
  };

  startLabelEdit = () => {
    const el = this.shadowRoot.querySelector(".label");

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

  select = () => {
    this.#map.nodeSelected(this);
    this.style.borderColor = "blue";
  }

  deselect = () => {
    this.#map.nodeDeselected(this);
    this.style.borderColor = "";
  }

  #dragOffset = [0, 0];
  #onDragStart = (e) => {
    const rect = this.getBoundingClientRect();
    this.#dragOffset[0] = rect.x - e.clientX;
    this.#dragOffset[1] = rect.y - e.clientY;
    this.style.opacity = "20%";
  }
  #onDrag = (e) => {
    if (e.clientX == 0 && e.clientY == 0)
      return;
    this.style.left = (this.#dragOffset[0] + e.clientX) + "px";
    this.style.top = (this.#dragOffset[1] + e.clientY) + "px";
  }
  #onDragEnd = (e) => {
    this.style.opacity = "";
  }
});
