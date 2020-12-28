
let dragData = undefined;

function initDragEvents() {
  window.app.ports.portOnDragPointerDown.subscribe(onDragPointerDown);
  window.app.ports.portRafAlign.subscribe(onRafAlignRequest);
}

function onDragPointerDown(e) {
  document.body.addEventListener("pointermove", onDragPointerMove);
  document.body.addEventListener("pointerup", onDragPointerUp);
  dragData = {
    lastX: e.x,
    lastY: e.y,
    id: e.targetId,
    dragging: false
  };
}

function onDragPointerMove(e) {
  e.preventDefault();
  if (window.blockInput)
    return;

  const dx = e.clientX - dragData.lastX;
  const dy = e.clientY - dragData.lastY;

  if (!dragData.dragging) {
    const d2 = dx * dx + dy * dy;
    dragData.dragging = d2 >= 100;
    if (dragData.dragging) {
      dragData.lastX = e.clientX;
      dragData.lastY = e.clientY;

      const target_rect = document.getElementById(dragData.id).getBoundingClientRect();
      window.app.ports.portOnDragStart.send({
        targetId: dragData.id,
        geometry: {
          target: {
            position: { x: target_rect.x, y: target_rect.y },
            size: { x: target_rect.width, y: target_rect.height }
          }
        }
      });
    }
    return;
  }
  dragData.lastX = e.clientX;
  dragData.lastY = e.clientY;

  const target_rect = document.getElementById(dragData.id).getBoundingClientRect();
  window.app.ports.portOnDragBy.send({
    targetId: dragData.id,
    dx: dx,
    dy: dy,
    geometry: {
      target: {
        position: { x: target_rect.x, y: target_rect.y },
        size: { x: target_rect.width, y: target_rect.height }
      },
      beacons: getBeacons()
    }
  });
}

function getBeacons() {
  let result = []
  Array.from(document.getElementsByClassName("beacon")).forEach((e) => {
    const rect = e.getBoundingClientRect();
    result.push({
      path: e.getAttribute("path"),
      location: { x: rect.x, y: rect.y }
    });
  });
  return result;
}

function onDragPointerUp(e) {
  e.preventDefault();

  document.body.removeEventListener("pointermove", onDragPointerMove);
  document.body.removeEventListener("pointerup", onDragPointerUp);

  window.app.ports.portOnDragStop.send();
  dragData = undefined;
}

function onRafAlignRequest() {
  window.blockInput = true;
  requestAnimationFrame(() => {
    window.blockInput = false;
    // setTimeout for processing accumulated input?
  });
}
