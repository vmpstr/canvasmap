let ewData = undefined;
let nsData = undefined;

// EW resizing
function onEwResizePointerDown(e) {
  document.body.addEventListener("pointermove", onEwResizePointerMove);
  document.body.addEventListener("pointerup", onEwResizePointerUp);
  const target = document.getElementById(e.targetId);
  const rect = target.getBoundingClientRect();

  // This is not a good way to do this.
  const style = target.getAttribute("style");
  target.setAttribute("style", "");
  const unboundRect = target.getBoundingClientRect();
  target.setAttribute("style", style);

  ewData = {
    targetId: e.targetId,
    lastX: e.x,
    lastWidth: rect.width,
    unboundWidth: unboundRect.width
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
  if (newWidth >= ewData.unboundWidth) {
    window.app.ports.portOnMaxWidthChanged.send({
      targetId: ewData.targetId
    });
  } else {
    window.app.ports.portOnMaxWidthChanged.send({
      targetId: ewData.targetId,
      value: Math.max(0, newWidth)
    });
  }
}

function onEwResizePointerUp(e) {
  e.preventDefault();
  document.body.removeEventListener("pointermove", onEwResizePointerMove);
  document.body.removeEventListener("pointerup", onEwResizePointerUp);
  ewData = undefined;
}

// NS resizing
function onNsResizePointerDown(e) {
  document.body.addEventListener("pointermove", onNsResizePointerMove);
  document.body.addEventListener("pointerup", onNsResizePointerUp);
  const target = document.getElementById(e.targetId);
  const rect = target.getBoundingClientRect();

  // This is not a good way to do this.
  const style = target.getAttribute("style");
  target.setAttribute("style", "");
  const unboundRect = target.getBoundingClientRect();
  target.setAttribute("style", style);

  nsData = {
    targetId: e.targetId,
    lastY: e.y,
    lastHeight: rect.height,
    unboundHeight: unboundRect.height
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
  if (newHeight >= nsData.unboundHeight) {
    window.app.ports.portOnMaxHeightChanged.send({
      targetId: nsData.targetId
    });
  } else {
    window.app.ports.portOnMaxHeightChanged.send({
      targetId: nsData.targetId,
      value: Math.max(0, newHeight)
    });
  }
}

function onNsResizePointerUp(e) {
  e.preventDefault();
  document.body.removeEventListener("pointermove", onNsResizePointerMove);
  document.body.removeEventListener("pointerup", onNsResizePointerUp);
  nsData = undefined;
}

function initResizers() {
  window.app.ports.portOnEwResizePointerDown.subscribe(onEwResizePointerDown);
  window.app.ports.portOnNsResizePointerDown.subscribe(onNsResizePointerDown);
}