export function createNode(type, map) {
  console.assert(map);
  let node;
  if (type == "node")
    node = document.createElement("mm-node");
  else if (type == "scroller")
    node = document.createElement("mm-scroller-node");
  else {
    console.error("unknown type: " + type);
  }
  node.map = map;
  return node;
}

export function addNode(type, parent, map) {
  const node = createNode(type, map);
  node.setParent(parent);
  parent.appendChild(node);
  return node;
}

export function isKnownTag(tag) {
  return tag && tag.startsWith("MM-");
}

export function childOrdinal(child, parent) {
  const children = parent.children;
  if (!parent || !children || !children.length)
    return -1;

  for (let i = 0; i < children.length; ++i) {
    if (children[i] == child)
      return i;
  }
  return -1;
}

export function similarTypes(type) {
  if (type == "node")
    return ["scroller"];
  else if (type == "scroller")
    return ["node"];
  console.error("unknown type: " + type);
}
