module Component.Map where

import App.Prelude
import App.Data.Beacon (Beacon(..))
import App.Control.Drag as DragControl
import App.Control.Node as NodeControl
import App.Data.Map.Mode as MapMode
import App.Data.Map.Action as MapAction
import App.Data.Map.State as MapState
import App.Data.Map.ViewState (ViewState)
import App.Data.Node (Node, errorNode)
import App.Data.NodeCommon (NodeId(..), NodePath(..), nextId)
import App.Data.NodeClass (render)
import Capabilities.Logging as Log

import Data.List (toUnfoldable)
import Data.Map (values, lookup, filterKeys)
import Data.Tuple (Tuple(..))
import Data.Tuple as Tuple
import Data.Int (toNumber, fromString)
import Data.Array (filter, catMaybes, (!!), unsnoc, snoc)
import Data.Traversable (traverse)
import Data.String (split, Pattern(..))
import Control.Bind (join, (>>=))

import Effect (Effect)
import Web.Event.Event (stopPropagation, preventDefault, target)
import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY, toEvent)
import Web.HTML.HTMLElement (toElement, DOMRect, fromEventTarget, getBoundingClientRect, fromElement, HTMLElement)
import Web.DOM.Element (getAttribute, Element, getElementsByClassName)
import Web.DOM.HTMLCollection (toArray)

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input

renderMap :: forall slots m. MapState.State -> HH.ComponentHTML MapAction.Action slots m
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

    renderChildren :: ViewState -> NodeId -> Array (HH.ComponentHTML MapAction.Action slots m)
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
    mhtmlElement = do -- Maybe
      targetElement <- target $ toEvent mouseEvent
      fromEventTarget targetElement
  in
  case mhtmlElement of
    Just htmlElement -> getBoundingClientRect htmlElement
    Nothing -> pure emptyDOMRect

beaconPathToNodePath :: String -> Maybe NodePath
beaconPathToNodePath s = do -- Maybe
  let parts = split (Pattern "-") s
  pathType <- parts !! 0
  nodeId <- map NodeId (parts !! 1 >>= fromString)
  case pathType of
    "ns" -> pure $ NextSibling nodeId
    "fc" -> pure $ FirstChild nodeId
    _ -> Nothing
  
parseBeaconPath :: Element -> Effect (Maybe NodePath)
parseBeaconPath element = do -- Effect
  mpathAttribute <- getAttribute "path" element
  pure $ join $ map beaconPathToNodePath mpathAttribute

elementToBeacon :: HTMLElement -> Effect (Maybe Beacon)
elementToBeacon htmlElement = do -- Effect
  domRect <- getBoundingClientRect htmlElement
  let x = domRect.left + 0.5 * domRect.width
  let y = domRect.top + 0.5 * domRect.height
  mpath <- parseBeaconPath $ toElement htmlElement
  pure $ map (\path -> Beacon { x, y, path}) mpath


getBeaconRects :: HTMLElement -> Effect (Array Beacon)
getBeaconRects htmlRoot = do -- Effect
  beaconCollection <- getElementsByClassName "beacon" $ toElement htmlRoot
  beaconElementArray <- toArray beaconCollection
  map catMaybes $
    traverse (map join) $
    map (traverse elementToBeacon <<< fromElement) beaconElementArray

handleAction ::
  forall s o m.
  Log.Logger m => MonadAff m =>
  MapAction.Action -> H.HalogenM MapState.State MapAction.Action s o m Unit
handleAction action = do -- HalogenM
  -- Log.log Log.Debug $ "handling action: " <> show action
  case action of
    MapAction.Noop -> pure unit
    MapAction.MouseDown mouseEvent id -> do
      state <- H.get
      domRect <- liftEffect $ getEventTargetRect mouseEvent
      let
        xoffset = domRect.left - (toNumber $ clientX mouseEvent)
        yoffset = domRect.top - (toNumber $ clientY mouseEvent)
      H.modify_ $ const $ DragControl.onMouseDown state mouseEvent id xoffset yoffset
    MapAction.MouseMove mouseEvent -> do
      state <- H.get
      mhtmlMap <- H.getHTMLElementRef (H.RefLabel "main-map") 
      beacons <-
        liftEffect $ case mhtmlMap of
          Just htmlMap -> getBeaconRects htmlMap
          Nothing -> pure []
      when (MapMode.isHookedToDrag state.mode) $
        H.modify_ $ const $ DragControl.onMouseMove state mouseEvent beacons
    MapAction.MouseUp mouseEvent -> do
      state <- H.get
      when (MapMode.isHookedToDrag state.mode) $
        H.modify_ $ const $ DragControl.onMouseUp state mouseEvent
    MapAction.StopPropagation event nextAction -> do
      liftEffect $ stopPropagation event
      handleAction nextAction
    MapAction.PreventDefault event nextAction -> do
      liftEffect $ preventDefault event
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
  forall q i o m.
  Log.Logger m => MonadAff m =>
  Unit -> H.Component HH.HTML q i o m
mkComponent _ =
  H.mkComponent
    { initialState: MapState.initialState
    , render: renderMap
    , eval: H.mkEval $ H.defaultEval { handleAction = handleAction }
    }
