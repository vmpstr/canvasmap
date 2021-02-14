module App.Data.Map.State where

import App.Prelude
import App.Data.Node (Node(..), NodeId(..), NodePosition(..))
import App.Data.NodeImpl.TreeNode (TreeNodeImpl(..))
import App.Data.Map.ViewState (ViewState, ParentState(..))

import Data.List (List)
import Data.Map (Map)
import Data.Map as Map

-- TODO(vmpstr): Move this to a separate file
data Mode
  = Idle
  | Drag NodeId

isDrag :: Mode -> Boolean
isDrag (Drag _) = true
isDrag _ = false

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
  , shadow: false
  , parentState: NoParent
  , selected: state.selected
  }