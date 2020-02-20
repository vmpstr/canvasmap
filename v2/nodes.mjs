export function createNode(type, map) {
  console.assert(map);
  let node;
  if (type == "node")
    node = document.createElement("mm-node");
  else if (type == "scroller")
    node = document.createElement("mm-scroller-node");
  else {
    console.log(type);
    console.assert(false);
  }
  node.map = map;
  return node;
}

export function addNode(type, parent, map) {
  const node = createNode(type, map);
  parent.appendChild(node);
  return node;
}

export function isKnownTag(tag) {
  return tag.startsWith("MM-");
}
