module App.Control.Map where

import App.Prelude
import App.Utils as Utils

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
import App.Events.Node as NE

import Component.Slots (Slots)

import Data.Array (unsnoc, snoc)
import Data.Map as Map
import Data.List as List

import Web.Event.Event (preventDefault)
import Web.UIEvent.KeyboardEvent as WKE
import Web.UIEvent.MouseEvent as WME

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

render :: forall m a. MonadAff m => (MA.Action -> a) -> MS.State -> HH.ComponentHTML a Slots m
render wrap state =
  let
    attributes = Utils.filterBySecond
      [ HP.ref (H.RefLabel "main-map")
          /\ true
      , HP.class_ (HH.ClassName "map")
          /\ true
      , (ME.dragMoveHandler $ wrap <<< MA.DragAction)
          /\ (MM.isHookedToDrag state.mode)
      , (ME.dragStopHandler $ wrap <<< MA.DragAction)
          /\ (viewState.reactsToMouse || MM.isHookedToDrag state.mode)
      , (NE.selectHandler (wrap <<< MA.NodeAction) Nothing)
          /\ viewState.reactsToMouse
      , (HE.onDoubleClick \e -> Just $ wrap $ MA.NewTopNode (WME.shiftKey e) (WME.clientX e) (WME.clientY e))
          /\ viewState.reactsToMouse
      ]

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

handleAction :: forall m. MonadAff m => MA.Action -> MS.State -> m MS.State
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
      pure state' { maxId = id, selected = Just id, mode = MM.Editing id }
    MA.HandleMapKeyPress ke
      | WKE.code ke == "Tab" -> do
        liftEffect $ preventDefault $ WKE.toEvent ke
        case state.selected of
          Just id -> 
            let
              newId = nextId state.maxId
              state' = NCtl.newNode newId (WKE.shiftKey ke) (FirstChild id) state
            in
            pure state' { maxId = newId, selected = Just newId, mode = MM.Editing newId }
          Nothing -> pure state
      | WKE.code ke == "Enter" -> do
        liftEffect $ preventDefault $ WKE.toEvent ke
        case state.selected of
          Just id ->
            let
              newId = nextId state.maxId
              state' = NCtl.newNode newId (WKE.shiftKey ke) (NextSibling id) state
            in
            pure state' { maxId = newId, selected = Just newId, mode = MM.Editing newId }
          Nothing -> pure state
      | otherwise -> pure state