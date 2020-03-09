let initialized = false;
let App;
let Workarounds;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Workarounds = await import(`./workarounds.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  define();
}
const define = () => {
  const checker =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGX' +
    'RFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA0ppVFh0WE1MOmNvbS5hZG9iZS' +
    '54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3' +
    'prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9Ik' +
    'Fkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0Mi' +
    'AgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5Lz' +
    'AyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG' +
    '1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0Um' +
    'VmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bW' +
    'xuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SU' +
    'Q9InhtcC5kaWQ6RTc5MkU2MDQ2MDM2MTFFQUJCRDhCQThBQ0QyRjNDNjkiIHhtcE1NOkluc3' +
    'RhbmNlSUQ9InhtcC5paWQ6RTc5MkU2MDM2MDM2MTFFQUJCRDhCQThBQ0QyRjNDNjkiIHhtcD' +
    'pDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIj4gPHhtcE' +
    '1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcD' +
    'pjNDEyN2I1MS02MDM1LTExZWEtYWE2OS1hMjJjNDc3ZTZjZTUiIHN0UmVmOmRvY3VtZW50SU' +
    'Q9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjNDEyN2I1MS02MDM1LTExZWEtYWE2OS1hMjJjND' +
    'c3ZTZjZTUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ID' +
    'w/eHBhY2tldCBlbmQ9InIiPz4Jp6ghAAAABlBMVEX////MzMw46qqDAAAAF0lEQVR42mJghA' +
    'IGGBgggQG2HiYAEGAARRAAgR90vRgAAAAASUVORK5CYII=';

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
      user-select: none;
      grid-area: value;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
    }
    .value > .sample_holder {
      flex-grow: 1;
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

    .value > .rgba_text {
      font-weight: bold;
      padding-left: 4px;
      padding-bottom: 1px;
    }
    .value > .rgba_input {
      font-size: 10pt;
      width: 3em;
      user-select: auto;
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
      background: linear-gradient(to bottom, rgba(var(--computed-rgb), 1), rgba(var(--computed-rgb), 0));
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
        <div class=rgba_text>r=</div>
        <input id=input_r type=number min=0 max=255 class=rgba_input></input>
        <div class=rgba_text>g=</div>
        <input id=input_g type=number min=0 max=255 class=rgba_input></input>
        <div class=rgba_text>b=</div>
        <input id=input_b type=number min=0 max=255 class=rgba_input></input>
        <div class=rgba_text>a=</div>
        <input id=input_a type=number min=0 max=1 class=rgba_input></input>
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

  const direction = {
    kEW: 1,
    kNS: 2
  };

  // Need to reverse engineer from rgba specified.
  window.customElements.define("mm-color-picker", class extends HTMLElement {
    constructor() {
      super();
      this.saturation_ = 0;
      this.lightness_ = 1;
      this.clickHandledObserver_ = this.clickHandledObserver_.bind(this);
    }

    connectedCallback() {
      if (this.shadowRoot)
        return;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>${style}</style>
        <body>${body}</body>`;

      this.registerEventHandlers_();
      this.computeRgb_();
      this.adjustAlpha_(0);
    }

    registerEventHandlers_() {
      this.createPicker_(
        this.shadowRoot.querySelector(".h_picker"),
        this.shadowRoot.querySelector(".h_cursor"),
        { direction: direction.kEW,
          track_margin: 5 },
        (percent) => this.adjustHue_(percent));

      this.createPicker_(
        this.shadowRoot.querySelector(".a_picker"),
        this.shadowRoot.querySelector(".a_cursor"),
        { direction: direction.kNS,
          track_margin: 5 },
        (percent) => this.adjustAlpha_(percent));

      this.createPicker_(
        this.shadowRoot.querySelector(".ls_picker"),
        this.shadowRoot.querySelector(".ls_cursor"),
        { direction: direction.kNS | direction.kEW,
          track_margin: 2 },
        (percents) => this.adjustSaturationLightness_(percents));

      // Don't dismiss on self clicks.
      this.shadowRoot.addEventListener("click", (e) => {
        App.mouseTracker.handledClick(this, e);
      });

      // Except the sample.
      // TODO(vmpstr): Open recent colors / swatches instead.
      const sample = this.shadowRoot.querySelector(".sample");
      sample.addEventListener("click", (e) => {
        App.mouseTracker.handledClick(sample, e);
      });

      App.mouseTracker.registerClickObserver(this.clickHandledObserver_);
    }

    clickHandledObserver_(object, e) {
      // Don't dismiss on self clicks.
      if (object == this)
        return;
      App.mouseTracker.removeClickObserver(this.clickHandledObserver_);
      this.remove();
    }

    createPicker_(picker, cursor, opts, callback) {
      this.registerPicker_(
        picker,
        (x, y) => this.adjustCursor_([x, y], picker, cursor, opts, callback));
    }

    registerPicker_(picker, callback) {
      picker.setAttribute("draggable", true);
      picker.addEventListener("mousedown", e => this.pickerMouseDown_(e, callback));
      picker.addEventListener("dragstart", e => this.pickerDragStart_(e, callback));
      picker.addEventListener("drag", e => this.pickerDrag_(e, callback));
      picker.addEventListener("dragend", e => this.pickerDragEnd_(e, callback));
      picker.addEventListener("dragover", e => e.preventDefault());
    }

    pickerMouseDown_(e, adjust) {
      adjust(e.clientX, e.clientY);
      e.stopPropagation();
    }
    pickerDragStart_(e, adjust) {
      Workarounds.mouseTracker.dragPoint = [e.clientX, e.clientY];
      e.stopPropagation();
      e.dataTransfer.setDragImage(new Image(), 0, 0);
      adjust(e.clientX, e.clientY);
    }
    pickerDrag_(e, adjust) {
      let clientPoint;
      if (e.clientX == 0 && e.clientY == 0) {
        clientPoint = Workarounds.mouseTracker.dragPoint;
      } else {
        clientPoint = [e.clientX, e.clientY];
      }
      Workarounds.mouseTracker.dragPoint = [clientPoint[0], clientPoint[1]];
      adjust(clientPoint[0], clientPoint[1]);
      e.stopPropagation();
    }
    pickerDragEnd_(e) {
      e.stopPropagation();
    }

    adjustCursor_(p, picker, cursor, opts, callback) {
      const rect = picker.getBoundingClientRect();
      const percents = [];
      if (opts.direction & direction.kEW) {
        let start = rect.x;
        let end = rect.right - opts.track_margin;
        let x = Math.min(Math.max(p[0], start), end);
        percents.push(100 * (x - start) / (end - start));
        cursor.style.left = `${x - start}px`;
      }
      if (opts.direction & direction.kNS) {
        let start = rect.y;
        let end = rect.bottom - opts.track_margin;
        let y = Math.min(Math.max(p[1], start), end);
        percents.push(100 * (y - start) / (end - start));
        cursor.style.top = `${y - start}px`;
      }
      callback(percents.length == 1 ? percents[0] : percents);
    }

    adjustHue_(percent) {
      let r = 0;
      let g = 0;
      let b = 0;
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

    adjustAlpha_(percent) {
      let a = 1 - Math.min(Math.max(percent / 100, 0), 1);
      this.style.setProperty("--root-alpha", `${a}`);
      this.shadowRoot.querySelector("#input_a").value = a;
    }

    adjustSaturationLightness_(percents) {
      this.saturation_ = percents[0] / 100;
      this.lightness_ = 1 - (percents[1] / 100);
      this.computeRgb_();
    }

    computeRgb_() {
      let rgb = getComputedStyle(this).getPropertyValue("--root-rgb").trim().split(", ");
      console.assert(rgb.length == 3);

      const s = this.saturation_;
      for (let i = 0; i < 3; ++i)
        rgb[i] = rgb[i] * s + 255 * (1 - s);

      const l = this.lightness_;
      for (let i = 0; i < 3; ++i)
        rgb[i] = rgb[i] * l;

      for (let i = 0; i < 3; ++i)
        rgb[i] = Math.round(rgb[i]);

      this.style.setProperty("--computed-rgb", `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
      this.shadowRoot.querySelector("#input_r").value = rgb[0];
      this.shadowRoot.querySelector("#input_g").value = rgb[1];
      this.shadowRoot.querySelector("#input_b").value = rgb[2];
    }
  });
};

