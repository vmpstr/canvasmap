module Component.Map where

import App.Prelude
import App.Control.Drag as DragControl
import App.Control.Node as NodeControl
import App.Data.Map.Mode as MapMode
import App.Data.Map.Action as MapAction
import App.Data.Map.State as MapState
import App.Data.Map.ViewState (ViewState)
import App.Data.Node (Node, errorNode)
import App.Data.NodeCommon (NodeId, NodePath(..), nextId)
import App.Data.NodeClass (render)
import App.Monad (AppM)
import Capabilities.Logging as Log

import Data.List (toUnfoldable)
import Data.Map (values, lookup, filterKeys)
import Data.Tuple (Tuple(..))
import Data.Tuple as Tuple
import Data.Int (toNumber)
import Data.Array (filter)

import Effect (Effect)
import Web.Event.Event (stopPropagation, preventDefault, target)
import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY, toEvent)
import Web.HTML.HTMLElement (DOMRect, fromEventTarget, getBoundingClientRect)

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input

renderMap :: forall slots. MapState.State -> HH.HTML slots MapAction.Action
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

    renderChildren :: ViewState -> NodeId -> Array (HH.HTML slots MapAction.Action)
    renderChildren localViewState nodeId =
      map (render renderChildren localViewState) (getChildren nodeId)

    attributes =
      [ HP.class_ (HH.ClassName "map")
      , HE.onClick \_ -> Just $ MapAction.Select Nothing
      , HE.onMouseUp \event -> Just $ MapAction.MouseUp event
      , HE.onDoubleClick \e -> Just $ MapAction.NewTopNode (clientX e) (clientY e)
      ] <> filterBySecond
            [ Tuple (HE.onMouseMove \event -> Just $ MapAction.MouseMove event) (MapMode.isHookedToDrag state.mode)
            ]

  in
  HH.div
    attributes
    (map (render renderChildren viewState) rootNodes)

emptyDOMRect :: DOMRect
emptyDOMRect =
  { bottom: 0.0
  , height: 0.0
  , left: 0.0
  , right: 0.0
  , top: 0.0
  , width: 0.0
  }

getEventTargetRect :: MouseEvent -> Effect DOMRect
getEventTargetRect mouseEvent =
  let
    htmlElement = do
      targetElement <- target $ toEvent mouseEvent
      fromEventTarget targetElement
  in
  case htmlElement of
    Just element -> getBoundingClientRect element
    Nothing -> pure emptyDOMRect


{-
- EventSource for ResizeObserver-like behavior
- Slots for label edits
-}
handleAction ::
  forall s o.
  MapAction.Action
  -> H.HalogenM MapState.State MapAction.Action s o AppM Unit
handleAction action = do
  Log.log Log.Debug $ "handling action: " <> show action
  --s <- H.get
  --Log.log Log.Debug $ "state.mode " <> show s.mode
  case action of
    MapAction.Noop -> pure unit
    MapAction.MouseDown mouseEvent id -> do
      state <- H.get
      domRect <- H.liftEffect $ getEventTargetRect mouseEvent
      let
        xoffset = domRect.left - (toNumber $ clientX mouseEvent)
        yoffset = domRect.top - (toNumber $ clientY mouseEvent)
      H.modify_ $ const $ DragControl.onMouseDown state mouseEvent id xoffset yoffset
    MapAction.MouseMove mouseEvent -> do
      state <- H.get
      when (MapMode.isHookedToDrag state.mode) $
        H.modify_ $ const $ DragControl.onMouseMove state mouseEvent
    MapAction.MouseUp mouseEvent -> do
      state <- H.get
      when (MapMode.isHookedToDrag state.mode) $
        H.modify_ $ const $ DragControl.onMouseUp state mouseEvent
    MapAction.StopPropagation event nextAction -> do
      H.liftEffect $ stopPropagation event
      handleAction nextAction
    MapAction.PreventDefault event nextAction -> do
      H.liftEffect $ preventDefault event
      handleAction nextAction
    MapAction.Select selection -> do
      H.modify_ _ { selected = selection }
    MapAction.NewTopNode x y -> do
      H.modify_ \state ->
        let
          x' = toNumber x - 40.0
          y' = toNumber y - 20.0
          id = nextId state.maxId
          state' = NodeControl.newNode id (Top $ Tuple x' y') state
        in
        state' { maxId = id, selected = Just id }

mkComponent ::
  forall query input output.
  Unit
  -> H.Component HH.HTML query input output AppM
mkComponent _ =
  H.mkComponent
    { initialState: MapState.initialState
    , render: renderMap
    , eval: H.mkEval $ H.defaultEval { handleAction = handleAction }
    }
