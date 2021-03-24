module Component.Map where

import App.Prelude
import App.Control.Drag as DragControl
import App.Control.Node as NodeControl
import App.Events.Node as NE
import App.Data.Map.Mode as MapMode
import App.Data.Map.Action as MapAction
import App.Data.Map.State as MapState
import App.Data.Map.ViewState (ViewState)
import App.Data.Node (Node, errorNode)
import App.Data.NodeCommon (NodeId, NodePath(..), nextId)
import App.Data.NodeClass (render)
import App.Events.Map as ME
import Capabilities.Logging as Log

import Component.Slots as Slots

import Data.List (toUnfoldable)
import Data.Map (values, lookup, filterKeys)
import Data.Tuple (Tuple(..))
import Data.Tuple as Tuple
import Data.Int (toNumber)
import Data.Array (filter, unsnoc, snoc)

import Web.Event.Event (preventDefault)
import Web.UIEvent.MouseEvent (clientX, clientY, shiftKey)
import Web.UIEvent.KeyboardEvent as KE
import Web.UIEvent.KeyboardEvent.EventTypes as KET
import Web.HTML (window)
import Web.HTML.Window (document)
import Web.HTML.HTMLDocument as HTMLDocument

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Halogen.Query.EventSource (eventListenerEventSource)

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input

renderMap :: forall m. MonadAff m => MapState.State -> HH.ComponentHTML MapAction.Action Slots.Slots m
renderMap state =
  let
    viewState = MapState.toInitialViewState state
    noParent :: NodeId -> Boolean
    noParent nodeId =
      (lookup nodeId state.relations.parents) == Nothing

    rootNodes :: Array Node
    rootNodes = toUnfoldable $ values (filterKeys noParent state.nodes)

    toNode :: NodeId -> Node
    toNode nodeId = fromMaybe (errorNode nodeId) $ lookup nodeId state.nodes

    getChildren :: NodeId -> Array Node
    getChildren nodeId =
      case lookup nodeId state.relations.children of
        Nothing -> []
        Just children -> toUnfoldable $ map toNode children

    renderChildren :: ViewState -> NodeId -> Array (HH.ComponentHTML MapAction.Action Slots.Slots m)
    renderChildren localViewState nodeId =
      case unsnoc $ getChildren nodeId of
        Just { init, last } ->
          snoc
            (map (render renderChildren localViewState { haveNextSibling = true }) init)
            (render renderChildren localViewState { haveNextSibling = false } last)
        Nothing -> []

    attributes =
      [ HP.ref (H.RefLabel "main-map")
      , HP.class_ (HH.ClassName "map")
      ] <> filterBySecond
            [ (ME.dragMoveHandler MapAction.DragAction) /\ (MapMode.isHookedToDrag state.mode)
            , (ME.dragStopHandler MapAction.DragAction) /\ (viewState.reactsToMouse || MapMode.isHookedToDrag state.mode)
            , (NE.selectHandler MapAction.NodeAction Nothing)             /\ viewState.reactsToMouse
            , (HE.onDoubleClick \e -> Just $ MapAction.NewTopNode (shiftKey e) (clientX e) (clientY e)) /\ viewState.reactsToMouse
            ]

  in
  HH.div
    attributes
    (map (render renderChildren viewState) rootNodes)

handleAction ::
  forall s o m.
  Log.Logger m => MonadAff m =>
  MapAction.Action -> H.HalogenM MapState.State MapAction.Action s o m Unit
handleAction action = do -- HalogenM
  Log.log Log.Debug $ "handling action: " <> show action
  case action of
    MapAction.Noop -> pure unit
    MapAction.Initialize -> do
      document <- liftEffect $ document =<< window
      void $ H.subscribe $
        eventListenerEventSource
          KET.keydown
          (HTMLDocument.toEventTarget document)
          \event -> map MapAction.HandleMapKeyPress $ KE.fromEvent event
    MapAction.NodeAction nodeAction -> do
      state <- H.get >>= NodeControl.handleAction nodeAction
      H.modify_ $ const state
    MapAction.DragAction dragAction -> do
      state <- H.get >>= DragControl.handleAction dragAction
      H.modify_ $ const state
    MapAction.NewTopNode shift x y -> do
      H.modify_ \state ->
        let
          x' = toNumber x - 40.0
          y' = toNumber y - 20.0
          id = nextId state.maxId
          state' = NodeControl.newNode id shift (Top $ Tuple x' y') state
        in
        state' { maxId = id, selected = Just id, mode = MapMode.Editing id }
    MapAction.HandleMapKeyPress ke
      | KE.code ke == "Tab" -> do
        liftEffect $ preventDefault $ KE.toEvent ke
        state <- H.get
        state.selected # traverse_ \id ->
          H.modify_ \_ -> do
            let newId = nextId state.maxId
            let state' = NodeControl.newNode newId (KE.shiftKey ke) (FirstChild id) state
            state' { maxId = newId, selected = Just newId, mode = MapMode.Editing newId }
      | KE.code ke == "Enter" -> do
        liftEffect $ preventDefault $ KE.toEvent ke
        state <- H.get
        state.selected # traverse_ \id ->
          H.modify_ \_ -> do
            let newId = nextId state.maxId
            let state' = NodeControl.newNode newId (KE.shiftKey ke) (NextSibling id) state
            state' { maxId = newId, selected = Just newId, mode = MapMode.Editing newId }
      | otherwise -> pure unit

mkComponent ::
  forall q i o m.
  Log.Logger m => MonadAff m =>
  Unit -> H.Component HH.HTML q i o m
mkComponent _ =
  H.mkComponent
    { initialState: MapState.initialState
    , render: renderMap
    , eval: H.mkEval $ H.defaultEval { handleAction = handleAction, initialize = Just MapAction.Initialize }
    }
