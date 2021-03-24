module App.Data.Map.Action where

import App.Prelude

import App.Control.NodeAction as NA
import App.Control.DragAction as DA

import Web.UIEvent.KeyboardEvent (KeyboardEvent, code)

data Action
  = Noop 
  | Initialize
  | NodeAction NA.Action
  | DragAction DA.Action
  | NewTopNode Boolean Int Int
  | HandleMapKeyPress KeyboardEvent

instance actionShow :: Show Action where
  show Noop = "Noop"
  show Initialize = "Initialize"
  show (NodeAction action) = "NodeAction " <> show action
  show (DragAction action) = "DragAction " <> show action
  show (NewTopNode shift x y) = "NewTopNode " <> show shift <> " " <> show x <> " " <> show y
  show (HandleMapKeyPress ke) = "HandleKeyPress '" <> code ke <> "'"
