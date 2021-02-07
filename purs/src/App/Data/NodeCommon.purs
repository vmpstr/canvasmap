module App.Data.NodeCommon where

import Data.Eq (class Eq)
import Data.Ord (class Ord)
import Data.Show (class Show)

newtype NodeId = NodeId Int
derive newtype instance nodeIdEq :: Eq NodeId
derive newtype instance nodeIdOrd :: Ord NodeId
derive newtype instance nodeIdShow :: Show NodeId

data NodePosition
  = Absolute { x :: Number, y :: Number }
  | Static
