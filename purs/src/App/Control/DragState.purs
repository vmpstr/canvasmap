module App.Control.DragState where

import App.Prelude
import App.Data.NodeCommon (NodeId, NodePath)

import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY)

data DragMode
  = Hooked Number
  | Dragging

derive instance eqDragMode :: Eq DragMode
derive instance genericDragMode :: Generic DragMode _
instance showDragMode :: Show DragMode where show = genericShow
instance encodeDragMode :: EncodeJson DragMode where encodeJson = genericEncodeJson
instance decodeDragMode :: DecodeJson DragMode where decodeJson = genericDecodeJson

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