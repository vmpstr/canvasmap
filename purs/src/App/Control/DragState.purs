module App.Control.DragState where

import App.Prelude
import App.Data.NodeCommon (NodeId, NodePath)

import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY)

data DragMode
  = Hooked Number Number Number
  | Dragging

instance showDragMode :: Show DragMode where
  show (Hooked n _ _) = "Hooked " <> show n
  show Dragging = "Dragging"

derive instance eqDragMode :: Eq DragMode

type State =
  { nodeId :: NodeId
  , lastMouseX :: Number
  , lastMouseY :: Number
  , state :: DragMode
  , closestBeacon :: Maybe NodePath
  }

type DragData =
  { x :: Number
  , y :: Number
  , dx :: Number
  , dy :: Number
  }

toDragData :: State -> MouseEvent -> DragData
toDragData state event =
  let
    x = toNumber $ clientX event
    y = toNumber $ clientY event
  in
  { x: x
  , y: y
  , dx: x - state.lastMouseX
  , dy: y - state.lastMouseY
  }