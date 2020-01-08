window.customElements.define("mm-node", class extends HTMLElement {
  #map
  #parent
  #children = []

  get adoptOffset() {
    const rect = this.shadowRoot.querySelector('.child_area').getBoundingClientRect();
    return [rect.x, rect.y];
  }

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
          background: blue;
        }

        :host > .label {
          width: 100%;
          max-width: min-content;

          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          border: 1px solid black;
          border-radius: 10px;
          padding: 10px;
        }
        :host > .child_area {
          position: relative;
          contain: layout;
          padding-right: 30px;
          background: green;
        }
        ::slotted(*) {
          position: relative;
          margin-top: 5px;
          left: 30px;
          width: max-content;
          background: pink;
        }
      </style>
        <div class=label>${this.label}</div>
      <div class=child_area>
        <slot></slot>
      </div>
    `;
    this.shadowRoot.querySelectorAll(".label")[0].setAttribute("draggable", true);
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

  setParent = (parent) => {
    this.#parent = parent;
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
    e.target.style.width = "";

    e.target.innerText = e.target.innerText.trim();
    // If we have nothing, keep the height with zero-width space.
    if(e.target.innerText == "")
      e.target.innerHTML = '&#x200b;'

    this.label = e.target.innerText;
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
    el.style.width = "min-content";

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
    e.stopPropagation();
  }
  #onDrag = (e) => {
    if (e.clientX == 0 && e.clientY == 0)
      return;
    // Have to get a new adoptOffset every time, since the #parent pointer may
    // change in response to onDraggedChild
    //const adoptOffset = this.#parent.adoptOffset;
    this.style.left = this.style.top = 0;
    const rect = this.getBoundingClientRect();
    const adoptOffset = [rect.x, rect.y];

    this.style.left = (this.#dragOffset[0] + e.clientX - adoptOffset[0]) + "px";
    this.style.top = (this.#dragOffset[1] + e.clientY - adoptOffset[1]) + "px";
    this.#parent.onDraggedChild(this);
    e.stopPropagation();
  }

  #onDragEnd = (e) => {
    this.style.opacity = "";
    e.stopPropagation();
  }

  onDraggedChild = (child) => {
    const rect = this.getBoundingClientRect();
    const child_rect = child.getBoundingClientRect();
    console.log('rect child');
    console.log(rect);
    console.log(child_rect);
    const padding_slack = 15;// + (this.#children.length) * 30;
    if (child_rect.left > rect.right ||
        child_rect.right < rect.left ||
        (child_rect.top - padding_slack) > rect.bottom ||
        child_rect.bottom < rect.top) {
      console.log('above is out'
        + (child_rect.left > rect.right) + " "
        + (child_rect.right < rect.left) + " "
        + ((child_rect.top - padding_slack) > rect.bottom) + " "
        + (child_rect.bottom < rect.top) + " ");
      child.style.left = '';
      child.style.top = '';
      this.#parent.adoptNode(child);
      for (let i = 0; i < this.#children.length; ++i) {
        if (this.#children[i] == child) {
          this.#children.splice(i, 1);
          break;
        }
      }
    } else {
      console.log('above is in');
      child.style.left = '';
      child.style.top = '';
    }
      
  }

  adoptNode = (child) => {
    const rect = child.getBoundingClientRect();
    child.remove();
    this.appendChild(child);
    child.setParent(this);
    //child.style.left = (rect.x - this.adoptOffset[0]) + "px";
    //child.style.top = (rect.y - this.adoptOffset[1]) + "px";
      child.style.left = '';
      child.style.top = '';
    this.#children.push(child);
  }

});
