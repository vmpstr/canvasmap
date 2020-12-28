let ewData = undefined;
let nsData = undefined;

// Common
function finalizePointerUp() {
  requestAnimationFrame(() => {
    const targetId = ewData ? ewData.targetId : nsData.targetId;
    const rect = document.getElementById(targetId).getBoundingClientRect();

    if (ewData && Math.round(ewData.lastWidth) > rect.width)
      window.app.ports.portOnMaxWidthChanged.send({ targetId: targetId });
    if (nsData && Math.round(nsData.lastHeight) > rect.height)
      window.app.ports.portOnMaxHeightChanged.send({ targetId: targetId });

    window.app.ports.portOnResizeEnd.send();

    ewData = undefined;
    nsData = undefined;
  });
}

function initResizers() {
  window.app.ports.portOnEwResizePointerDown.subscribe(onEwResizePointerDown);
  window.app.ports.portOnNsResizePointerDown.subscribe(onNsResizePointerDown);
  window.app.ports.portOnNsewResizePointerDown.subscribe(onNsewResizePointerDown);
}

// EW resizing
function onEwResizePointerDown(e) {
  document.body.addEventListener("pointermove", onEwResizePointerMove);
  document.body.addEventListener("pointerup", onEwResizePointerUp);
  initEwResizeData(e);
}

function initEwResizeData(e) {
  const target = document.getElementById(e.targetId);
  const rect = target.getBoundingClientRect();

  ewData = {
    targetId: e.targetId,
    lastX: e.x,
    lastWidth: rect.width
  };
}

function onEwResizePointerMove(e) {
  e.preventDefault();
  if (window.blockInput)
    return;

  const dx = e.clientX - ewData.lastX;
  ewData.lastX = e.clientX;

  const newWidth = ewData.lastWidth + dx;
  ewData.lastWidth = newWidth;

  window.app.ports.portOnMaxWidthChanged.send({
    targetId: ewData.targetId,
    value: Math.max(0, newWidth)
  });
}

function onEwResizePointerUp(e) {
  e.preventDefault();
  document.body.removeEventListener("pointermove", onEwResizePointerMove);
  document.body.removeEventListener("pointerup", onEwResizePointerUp);
  finalizePointerUp();
}

// NS resizing
function onNsResizePointerDown(e) {
  document.body.addEventListener("pointermove", onNsResizePointerMove);
  document.body.addEventListener("pointerup", onNsResizePointerUp);
  initNsResizeData(e);
}

function initNsResizeData(e) {
  const target = document.getElementById(e.targetId);
  const rect = target.getBoundingClientRect();

  nsData = {
    targetId: e.targetId,
    lastY: e.y,
    lastHeight: rect.height
  };
}

function onNsResizePointerMove(e) {
  e.preventDefault();
  if (window.blockInput)
    return;

  const dy = e.clientY - nsData.lastY;
  nsData.lastY = e.clientY;

  const newHeight = nsData.lastHeight + dy;
  nsData.lastHeight = newHeight;

  window.app.ports.portOnMaxHeightChanged.send({
    targetId: nsData.targetId,
    value: Math.max(0, newHeight)
  });
}

function onNsResizePointerUp(e) {
  e.preventDefault();
  document.body.removeEventListener("pointermove", onNsResizePointerMove);
  document.body.removeEventListener("pointerup", onNsResizePointerUp);
  finalizePointerUp();
}

// NSEW resizing
function onNsewResizePointerDown(e) {
  document.body.addEventListener("pointermove", onNsewResizePointerMove);
  document.body.addEventListener("pointerup", onNsewResizePointerUp);
  initEwResizeData(e);
  initNsResizeData(e);
}

function onNsewResizePointerMove(e) {
  onEwResizePointerMove(e);
  onNsResizePointerMove(e);
}

function onNsewResizePointerUp(e) {
  e.preventDefault();
  document.body.removeEventListener("pointermove", onNsewResizePointerMove);
  document.body.removeEventListener("pointerup", onNsewResizePointerUp);
  finalizePointerUp();
}
