module App.Data.Map.Action where

import App.Prelude
import App.Data.NodeCommon (NodeId)

import Web.Event.Event (Event)
import Web.UIEvent.MouseEvent (MouseEvent)
import Web.UIEvent.KeyboardEvent (KeyboardEvent, code)

data Action
  = Noop 
  | Initialize
  | StopPropagation Event Action
  | PreventDefault Event Action
  | Select (Maybe NodeId)
  | NewTopNode Boolean Int Int
  | MouseUp MouseEvent
  | MouseDown MouseEvent NodeId
  | MouseMove MouseEvent
  | EditLabel NodeId
  | FinishEdit NodeId String
  | HandleMapKeyPress KeyboardEvent

instance actionShow :: Show Action where
  show Noop = "Noop"
  show Initialize = "Initialize"
  show (StopPropagation _ action) = "StopPropagation & " <> show action
  show (PreventDefault _ action) = "PreventDefault & " <> show action
  show (Select maybeId) = "Select " <> show maybeId
  show (NewTopNode shift x y) = "NewTopNode " <> show shift <> " " <> show x <> " " <> show y
  show (MouseUp _) = "MouseUp"
  show (MouseDown _ id) = "MouseDown " <> show id
  show (MouseMove _) = "MouseMove"
  show (EditLabel id) = "EditLabel " <> show id
  show (FinishEdit id value) = "FinishEdit " <> show id <> " " <> value
  show (HandleMapKeyPress ke) = "HandleKeyPress '" <> code ke <> "'"
