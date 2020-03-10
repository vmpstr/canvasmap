export function initialize() {}

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

// --layout-direction: row | column
// --cross-direction: column | row
// --scroller-border: border shorthand
// --node-border: border shorthand
// 
const host = `
  display: flex;
  flex-direction: var(--layout-direction, "column");
  flex-shrink: 1;
`;

// constant classes:
// :host
// .container
// .label
// .child_area
//
const customVariables = {
  "--user-background": {
    default: {
      node: "transparent",
      scroller: "transparent"
    },
    selection_name: "background",
    description: "The background of the node."
  },
  "--user-border-radius": {
    default: {
      node: "10px",
      scroller: "10px"
    },
    selection_name: "border-radius",
    description: "The border radius of the node. This determines how much rounding to apply to the corners."
  },
  "--user-border": {
    default: {
      node: "1px solid black",
      scroller: "1px solid black"
    },
    selection_name: "border",
    description: "The border thickness style and color. Note that this refers to the unselected element's border"
  }
};

export function customVariablesInitialization(type) {
  let result = ":host {\n";
  for(let name in customVariables)
    result += `${name}: ${customVariables[name].default[type]};\n`;
  result += "}\n";
  return result;
}

export function getSelectionStylesForType(type) {
  let result = [];
  for(let name in customVariables) {
    result.push({
      name: name,
      selection_name: customVariables[name].selection_name,
      description: customVariables[name].description
    });
  }
  return result;
}
