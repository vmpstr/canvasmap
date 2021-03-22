module App.Control.DragAction where

import App.Prelude
import App.Data.NodeCommon (NodeId)
import Web.UIEvent.MouseEvent (MouseEvent)
import Web.Event.Event (Event)

data Action
  = StopPropagation Event Action
  | MouseDown MouseEvent NodeId

instance actionShow :: Show Action where
  show (StopPropagation _ action) = "StopPropagation & " <> show action
  show (MouseDown _ id) = "MouseDown " <> show id