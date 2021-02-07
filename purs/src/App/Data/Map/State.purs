module App.Data.Map.State where

import App.Data.Node (Node(..), NodeId(..), NodePosition(..))

import Data.List (List)
import Data.Map (Map)
import Data.Map as Map
import Data.Function (($))
import Data.Maybe (Maybe(..))
--
import App.Data.NodeImpl.TreeNode

type State =
  { nodes :: Map NodeId Node
  , relations ::
      { children :: Map NodeId (List NodeId)
      , parents :: Map NodeId NodeId
      }
  }

initialState :: forall input. input -> State
initialState _ = 
  { nodes: Map.insert (NodeId 1) (TreeNode $ TreeNodeImpl { id: NodeId 1, label: "Test", maxWidth: Nothing, position: Static }) Map.empty
  , relations:
      { children: Map.empty
      , parents: Map.empty
      }
  }