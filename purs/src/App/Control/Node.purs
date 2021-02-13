module App.Control.Node where

import Data.Tuple (Tuple(..))
import Data.Map as Map

import App.Data.Map.State (State)
import App.Data.NodeCommon (NodePath(..), NodePosition(..), NodeId)
import App.Data.Node (NodeType(..), constructNode)

newNode :: NodeId -> NodePath -> State -> State
newNode id (Top (Tuple x y)) state =
  let
    position = Absolute { x, y }
    node = constructNode TreeNodeType id position
    nodes = Map.insert id node state.nodes
  in
  state { nodes = nodes }
newNode id (NextSibling siblingId) state = state
newNode id (FirstChild parentId) state = state