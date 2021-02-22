module App.Control.Drag where

import App.Prelude
import App.Data.Beacon (Beacon)
import App.Data.Map.State as MapState
import App.Data.Map.Mode as Mode
import App.Data.NodeCommon (NodeId, NodePosition(..))
import App.Control.DragState as DragState
import App.Data.Node as Node

import Data.Map as Map

import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY)

onMouseDown :: MapState.State -> MouseEvent -> NodeId -> Number -> Number -> MapState.State
onMouseDown state event id xoffset yoffset =
  let
    dragState =
      { nodeId: id
      , lastMouseX: toNumber $ clientX event
      , lastMouseY: toNumber $ clientY event
      , state: DragState.Hooked 0.0 xoffset yoffset
      }
  in
  state { mode = Mode.Drag dragState }

getDragState :: MapState.State -> Maybe DragState.State
getDragState s =
  case s.mode of
    Mode.Drag state -> Just state
    _ -> Nothing

setDragState :: MapState.State -> DragState.State -> MapState.State
setDragState mstate dstate =
  mstate { mode = Mode.Drag dstate }

setNodePosition :: MapState.State -> NodeId -> Number -> Number -> MapState.State
setNodePosition state id x y =
  -- need to also promote to top level child
  state
    { nodes = Map.update
        (\node -> Just $ Node.setPosition node (Absolute { x, y }))
        id
        state.nodes
    }
  
moveNodePosition :: MapState.State -> NodeId -> Number -> Number -> MapState.State
moveNodePosition state id dx dy =
  state
    { nodes = Map.update
        (\node -> Just $ Node.moveAbsolutePosition node dx dy)
        id
        state.nodes
    }

onMouseMove :: MapState.State -> MouseEvent -> Array Beacon -> MapState.State
onMouseMove state event beacons = fromMaybe state do
  startingDragState <- getDragState state
  let dragData = DragState.toDragData startingDragState event
  let dragState =
        startingDragState
          { lastMouseX = startingDragState.lastMouseX + dragData.dx
          , lastMouseY = startingDragState.lastMouseY + dragData.dy
          }

  case dragState.state of
    DragState.Hooked n xo yo -> do
      let n' = n + (abs dragData.dx) + (abs dragData.dy)
      if n' > 10.0 then do
        let state' = setDragState state $ dragState { state = DragState.Dragging }
        pure $ setNodePosition state' dragState.nodeId (dragData.x + xo) (dragData.y + yo)
      else
        pure $ setDragState state $ dragState { state = DragState.Hooked n' xo yo }
    DragState.Dragging -> do
      let state' = setDragState state dragState
      pure $ moveNodePosition state' dragState.nodeId dragData.dx dragData.dy

onMouseUp :: MapState.State -> MouseEvent -> MapState.State
onMouseUp state event =
  if Mode.isDrag state.mode then
    state { mode = Mode.Idle }
  else
    state