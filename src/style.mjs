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
const customVariables = [
  {
    name: "--user-background",
    default: {
      node: "transparent",
      scroller: "transparent"
    }
  },
  {
    name: "--user-border-radius",
    default: {
      node: "10px",
      scroller: "10px"
    }
  },
  {
    name: "--user-border",
    default: {
      node: "1px solid black",
      scroller: "1px solid black"
    }
  }
];

export function customVariablesInitialization(type) {
  let result = ":host {\n";
  for(let i = 0; i < customVariables.length; ++i)
    result += `${customVariables[i].name}: ${customVariables[i].default[type]};\n`;
  result += "}\n";
  return result;
}
