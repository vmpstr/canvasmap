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

