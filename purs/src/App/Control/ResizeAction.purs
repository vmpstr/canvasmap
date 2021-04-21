module App.Control.ResizeAction where

import App.Prelude
import App.Data.NodeCommon (NodeId)
import Web.Event.Event (Event)
import Web.UIEvent.MouseEvent (MouseEvent)

data Action
  = StopPropagation Event Action
  | EWStart MouseEvent NodeId
  | MouseMove MouseEvent
  | MouseUp MouseEvent

instance actionShow :: Show Action where
  show (StopPropagation _ action) = "StopPropagation & " <> show action
  show (EWStart _ id) = "EWStart " <> show id
  show (MouseMove _) = "MouseMove"
  show (MouseUp _) = "MouseUp"