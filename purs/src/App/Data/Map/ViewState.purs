module App.Data.Map.ViewState where

import App.Prelude
import App.Data.NodeCommon (NodeId)

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
