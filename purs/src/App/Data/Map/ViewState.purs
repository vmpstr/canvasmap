module App.Data.Map.ViewState where

import Data.Eq (class Eq)

data ParentState
  = NoParent
  | ShowParentEdge
  | HideParentEdge

derive instance parentStateEq :: Eq ParentState

type ViewState =
  { viewBeacons :: Boolean
  , shadow :: Boolean
  , parentState :: ParentState
  }

initialViewState :: ViewState
initialViewState =
  { viewBeacons: false
  , shadow: false
  , parentState: NoParent
  }