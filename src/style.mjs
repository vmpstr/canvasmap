export function initialize() {}

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
