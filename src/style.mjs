let App
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  App = await import(`./app.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
}

export const checkerUrl =
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

export const classes = {
  kChildArea: "child_area",
  kHidden: "hidden"
};

export const selectors = {
  kChildArea: `.${classes.kChildArea}`,
  kHidden: `.${classes.kHidden}`
};

const descriptions = {
  "background":
    "The border radius of the node. This determines how much rounding to " +
    "apply to the corners.",
  "border-radius":
    "The border radius of the node. This determines how much rounding to " +
    "apply to the corners.",
  "border":
    "The border thickness style and color. Note that this refers to the " +
    "unselected element's border"
}

const theme = {
  "background" : {
    default: {
      node: "transparent",
      scroller: "transparent"
    }
  },
  "border-radius" : {
    default: {
      node: "10px",
      scroller: "10px"
    }
  },
  "border" : {
    default: {
      node: "1px solid rgba(0, 0, 0, 1)",
      scroller: "1px solid rgba(0, 0, 0, 1)"
    }
  }
};

export function themeVariables() {
  let result = ":host {\n";
  for (let name in theme) {
    for (let type in theme[name].default) {
      result += `--theme-${type}-${name}: ${theme[name].default[type]};\n`;
    }
  }
  result += "}\n";
  return result;
}

export function customVariablesInitialization(type) {
  let result = ":host {\n";
  for(let name in theme) {
    if (theme[name].default[type])
      result += `--self-${name}: initial;\n`;
  }
  for (let name in theme) {
    if (theme[name].default[type]) {
      result += `--effective-${name}: var(--self-${name}, var(--child-${name}, var(--theme-${type}-${name})));\n`;
    }
  }
  result += "}\n";
  return result;
}

export function getSelfCustomStylesForType(type) {
  let result = [];
  for(let name in theme) {
    if (theme[name].default[type]) {
      result.push({
        name: `--self-${name}`,
        selection_name: name,
        description: descriptions[name]
      });
    }
  }
  return result;
}

export function getAllBaseCustomStyles() {
  let result = [];
  for(let name in theme) {
    result.push({ name: name });
  }
  return result;
}


class Hunk {
  constructor(properties) {
    this.properties_ = properties;
  }

  applyTo(node) {
    App.undoStack.willChangeStyleHunk(node, Object.keys(this.properties_));
    for (let property in this.properties_)
      node.style.setProperty(property, this.properties_[property]);
    App.undoStack.didChangeStyle();
  }
}

export function selfStyleFrom(node) {
  const properties = getSelfCustomStylesForType(node.node_type);
  const dictionary = {};
  for (let i = 0; i < properties.length; ++i) {
    const base = properties[i].selection_name;
    dictionary[`--self-${base}`] = node.getSelfCustomStyle(base);
  }
  return new Hunk(dictionary);
}
