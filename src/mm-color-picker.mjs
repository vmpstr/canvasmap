let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
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

      --root-rgb: 0, 255, 0
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
      grid-gap: 4px;
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

    .ls_picker {
      border: 1px solid black;
      width: 100%;
      height: 100%;
      position: relative;
      grid-area: ls-picker;
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

    .a_picker {
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
    
    .h_picker {
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
  `;

  const body = `
    <div class=container>
      <div class=value>rgba</div>
      <div class=ls_picker>
        <div class="root_color abstopleft"></div>
        <div class="saturation_cover abstopleft"></div>
        <div class="lightness_cover abstopleft"></div>
      </div>
      <div class=a_picker><div class=gradient></div></div>
      <div class=h_picker></div>
    </div>
  `;
  window.customElements.define("mm-color-picker", class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      if (this.shadowRoot)
        return;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>${style}</style>
        <body>${body}</body>`;
    }
  });
};

