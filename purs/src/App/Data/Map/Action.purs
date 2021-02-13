module App.Data.Map.Action where

import App.Data.NodeCommon (NodeId)

import Data.Maybe (Maybe)
import Data.Show (class Show, show)
import Data.Semigroup ((<>))

import Web.Event.Event (Event)

data Action
  = Noop 
  | StopPropagation Event Action
  | Select (Maybe NodeId)

instance actionShow :: Show Action where
  show Noop = "Noop"
  show (StopPropagation event action) = "StopPropagation & " <> show action
  show (Select maybeId) = "Select " <> show maybeId

