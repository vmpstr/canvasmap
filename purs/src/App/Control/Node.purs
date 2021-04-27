module App.Control.Node where

import App.Prelude

import App.Control.StateChangeType as SCT
import App.Control.Drag as DCtl
import App.Control.Resize as RCtl
import App.Control.NodeAction (Action(..))
import App.Control.MapState (State)
import App.Control.MapMode as MapMode
import App.Data.NodeCommon (NodePath(..), NodePosition(..), NodeId)
import App.Data.Node (NodeType(..), constructNode, setLabel)
import Capabilities.Logging as Log

import Data.List (elemIndex, insertAt, (:), fromFoldable, filter, foldr)
import Data.Map as Map
import Data.Tuple (Tuple(..))

import Web.Event.Event (stopPropagation)

import Effect.Class (class MonadEffect)

handleAction :: forall m.
  Log.Logger m => MonadEffect m => MonadPlus m =>
  Action -> State -> m (Tuple State SCT.Type)
handleAction action state =
  case action of
    StopPropagation event next -> do
      liftEffect $ stopPropagation event
      handleAction next state
    DragAction da ->
      DCtl.handleAction da state
    ResizeAction ra ->
      RCtl.handleAction ra state
    Select selection ->
      pure (state { selected = selection } /\ SCT.Ephemeral)
    EditLabel id ->
      pure (state { mode = MapMode.Editing id } /\ SCT.Ephemeral)
    FinishEdit id value ->
      let
        nodes = Map.update (Just <<< flip setLabel value) id state.nodes
        -- Only switch to idle if we are editing this id. Things like Tab can switch
        -- to editing a different id before the FinishEdit message is processed.
        mode = if state.mode == MapMode.Editing id then MapMode.Idle else state.mode
      in
      pure (state { nodes = nodes, mode = mode } /\ SCT.Persistent)

nodeType :: Boolean -> NodeType
nodeType shift =
  if shift then
    ScrollerNodeType
  else
    TreeNodeType

deleteNode :: NodeId -> State -> State
deleteNode id state =
  let
    nodes = Map.delete id state.nodes
    childList = fromMaybe (fromFoldable []) (Map.lookup id state.relations.children)
    children = Map.delete id state.relations.children
    popResult = Map.pop id state.relations.parents
  in
  case popResult of
    Just (parentId /\ parents) ->
      let
        -- Because of the work in this function, and the recursive fold below,
        -- this call may not actually invoke the update. In other words, even
        -- though we have a parentId, the parent may not have a children list
        -- anymore.
        children' = Map.update (Just <<< filter (_ /= id)) parentId children
        state' = state { nodes = nodes, relations { children = children', parents = parents }}
      in
      foldr deleteNode state' childList
    Nothing ->
      let
        state' = state { nodes = nodes, relations { children = children }}
      in
      foldr deleteNode state' childList

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
  fromMaybe' (\_ -> newNode id shift (FirstChild siblingId) state) do -- Maybe
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