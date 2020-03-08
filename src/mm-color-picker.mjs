let initialized = false;
let Workarounds;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  Workarounds = await import(`./workarounds.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  define();
}
const define = () => {
  const checker = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA0ppVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTc5MkU2MDQ2MDM2MTFFQUJCRDhCQThBQ0QyRjNDNjkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTc5MkU2MDM2MDM2MTFFQUJCRDhCQThBQ0QyRjNDNjkiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjNDEyN2I1MS02MDM1LTExZWEtYWE2OS1hMjJjNDc3ZTZjZTUiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjNDEyN2I1MS02MDM1LTExZWEtYWE2OS1hMjJjNDc3ZTZjZTUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4Jp6ghAAAABlBMVEX////MzMw46qqDAAAAF0lEQVR42mJghAIGGBgggQG2HiYAEGAARRAAgR90vRgAAAAASUVORK5CYII=`;

  const style = `
    :host {
      background: white;
      border-radius: 5px;
      border: 1px solid black;
      box-shadow: 0 0 2px black;
      padding: 5px;

      --root-rgb: 255, 0, 0;
      --computed-rgb: 255, 0, 0;
      --root-alpha: 1;
    }

    .abstopleft {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .container {
      width: 100%;
      height: 100%;
      display: grid;
      grid-gap: 10px;
      grid-template-rows: auto 1fr auto;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "value value"
        "ls-picker a-picker"
        "h-picker none"
    }

    .value {
      grid-area: value;
    }
    .value > .sample_holder {
      position: relative;
      width: 25px;
      height: 25px;
      border: 1px solid black;
      background: url(${checker}) repeat;
    }
    .value > .sample_holder > .sample {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(var(--computed-rgb), var(--root-alpha));
    }

    .ls_picker {
      border: 1px solid black;
      width: 100%;
      height: 100%;
      position: relative;
      grid-area: ls-picker;
      overflow: hidden;
    }
    .ls_picker > .root_color {
      background: rgb(var(--root-rgb));
    }
    .ls_picker > .saturation_cover {
      background: linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
    }
    .ls_picker > .lightness_cover {
      background: linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .ls_cursor {
      position: absolute;
      top: 0;
      left: 0;

      margin-top: -5px;
      margin-left: -5px;
      width: 5px;
      height: 5px;
      border: 3px solid black;
      box-shadow: 0 0 0 2px white;
      border-radius: 50%;
    }

    .a_picker {
      position: relative;
      border: 1px solid black;
      grid-area: a-picker;
      width: 25px;
      height: 100%;
      background: url(${checker}) repeat;
    }
    .a_picker > .gradient {
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom, rgba(var(--root-rgb), 1), rgba(var(--root-rgb), 0));
    }
    .a_cursor {
      position: absolute;
      top: 0;
      left: 0;

      margin-top: -3px;
      margin-left: -3px;
      height: 3px;
      width: 25px;
      border: 3px solid black;
    }
    
    .h_picker {
      position: relative;
      border: 1px solid black;
      grid-area: h-picker;
      width: 100%;
      height: 25px;
      background:
        linear-gradient(
          to right,
          #ff0000 0%,
          #ffff00 16.66%,
          #00ff00 33.33%,
          #00ffff 50%,
          #0000ff 66.66%,
          #ff00ff 83.33%,
          #ff0000 100%);
    }
    .h_cursor {
      position: absolute;
      top: 0;
      left: 0;

      margin-top: -3px;
      margin-left: -3px;
      height: 25px;
      width: 3px;
      border: 3px solid black;
    }
  `;

  const body = `
    <div class=container>
      <div class=value>
        <div class=sample_holder>
          <div class=sample></div>
        </div>
        rgba
      </div>
      <div class=ls_picker>
        <div class="root_color abstopleft"></div>
        <div class="saturation_cover abstopleft"></div>
        <div class="lightness_cover abstopleft"></div>
        <div class=ls_cursor></div>
      </div>
      <div class=a_picker><div class=gradient></div><div class=a_cursor></div></div>
      <div class=h_picker><div class=h_cursor></div></div>
    </div>
  `;
  window.customElements.define("mm-color-picker", class extends HTMLElement {
    constructor() {
      super();
      this.saturation_ = 0;
      this.lightness_ = 1;
    }

    connectedCallback() {
      if (this.shadowRoot)
        return;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>${style}</style>
        <body>${body}</body>`;

      this.registerEventHandlers_();
    }

    registerEventHandlers_() {
      const hpicker = this.shadowRoot.querySelector(".h_picker");
      hpicker.setAttribute("draggable", true);
      hpicker.addEventListener("mousedown", (e) => { this.hPickerMouseDown_(e) });
      hpicker.addEventListener("dragstart", (e) => { this.hPickerDragStart_(e) });
      hpicker.addEventListener("drag", (e) => { this.hPickerDrag_(e) });
      hpicker.addEventListener("dragend", (e) => { this.hPickerDragEnd_(e) });
      hpicker.addEventListener("dragover", (e) => { e.preventDefault() });
    }

    hPickerMouseDown_(e) {
      this.adjustHCursor_(e.clientX);
      e.stopPropagation();
    }
    hPickerDragStart_(e) {
      Workarounds.mouseTracker.dragPoint = [e.clientX, e.clientY];
      e.stopPropagation();
      e.dataTransfer.setDragImage(new Image(), 0, 0);
      //this.adjustHCursor_(e.clientX);
    }
    hPickerDrag_(e) {
      let clientPoint;
      if (e.clientX == 0 && e.clientY == 0) {
        clientPoint = Workarounds.mouseTracker.dragPoint;
      } else {
        clientPoint = [e.clientX, e.clientY];
      }
      Workarounds.mouseTracker.dragPoint = [clientPoint[0], clientPoint[1]];
      this.adjustHCursor_(clientPoint[0]);
      e.stopPropagation();
    }
    hPickerDragEnd_(e) {
      e.stopPropagation();
    }
    adjustHCursor_(mouseX) {
      const rect = this.shadowRoot.querySelector(".h_picker").getBoundingClientRect();
      // x + 1 (for the border) + 1 for picker center
      const start = rect.x + 1 + 1;
      // x - 1 (for the border) - 1 for picker center - 1 for start of pixel?
      const end = rect.right - 1 - 1 - 1;
      let target;
      if (mouseX < start)
        target = start;
      else if (mouseX > end)
        target = end;
      else
        target = mouseX;

      this.shadowRoot.querySelector(".h_cursor").style.left = `${target - start}px`;
      this.adjustHue_((target - start) / (end - start));
    }
    adjustHue_(percent) {
      let r = 0;
      let g = 0;
      let b = 0;
      percent *= 100;
      if (percent <= 16.66) {
        r = 255;
        g = percent * 255 / 16.66;
      } else if (percent <= 33.33) {
        g = 255;
        r = (1 - (percent - 16.66) / 16.66) * 255;
      } else if (percent <= 50) {
        g = 255;
        b = 255 * (percent - 33.33) / 16.66;
      } else if (percent <= 66.66) {
        b = 255;
        g = (1 - (percent - 50) / 16.66) * 255;
      } else if (percent <= 83.33) {
        b = 255;
        r = 255 * (percent - 66.66) / 16.66;
      } else {
        console.assert(percent <= 100);
        r = 255;
        b = (1 - (percent - 83.33) / 16.66) * 255;
      }
      r = Math.min(Math.max(r, 0), 255);
      g = Math.min(Math.max(g, 0), 255);
      b = Math.min(Math.max(b, 0), 255);
      this.style.setProperty("--root-rgb", `${r}, ${g}, ${b}`);
      this.computeRgb_();
    }

    computeRgb_() {
      let rgb = this.style.getPropertyValue("--root-rgb").trim().split(", ");
      console.assert(rgb.length == 3);

      const s = this.saturation_;
      for (let i = 0; i < 3; ++i)
        rgb[0] = rgb[0] * s + 255 * (1 - s);

      const l = this.lightness_;
      for (let i = 0; i < 3; ++i)
        rgb[0] = rgb[0] * l;

      this.style.setProperty("--computed-rgb", `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
    }
  });
};

