module App.Data.Map.ViewState where

import App.Data.NodeCommon (NodeId)

import Data.Eq (class Eq)
import Data.Maybe (Maybe)

data ParentState
  = NoParent
  | ShowParentEdge
  | HideParentEdge

derive instance parentStateEq :: Eq ParentState

type ViewState =
  { viewBeacons :: Boolean
  , shadow :: Boolean
  , parentState :: ParentState
  , selected :: Maybe NodeId
  }
