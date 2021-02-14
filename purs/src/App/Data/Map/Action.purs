module App.Data.Map.Action where

import App.Prelude
import App.Data.NodeCommon (NodeId)

import Web.Event.Event (Event)

data Action
  = Noop 
  | StopPropagation Event Action
  | Select (Maybe NodeId)
  | NewTopNode Int Int
  | MouseUp

instance actionShow :: Show Action where
  show Noop = "Noop"
  show (StopPropagation event action) = "StopPropagation & " <> show action
  show (Select maybeId) = "Select " <> show maybeId
  show (NewTopNode x y) = "NewTopNode " <> show x <> " " <> show y
  show MouseUp = "MouseUp"

