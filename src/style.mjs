// --layout-direction: row | column
// --cross-direction: column | row
// --scroller-border
// --node-border
const host = `
  display: flex;
  flex-direction: var(--layout-direction, "column");
  flex-shrink: 1;
`;

