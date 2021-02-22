module App.Data.Beacon where

import App.Prelude
import App.Data.NodeCommon (NodePath)

newtype Beacon = Beacon
  { path :: NodePath
  , x :: Number
  , y :: Number
  }

derive newtype instance showBeacon :: Show Beacon
