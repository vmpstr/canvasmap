module App.Control.Map where

import App.Prelude

import App.Control.StateChangeType as SCT
import App.Control.Node as NCtl
import App.Control.Drag as DCtl
import App.Control.MapAction as MA
import App.Control.MapState as MS
import App.Data.NodeCommon (NodeId, NodePath(..), nextId)
import App.Data.Node (Node, errorNode)
import App.View.ViewState (ViewState)
import App.Control.MapMode as MM
import App.Class.LayoutNode as NCls
import App.Events.Map as ME

import Capabilities.Logging as Log

import Component.Slots (Slots)

import Data.Array (unsnoc, snoc)
import Data.Map as Map
import Data.List as List

import Web.Event.Event (preventDefault)
import Web.UIEvent.KeyboardEvent as WKE

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP

render :: forall m a. MonadAff m => (MA.Action -> a) -> MS.State -> HH.ComponentHTML a Slots m
render wrap state =
  let
    attributes =
      [ HP.ref (H.RefLabel "main-map")
      , HP.class_ (HH.ClassName "map")
      ] <> ME.mapActionsForMode wrap state.mode

  in
  HH.div
    attributes
    (map (NCls.render nodeWrap renderChildren viewState) rootNodes)
  where
    viewState = MS.toInitialViewState state

    nodeWrap = wrap <<< MA.NodeAction

    noParent :: NodeId -> Boolean
    noParent nodeId =
      (Map.lookup nodeId state.relations.parents) == Nothing

    rootNodes :: Array Node
    rootNodes = List.toUnfoldable $ Map.values (Map.filterKeys noParent state.nodes)

    toNode :: NodeId -> Node
    toNode nodeId = fromMaybe (errorNode nodeId) $ Map.lookup nodeId state.nodes

    getChildren :: NodeId -> Array Node
    getChildren nodeId =
      case Map.lookup nodeId state.relations.children of
        Nothing -> []
        Just children -> List.toUnfoldable $ map toNode children

    renderChildren :: ViewState -> NodeId -> Array (HH.ComponentHTML a Slots m)
    renderChildren localViewState nodeId =
      case unsnoc $ getChildren nodeId of
        Just { init, last } ->
          snoc
            (map (NCls.render nodeWrap renderChildren localViewState { haveNextSibling = true }) init)
            (NCls.render nodeWrap renderChildren localViewState { haveNextSibling = false } last)
        Nothing -> []

handleAction :: forall m. MonadAff m => Log.Logger m => MA.Action -> MS.State -> m (Tuple MS.State SCT.Type)
handleAction action state =
  case action of
    MA.NodeAction na -> do
      NCtl.handleAction na state
    MA.DragAction da -> do
      DCtl.handleAction da state
    MA.NewTopNode shift x y -> do
      let x' = toNumber x - 40.0
      let y' = toNumber y - 20.0
      let id = nextId state.maxId
      let state' = NCtl.newNode id shift (Top $ Tuple x' y') state
      pure (state' { maxId = id, selected = Just id, mode = MM.Editing id } /\ SCT.Persistent)
    MA.HandleMapKeyPress ke
      | WKE.code ke == "Tab" -> do
        Log.log Log.Info $ " " <> (WKE.code ke)
        liftEffect $ preventDefault $ WKE.toEvent ke
        case state.selected of
          Just id -> 
            let
              newId = nextId state.maxId
              state' = NCtl.newNode newId (WKE.shiftKey ke) (FirstChild id) state
            in
            pure (state' { maxId = newId, selected = Just newId, mode = MM.Editing newId } /\ SCT.Persistent)
          Nothing -> pure (state /\ SCT.NoChange)
      | WKE.code ke == "Enter" -> do
        liftEffect $ preventDefault $ WKE.toEvent ke
        case state.selected of
          Just id ->
            let
              newId = nextId state.maxId
              state' = NCtl.newNode newId (WKE.shiftKey ke) (NextSibling id) state
            in
            pure (state' { maxId = newId, selected = Just newId, mode = MM.Editing newId } /\ SCT.Persistent)
          Nothing -> pure (state /\ SCT.NoChange)
      | WKE.code ke == "Delete" || WKE.code ke == "Backspace" -> do
        liftEffect $ preventDefault $ WKE.toEvent ke
        case state.selected of
          Just id ->
            let
              state' = NCtl.deleteNode id state
            in
            -- TODO(vmpstr): Should selected become the parent or something?
            pure (state' { selected = Nothing } /\ SCT.Persistent)
          Nothing -> pure (state /\ SCT.NoChange)
      | otherwise -> do
          Log.log Log.Info $ "unhandled keypress " <> (WKE.code ke)
          pure (state /\ SCT.NoChange)