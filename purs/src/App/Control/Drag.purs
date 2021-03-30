module App.Control.Drag where

import App.Prelude
import App.Data.Beacon (Beacon(..))
import App.Control.MapState (State)
import App.Control.MapState as MapState
import App.Control.MapMode as MapMode
import App.Control.MapMode as Mode
import App.Data.NodeCommon (NodeId(..), NodePosition(..), NodePath(..))
import App.Control.DragState as DragState
import App.Data.Node as Node
import App.Control.DragAction (Action(..))

import Effect.Class (class MonadEffect)
import Effect (Effect)

import Data.Array (head, sortBy, (!!), catMaybes)
import Data.List (filter, fromFoldable, (:), elemIndex, insertAt)
import Math as Math
import Data.String (split, Pattern(..))
import Data.Int (toNumber, fromString)
import Control.Bind (join)
import Data.Traversable (traverse)

import Data.Map as Map

import Web.DOM.Element (getAttribute, Element, getElementsByClassName)
import Web.Event.Event (stopPropagation, target, currentTarget)
import Web.HTML.HTMLElement (HTMLElement, toElement, fromElement, DOMRect, fromEventTarget, getBoundingClientRect)
import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY, toEvent)
import Web.DOM.HTMLCollection (toArray)

handleAction :: forall m. MonadEffect m => Action -> State -> m State
handleAction action state =
  case action of
    StopPropagation event next -> do
      liftEffect $ stopPropagation event
      handleAction next state
    MouseDown mouseEvent id -> do
      domRect <- liftEffect $ getEventTargetRect mouseEvent
      let
        xoffset = domRect.left - (toNumber $ clientX mouseEvent)
        yoffset = domRect.top - (toNumber $ clientY mouseEvent)
      pure $ onMouseDown state mouseEvent id xoffset yoffset
    MouseUp mouseEvent -> do
      if MapMode.isHookedToDrag state.mode then
        pure $ onMouseUp state mouseEvent
      else
        pure state
    MouseMove mouseEvent -> do
      let
        mhtmlMap = (currentTarget $ toEvent mouseEvent) >>= fromEventTarget
      beacons <-
        liftEffect $ case mhtmlMap of
          Just htmlMap -> getBeaconRects htmlMap
          Nothing -> pure []
      if MapMode.isHookedToDrag state.mode then
        pure $ onMouseMove state mouseEvent beacons
      else
        pure state

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

getEventTargetRect :: forall m. MonadEffect m => MouseEvent -> m DOMRect
getEventTargetRect mouseEvent =
  let
    mhtmlElement = do -- Maybe
      targetElement <- target $ toEvent mouseEvent
      fromEventTarget targetElement
  in
  case mhtmlElement of
    Just htmlElement -> liftEffect $ getBoundingClientRect htmlElement
    Nothing -> pure emptyDOMRect

emptyDOMRect :: DOMRect
emptyDOMRect =
  { bottom: 0.0
  , height: 0.0
  , left: 0.0
  , right: 0.0
  , top: 0.0
  , width: 0.0
  }


onMouseDown :: State -> MouseEvent -> NodeId -> Number -> Number -> State
onMouseDown state event id xoffset yoffset =
  let
    dragState =
      { nodeId: id
      , lastMouseX: toNumber $ clientX event
      , lastMouseY: toNumber $ clientY event
      , nodeXOffset : xoffset
      , nodeYOffset : yoffset
      , state: DragState.Hooked 0.0
      , closestBeacon: Nothing
      }
  in
  state { mode = Mode.Drag dragState }

getDragState :: MapState.State -> Maybe DragState.State
getDragState s =
  case s.mode of
    Mode.Drag state -> Just state
    _ -> Nothing

setDragState :: MapState.State -> DragState.State -> MapState.State
setDragState mstate dstate =
  mstate { mode = Mode.Drag dstate }

setNodePosition :: MapState.State -> NodeId -> Number -> Number -> MapState.State
setNodePosition state id x y =
  state
    { nodes = Map.update
        (\node -> Just $ Node.setPosition node (Absolute { x, y }))
        id
        state.nodes
    }

resetNodePosition :: MapState.State -> NodeId -> MapState.State
resetNodePosition state id =
  state
    { nodes = Map.update
        (\node -> Just $ Node.setPosition node Static)
        id
        state.nodes
    }
  
moveNodePosition :: MapState.State -> NodeId -> Number -> Number -> MapState.State
moveNodePosition state id dx dy =
  state
    { nodes = Map.update
        (\node -> Just $ Node.moveAbsolutePosition node dx dy)
        id
        state.nodes
    }

type DistanceBeacon =
  { distance :: Number
  , path :: NodePath
  }

computeBeaconDistance :: Number -> Number -> Beacon -> DistanceBeacon
computeBeaconDistance x y (Beacon details) =
  let
    dx = details.x - x
    dy = details.y - y
  in
  { distance: Math.sqrt $ dx * dx + dy * dy
  , path: details.path
  }

findClosestBeacon :: Array Beacon -> Number -> Number -> Maybe NodePath
findClosestBeacon beacons x y =
  let
    distanceBeacons = map (computeBeaconDistance x y) beacons
    sorted = sortBy (\a b -> compare a.distance b.distance) distanceBeacons
  in
  case head sorted of
    Just beacon | beacon.distance < 50.0 -> Just beacon.path
    _ -> Nothing

onMouseMove :: MapState.State -> MouseEvent -> Array Beacon -> MapState.State
onMouseMove state event beacons = fromMaybe state do -- Maybe
  startingDragState <- getDragState state
  let dragData = DragState.toDragData startingDragState event
  let xo = startingDragState.nodeXOffset
  let yo = startingDragState.nodeYOffset
  let dragState =
        startingDragState
          { lastMouseX = dragData.x
          , lastMouseY = dragData.y
          , closestBeacon = findClosestBeacon beacons (dragData.x + xo) (dragData.y + yo)
          }

  pure $ case dragState.state of
    DragState.Hooked n ->
      let n' = n + (abs dragData.dx) + (abs dragData.dy) in
      if n' > 10.0 then
        let state' = setDragState state $ dragState { state = DragState.Dragging } in
        setNodePath state' dragState.nodeId $ Top $ Tuple (dragData.x + xo) (dragData.y + yo)
      else
        setDragState state $ dragState { state = DragState.Hooked n' }
    DragState.Dragging ->
      let state' = setDragState state dragState in
      moveNodePosition state' dragState.nodeId dragData.dx dragData.dy

-- TODO(vmpstr): This needs a refactor badly.
setNodePath :: MapState.State -> NodeId -> NodePath -> MapState.State
setNodePath state nodeId path =
  case path of
    Top (Tuple x y) ->
      let
        children = state.relations.children
        parents = state.relations.parents
        removeChild = Just <<< filter (_ /= nodeId) 
        state' = fromMaybe state do -- Maybe
          parentId <- Map.lookup nodeId parents
          let parents' = Map.delete nodeId parents
          let children' = Map.update removeChild parentId children
          pure state { relations { parents = parents', children = children' }}
      in
      setNodePosition state' nodeId x y
    FirstChild parentId ->
      let
        state' = setNodePath state nodeId (Top $ Tuple 0.0 0.0)
        parents' = Map.insert nodeId parentId state'.relations.parents
        -- This is important not to do in a Maybe monad, since child list
        -- does not have to exist if it is empty.
        childList =
          nodeId : (fromMaybe
                      (fromFoldable []) $
                      Map.lookup parentId state'.relations.children)
        children' = Map.insert parentId childList state'.relations.children
        state'' = state' { relations { parents = parents', children = children' }}
      in
      resetNodePosition state'' nodeId
    NextSibling siblingId ->
      let
        state' = setNodePath state nodeId (Top $ Tuple 0.0 0.0)
        children = state'.relations.children
        parents = state'.relations.parents
        Tuple parents' children' = fromMaybe (Tuple parents children) do -- Maybe
          parentId <- Map.lookup siblingId parents
          childList <- Map.lookup parentId children
          siblingIndex <- elemIndex siblingId childList
          childList' <- insertAt (siblingIndex + 1) nodeId childList
          let parents' = Map.insert nodeId parentId parents
          let children' = Map.insert parentId childList' children
          pure $ Tuple parents' children'
        state'' = state' { relations { parents = parents', children = children' }}
      in
      resetNodePosition state'' nodeId

onMouseUp :: MapState.State -> MouseEvent -> MapState.State
onMouseUp state event =
  if Mode.isHookedToDrag state.mode then
    let state' = state { mode = Mode.Idle } in
    case Mode.getClosestBeacon state.mode, Mode.getDragNodeId state.mode of
      Just path, Just nodeId -> setNodePath state' nodeId path
      _, _ -> state'
  else
    state