module App.Data.Map.Mode where

import App.Prelude
import App.Control.DragState as Drag

data Mode
  = Idle
  | Drag Drag.State

isDrag :: Mode -> Boolean
isDrag (Drag _) = true
isDrag _ = false

instance modeShow :: Show Mode where
  show Idle = "Idle"
  show (Drag dragState) = "Drag (" <> show dragState.state <> ")"
