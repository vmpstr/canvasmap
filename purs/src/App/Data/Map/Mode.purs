module App.Data.Map.Mode where

import App.Prelude
import App.Control.DragState as Drag
import App.Data.NodeCommon (NodeId)

data Mode
  = Idle
  | Drag Drag.State

isHookedToDrag :: Mode -> Boolean
isHookedToDrag (Drag _) = true
isHookedToDrag _ = false

isDrag :: Mode -> Boolean
isDrag (Drag state) | state.state == Drag.Dragging = true
isDrag _ = false


getDragNodeId :: Mode -> Maybe NodeId
getDragNodeId (Drag state) | state.state == Drag.Dragging = Just state.nodeId
getDragNodeId _ = Nothing

instance modeShow :: Show Mode where
  show Idle = "Idle"
  show (Drag dragState) = "Drag (" <> show dragState.state <> ")"
