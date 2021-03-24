module App.Control.NodeAction where

import App.Prelude
import App.Data.NodeCommon (NodeId)
import Web.Event.Event (Event)

data Action
  = StopPropagation Event Action
  | Select (Maybe NodeId)
  | EditLabel NodeId
  | FinishEdit NodeId String

instance actionShow :: Show Action where
  show (StopPropagation _ action) = "StopPropagation & " <> show action
  show (Select mid) = "Select " <> show mid
  show (EditLabel id) = "EditLabel " <> show id
  show (FinishEdit id value) = "FinishEdit " <> show id <> " " <> value