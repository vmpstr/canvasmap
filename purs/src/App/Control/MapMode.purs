module App.Control.MapMode where

import App.Prelude
import App.Control.DragState as Drag
import App.Data.NodeCommon (NodeId, NodePath)

data Mode
  = Idle
  | Drag Drag.State
  | Editing NodeId

derive instance modeEq :: Eq Mode
derive instance modeGeneric :: Generic Mode _

instance modeShow :: Show Mode where show = genericShow
instance modeEncode :: EncodeJson Mode where encodeJson = genericEncodeJson
instance modeDecode :: DecodeJson Mode where decodeJson = genericDecodeJson

isHookedToDrag :: Mode -> Boolean
isHookedToDrag (Drag _) = true
isHookedToDrag _ = false

isDrag :: Mode -> Boolean
isDrag (Drag state) | state.state == Drag.Dragging = true
isDrag _ = false

getDragNodeId :: Mode -> Maybe NodeId
getDragNodeId (Drag state) | state.state == Drag.Dragging = Just state.nodeId
getDragNodeId _ = Nothing

getClosestBeacon :: Mode -> Maybe NodePath
getClosestBeacon (Drag state) = state.closestBeacon
getClosestBeacon _ = Nothing

reactsToMouse :: Mode -> Boolean
reactsToMouse Idle = true
reactsToMouse mode@(Drag state) = isHookedToDrag mode && not isDrag mode
reactsToMouse _ = false

getEditNodeId :: Mode -> Maybe NodeId
getEditNodeId (Editing id) = Just id
getEditNodeId _ = Nothing
