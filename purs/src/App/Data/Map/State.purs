module App.Data.Map.State where

import App.Data.Node (Node(..), NodeId(..), NodePosition(..))
import App.Data.NodeImpl.TreeNode
import App.Data.Map.ViewState (ViewState, ParentState(..))

import Data.List (List)
import Data.Map (Map)
import Data.Map as Map
import Data.Function (($))
import Data.Maybe (Maybe(..))

data Mode
  = Idle
  | Drag

type State =
  { nodes :: Map NodeId Node
  , relations ::
      { children :: Map NodeId (List NodeId)
      , parents :: Map NodeId NodeId
      }
  , selected :: Maybe NodeId
  , mode :: Mode
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
  }

isDrag :: Mode -> Boolean
isDrag Drag = true
isDrag _ = false

toInitialViewState :: State -> ViewState
toInitialViewState state =
  { viewBeacons: isDrag state.mode
  , shadow: false
  , parentState: NoParent
  , selected: state.selected
  }