module App.Data.Map.Action where

import App.Prelude
import App.Data.NodeCommon (NodeId)

import App.Control.NodeAction as NA
import App.Control.DragAction as DA

import Web.Event.Event (Event)
import Web.UIEvent.MouseEvent (MouseEvent)
import Web.UIEvent.KeyboardEvent (KeyboardEvent, code)

data Action
  = Noop 
  | Initialize
  | StopPropagation Event Action
  | PreventDefault Event Action
  | NodeAction NA.Action
  | DragAction DA.Action
  | NewTopNode Boolean Int Int
  | MouseUp MouseEvent
  | MouseMove MouseEvent
  | FinishEdit NodeId String
  | HandleMapKeyPress KeyboardEvent

instance actionShow :: Show Action where
  show Noop = "Noop"
  show Initialize = "Initialize"
  show (StopPropagation _ action) = "StopPropagation & " <> show action
  show (PreventDefault _ action) = "PreventDefault & " <> show action
  show (NodeAction action) = "NodeAction " <> show action
  show (DragAction action) = "DragAction " <> show action
  show (NewTopNode shift x y) = "NewTopNode " <> show shift <> " " <> show x <> " " <> show y
  show (MouseUp _) = "MouseUp"
  show (MouseMove _) = "MouseMove"
  show (FinishEdit id value) = "FinishEdit " <> show id <> " " <> value
  show (HandleMapKeyPress ke) = "HandleKeyPress '" <> code ke <> "'"
