module App.Control.Node where

import Data.Tuple (Tuple(..))
import Data.Map as Map

import App.Prelude
import App.Data.Map.State (State)
import App.Data.NodeCommon (NodePath(..), NodePosition(..), NodeId)
import App.Data.Node (NodeType(..), constructNode)

import Data.List (elemIndex, insertAt, (:), fromFoldable)

nodeType :: Boolean -> NodeType
nodeType shift =
  if shift then
    ScrollerNodeType
  else
    TreeNodeType

newNode :: NodeId -> Boolean -> NodePath -> State -> State
newNode id shift (Top (Tuple x y)) state =
  let
    position = Absolute { x, y }
    node = constructNode (nodeType shift) id position
    nodes = Map.insert id node state.nodes
  in
  state { nodes = nodes }
newNode id shift (NextSibling siblingId) state =
  let
    node = constructNode (nodeType shift) id Static
    nodes = Map.insert id node state.nodes
  in
  fromMaybe state do -- Maybe
    parentId <- Map.lookup siblingId state.relations.parents
    childList <- Map.lookup parentId state.relations.children
    siblingIndex <- elemIndex siblingId childList
    childList' <- insertAt (siblingIndex + 1) id childList
    let parents = Map.insert id parentId state.relations.parents
    let children = Map.insert parentId childList' state.relations.children
    pure $ state { nodes = nodes, relations { parents = parents, children = children }}
newNode id shift (FirstChild parentId) state =
  let
    node = constructNode (nodeType shift) id Static
    nodes = Map.insert id node state.nodes
    -- This is important not to do in a Maybe monad, since child list
    -- does not have to exist if it is empty.
    childList =
      id : (fromMaybe
              (fromFoldable [])
              (Map.lookup parentId state.relations.children))

    parents = Map.insert id parentId state.relations.parents
    children = Map.insert parentId childList state.relations.children
  in
  state { nodes = nodes, relations { parents = parents, children = children }}