module App.Data.Map.Action where

import App.Prelude
import App.Data.NodeCommon (NodeId)

import Web.Event.Event (Event)

data Action
  = Noop 
  | StopPropagation Event Action
  | PreventDefault Event Action
  | Select (Maybe NodeId)
  | NewTopNode Int Int
  | MouseUp
  | MouseDown NodeId
  | MouseMove

instance actionShow :: Show Action where
  show Noop = "Noop"
  show (StopPropagation event action) = "StopPropagation & " <> show action
  show (PreventDefault event action) = "PreventDefault & " <> show action
  show (Select maybeId) = "Select " <> show maybeId
  show (NewTopNode x y) = "NewTopNode " <> show x <> " " <> show y
  show MouseUp = "MouseUp"
  show (MouseDown id) = "MouseDown " <> show id
  show MouseMove = "MouseMove"

