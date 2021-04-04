module App.Control.DragState where

import App.Prelude
import App.Data.NodeCommon (NodeId, NodePath)

import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY)

data DragMode
  = Hooked Number
  | Dragging

instance showDragMode :: Show DragMode where
  show (Hooked n) = "Hooked " <> show n
  show Dragging = "Dragging"

instance encodeDragMode :: EncodeJson DragMode where
  encodeJson (Hooked n) = encodeJson { ctor: "Hooked", n: n } 
  encodeJson Dragging = encodeJson { ctor: "Dragging" }

derive instance eqDragMode :: Eq DragMode

type State =
  { nodeId :: NodeId
  , lastMouseX :: Number
  , lastMouseY :: Number
  , nodeXOffset :: Number
  , nodeYOffset :: Number
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