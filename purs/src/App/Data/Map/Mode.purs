module App.Data.Map.Mode where

import App.Data.NodeCommon (NodeId)

data Mode
  = Idle
  | Drag NodeId

isDrag :: Mode -> Boolean
isDrag (Drag _) = true
isDrag _ = false
