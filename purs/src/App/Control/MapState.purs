module App.Control.MapState where

import App.Prelude
import App.Data.Node (Node)
import App.Data.NodeCommon (NodeId(..))
import App.View.ViewState (ViewState, ParentState(..))
import App.Control.MapMode (Mode(..), isDrag, getDragNodeId, getClosestBeacon, reactsToMouse, getEditNodeId)

import Data.List (List)
import Data.Map (Map)
import Data.Map as Map

type State =
  { nodes :: Map NodeId Node
  , relations ::
      { children :: Map NodeId (List NodeId)
      , parents :: Map NodeId NodeId
      }
  , selected :: Maybe NodeId
  , mode :: Mode
  , maxId :: NodeId
  }

initialState :: forall input. input -> State
initialState _ = 
  { nodes: Map.empty
  , relations:
      { children: Map.empty
      , parents: Map.empty
      }
  , selected: Nothing
  , mode: Idle
  , maxId: (NodeId 1)
  }

toInitialViewState :: State -> ViewState
toInitialViewState state =
  { viewBeacons: isDrag state.mode
  , dragged: getDragNodeId state.mode
  , parentState: NoParent
  , selected: state.selected
  , closestBeacon: getClosestBeacon state.mode
  , haveNextSibling: false
  , reactsToMouse: reactsToMouse state.mode
  , editing: getEditNodeId state.mode
  }