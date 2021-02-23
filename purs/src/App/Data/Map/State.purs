module App.Data.Map.State where

import App.Prelude
import App.Data.Node (Node(..))
import App.Data.NodeCommon (NodeId(..), NodePosition(..))
import App.Data.NodeImpl.TreeNode (TreeNodeImpl(..))
import App.Data.Map.ViewState (ViewState, ParentState(..))
import App.Data.Map.Mode (Mode(..), isDrag, getDragNodeId, getClosestBeacon)

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
  { nodes: Map.insert (NodeId 1) (TreeNode $ TreeNodeImpl { id: NodeId 1, label: "Test", maxWidth: Nothing, position: (Absolute { x: 10.0, y: 20.0 }) }) Map.empty
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
  }