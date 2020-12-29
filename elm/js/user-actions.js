function onEditLabel(e) {
  // raf since we could be just attaching the node.
  requestAnimationFrame(() => {
    document.getElementById(e.targetId).querySelector("node-label").edit();
  });
}

function onNodeSelected(e) {
  // Since we could have just created the node, defer until
  // DOM actually reflects the new state.
  requestAnimationFrame(() => {
    const target = document.getElementById(e.targetId);
    if (target)
      target.scrollIntoViewIfNeeded();
  });
}

function initUserActions() {
  window.app.ports.portEditLabel.subscribe(onEditLabel);
  window.app.ports.portNodeSelected.subscribe(onNodeSelected);

  document.addEventListener("keydown", (e) => {
    // TODO: Maybe filter based on what is handled?
    e.preventDefault();
    window.app.ports.portOnKeyDown.send({ code: e.code });
  })
}