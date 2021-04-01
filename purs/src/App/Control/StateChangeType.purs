module App.Control.StateChangeType where

import App.Prelude

data Type
  = NoChange
  | Ephemeral
  | Persistent

derive instance typeEq :: Eq Type