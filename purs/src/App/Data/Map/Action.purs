module App.Data.Map.Action where

import App.Prelude
import App.Data.NodeCommon (NodeId)

import Web.Event.Event (Event)
import Web.UIEvent.MouseEvent (MouseEvent)

data Action
  = Noop 
  | StopPropagation Event Action
  | PreventDefault Event Action
  | Select (Maybe NodeId)
  | NewTopNode Int Int
  | MouseUp MouseEvent
  | MouseDown MouseEvent NodeId
  | MouseMove MouseEvent
  | EditLabel NodeId
  | FinishEdit NodeId String

instance actionShow :: Show Action where
  show Noop = "Noop"
  show (StopPropagation _ action) = "StopPropagation & " <> show action
  show (PreventDefault _ action) = "PreventDefault & " <> show action
  show (Select maybeId) = "Select " <> show maybeId
  show (NewTopNode x y) = "NewTopNode " <> show x <> " " <> show y
  show (MouseUp _) = "MouseUp"
  show (MouseDown _ id) = "MouseDown " <> show id
  show (MouseMove _) = "MouseMove"
  show (EditLabel id) = "EditLabel " <> show id
  show (FinishEdit id value) = "FinishEdit " <> show id <> " " <> value

