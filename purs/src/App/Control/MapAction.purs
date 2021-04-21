module App.Control.MapAction where

import App.Prelude

import App.Control.NodeAction as NA
import App.Control.DragAction as DA
import App.Control.ResizeAction as RA

import Web.UIEvent.KeyboardEvent (KeyboardEvent, code)

data Action
  = NodeAction NA.Action
  | DragAction DA.Action
  | ResizeAction RA.Action
  | NewTopNode Boolean Int Int
  | HandleMapKeyPress KeyboardEvent

instance actionShow :: Show Action where
  show (NodeAction action) = "NodeAction " <> show action
  show (DragAction action) = "DragAction " <> show action
  show (ResizeAction action) = "ResizeAction " <> show action
  show (NewTopNode shift x y) = "NewTopNode " <> show shift <> " " <> show x <> " " <> show y
  show (HandleMapKeyPress ke) = "HandleKeyPress '" <> code ke <> "'"
