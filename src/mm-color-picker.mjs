let initialized = false;
let App;
let Style;
let Workarounds;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Style = await import(`./style.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Workarounds = await import(`./workarounds.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  define();
}
const define = () => {
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
      background: url(${Style.checkerUrl}) repeat;
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
      background: url(${Style.checkerUrl}) repeat;
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
        <input id=input_a type=number min=0 max=1 step=0.01 class=rgba_input></input>
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

  const margins = {
    hue: 5,
    alpha: 5,
    ls: 2
  };

  // Need to reverse engineer from rgba specified.
  window.customElements.define("mm-color-picker", class extends HTMLElement {
    constructor() {
      super();
      this.saturation_ = 0;
      this.lightness_ = 1;
      this.clickHandledObserver_ = this.clickHandledObserver_.bind(this);
      this.callbacks_ = [];
      this.computed_rgba_ = [255, 255, 255, 1];
    }

    connectedCallback() {
      if (this.shadowRoot)
        return;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>${style}</style>
        <body>${body}</body>`;

      this.setRgbaNoNotify(this.computed_rgba_);
      this.registerEventHandlers_();
    }

    registerEventHandlers_() {
      this.createPicker_(
        this.shadowRoot.querySelector(".h_picker"),
        this.shadowRoot.querySelector(".h_cursor"),
        { direction: direction.kEW,
          track_margin: margins.hue },
        (percent) => this.adjustHue_(percent));

      this.createPicker_(
        this.shadowRoot.querySelector(".a_picker"),
        this.shadowRoot.querySelector(".a_cursor"),
        { direction: direction.kNS,
          track_margin: margins.alpha },
        (percent) => this.adjustAlpha_(percent));

      this.createPicker_(
        this.shadowRoot.querySelector(".ls_picker"),
        this.shadowRoot.querySelector(".ls_cursor"),
        { direction: direction.kNS | direction.kEW,
          track_margin: margins.ls },
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

      this.shadowRoot.querySelector("#input_r").addEventListener("input", () => this.updateFromInput_());
      this.shadowRoot.querySelector("#input_g").addEventListener("input", () => this.updateFromInput_());
      this.shadowRoot.querySelector("#input_b").addEventListener("input", () => this.updateFromInput_());
      this.shadowRoot.querySelector("#input_a").addEventListener("input", () => this.updateFromInput_());

      App.mouseTracker.registerClickObserver(this.clickHandledObserver_);
    }

    clickHandledObserver_(object, e) {
      // Don't dismiss on self clicks.
      if (object == this)
        return;
      App.mouseTracker.removeClickObserver(this.clickHandledObserver_);
      this.remove();
    }

    // picker ====================================================
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

    // picker setters ============================================
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
      this.updateComputedRgb__();
    }
    adjustAlpha_(percent) {
      let a = 1 - Math.min(Math.max(percent / 100, 0), 1);
      this.style.setProperty("--root-alpha", `${a}`);
      this.updateComputedAlpha_();
    }
    adjustSaturationLightness_(percents) {
      this.saturation_ = percents[0] / 100;
      this.lightness_ = 1 - (percents[1] / 100);
      this.updateComputedRgb__();
    }

    // compute and inputs updaters =====================================
    updateComputedAlpha_() {
      this.no_notify_scope_ = true;
      let a = this.style.getPropertyValue("--root-alpha").trim();
      this.shadowRoot.querySelector("#input_a").value = a;
      this.computed_rgba_[3] = a;
      delete this.no_notify_scope_;
      this.notifyChanged();
    }
    updateComputedRgb__() {
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

      this.no_notify_scope_ = true;
      this.style.setProperty("--computed-rgb", `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
      this.shadowRoot.querySelector("#input_r").value = rgb[0];
      this.shadowRoot.querySelector("#input_g").value = rgb[1];
      this.shadowRoot.querySelector("#input_b").value = rgb[2];
      this.computed_rgba_ = [rgb[0], rgb[1], rgb[2], this.computed_rgba_[3]]
      delete this.no_notify_scope_;
      this.notifyChanged();
    }

    // caller notifications ====================================
    notifyChanged() {
      if (this.no_notify_scope_)
        return;
      for (let i = 0; i < this.callbacks_.length; ++i)
        this.callbacks_[i](this.computed_rgba_);
    }
    onChange(callback) {
      this.callbacks_.push(callback);
    }

    setRgbaNoNotify(v) {
      this.no_notify_scope_ = true;
      this.computed_rgba_ = v;
      this.style.setProperty(
        "--computed-rgb",
        `${this.computed_rgba_[0]}, ${this.computed_rgba_[1]}, ${this.computed_rgba_[2]}`);

      if (this.shadowRoot) {
        this.shadowRoot.querySelector("#input_r").value = this.computed_rgba_[0];
        this.shadowRoot.querySelector("#input_g").value = this.computed_rgba_[1];
        this.shadowRoot.querySelector("#input_b").value = this.computed_rgba_[2];
        this.shadowRoot.querySelector("#input_a").value = this.computed_rgba_[3];
      }
      this.updateSlidersFromComputed_();
      delete this.no_notify_scope_;
    }
    setRgbaAndNotify(v) {
      this.setRgbaNoNotify(v);
      this.notifyChanged();
    }

    updateFromInput_() {
      if (this.no_notify_scope_)
        return;
      this.setRgbaAndNotify([
        this.shadowRoot.querySelector("#input_r").value,
        this.shadowRoot.querySelector("#input_g").value,
        this.shadowRoot.querySelector("#input_b").value,
        this.shadowRoot.querySelector("#input_a").value]);
    }

    updateSlidersFromComputed_() {
      let r = this.computed_rgba_[0];
      let g = this.computed_rgba_[1];
      let b = this.computed_rgba_[2];
      let a = this.computed_rgba_[3];

      let max = Math.max(r, g, b);
      let hue;
      if (max == 0) {
        this.saturation_ = 0;
        this.lightness_ = 0;
        r = 255;
        g = 0;
        b = 0;
        hue = this.huePercentFromRgb(r, g, b);
      } else {
        this.lightness_ = max / 255;
        r = Math.round(r / this.lightness_);
        g = Math.round(g / this.lightness_);
        b = Math.round(b / this.lightness_);

        console.assert(Math.max(r, g, b) == 255);
        let min = Math.min(r, g, b);
        if (min == 255) {
          this.saturation_ = 0;
          r = 255;
          g = 0;
          b = 0;
          hue = this.huePercentFromRgb(r, g, b);
        } else {
          this.saturation_ = 1 - min / 255;
          r = Math.round((r - (1 - this.saturation_) * 255) / this.saturation_);
          g = Math.round((g - (1 - this.saturation_) * 255) / this.saturation_);
          b = Math.round((b - (1 - this.saturation_) * 255) / this.saturation_);

          console.assert(Math.min(r, g, b) == 0);
          console.assert(Math.max(r, g, b) == 255);
          hue = this.huePercentFromRgb(r, g, b);
        }
      }

      this.style.setProperty("--root-alpha", `${a}`);
      this.style.setProperty("--root-rgb", `${r}, ${g}, ${b}`);
      this.setSlidersFromPercents(hue, 100 * a, 100 * this.lightness_, 100 * this.saturation_);
    }
    setSlidersFromPercents(hue, alpha, lightness, saturation) {
      if (!this.shadowRoot)
        return;

      const htrack = this.shadowRoot.querySelector(".h_picker").getBoundingClientRect().width - margins.hue;
      const atrack = this.shadowRoot.querySelector(".a_picker").getBoundingClientRect().height - margins.alpha;
      const strack = this.shadowRoot.querySelector(".ls_picker").getBoundingClientRect().width - margins.ls;
      const ltrack = this.shadowRoot.querySelector(".ls_picker").getBoundingClientRect().height - margins.ls;

      const hcursor = this.shadowRoot.querySelector(".h_cursor");
      const acursor = this.shadowRoot.querySelector(".a_cursor");
      const lscursor = this.shadowRoot.querySelector(".ls_cursor");

      hcursor.style.left = `${htrack * hue / 100}px`;
      acursor.style.top = `${atrack * (1 - alpha / 100)}px`;
      lscursor.style.left = `${strack * saturation / 100}px`;
      lscursor.style.top = `${ltrack * (1 - lightness / 100)}px`;
    }

    huePercentFromRgb(r, g, b) {
      console.assert(Math.min(r, g, b) == 0);
      console.assert(Math.max(r, g, b) == 255);

      if (r == 255 && b == 0) {
        return 16.66 * g / 255;
      } else if (g == 255 && b == 0) {
        return 16.66 + 16.66 * (1 - r / 255);
      } else if (g == 255 && r == 0) {
        return 33.33 + 16.66 * b / 255;
      } else if (b == 255 && r == 0) {
        return 50 + 16.66 * (1 - g / 255);
      } else if (b == 255 && g == 0) {
        return 66.66 + 16.66 * r / 255;
      } else {
        console.assert(r == 255 && g == 0);
        return 83.33 + 16.66 * (1 - b / 255);
      }
    }
  });
}

