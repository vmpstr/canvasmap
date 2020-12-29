const kStateVersion = "3"

function initMemento() {
  window.app.ports.portSaveState.subscribe(saveState);
  window.app.ports.portLoadState.subscribe(loadState);
}

function saveState(nodes) {
  localStorage.setItem("mm-version", kStateVersion);
  localStorage.setItem("mm-nodes", JSON.stringify(nodes));
}

function loadState() {
  const version = localStorage.getItem("mm-version");
  if (!version || version !== kStateVersion) {
    window.app.ports.portOnLoadState.send([]);
    return;
  }
  const nodes = JSON.parse(localStorage.getItem("mm-nodes"));
  window.app.ports.portOnLoadState.send(nodes);
}