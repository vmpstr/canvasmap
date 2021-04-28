module App.Control.Resize where

import App.Prelude
import App.Control.MapState as MS
import App.Control.MapMode as MM
import App.Control.ResizeAction (Action(..))
import App.Control.ResizeState as RS
import App.Control.StateChangeType as SCT
import App.Data.NodeCommon (NodeId)
import App.Data.Node as Node
import Capabilities.Logging as Log

import Data.Map as Map

import Web.Event.Event (stopPropagation, currentTarget)
import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY, toEvent)
import Web.HTML.HTMLElement (HTMLElement, fromElement, getBoundingClientRect, DOMRect)
import Web.DOM.Element (closest, fromEventTarget, toParentNode)
import Web.DOM.ParentNode (QuerySelector(..), querySelector)

handleAction :: forall m.
  Log.Logger m => MonadEffect m => MonadPlus m =>
  Action -> MS.State -> m (Tuple MS.State SCT.Type)
handleAction action state =
  case action of
    StopPropagation event next -> do
      liftEffect $ stopPropagation event
      handleAction next state
    EWStart mouseEvent id ->
      if state.mode == MM.Idle then
        map (_ /\ SCT.Ephemeral) $ startEWResize mouseEvent id state
      else
        pure $ state /\ SCT.NoChange
    NSStart mouseEvent id ->
      if state.mode == MM.Idle then
        map (_ /\ SCT.Ephemeral) $ startNSResize mouseEvent id state
      else
        pure $ state /\ SCT.NoChange
    MouseMove mouseEvent ->
      if MM.isHookedToResize state.mode then
        pure $ updateSize mouseEvent state /\ SCT.Ephemeral
      else
        pure $ state /\ SCT.NoChange
    MouseUp mouseEvent ->
      if MM.isHookedToResize state.mode then
        let state' = updateSize mouseEvent state in
        map (_ /\ SCT.Persistent) $ stopResize mouseEvent state'
      else
        pure $ state /\ SCT.NoChange

startEWResize :: forall m.
  Log.Logger m => MonadEffect m => MonadPlus m =>
  MouseEvent -> NodeId -> MS.State -> m MS.State
startEWResize = startResizeFromSelectionContainer RS.EW

startNSResize :: forall m.
  Log.Logger m => MonadEffect m => MonadPlus m =>
  MouseEvent -> NodeId -> MS.State -> m MS.State
startNSResize = startResizeFromSelectionContainer RS.NS

startResizeFromSelectionContainer :: forall m.
  Log.Logger m => MonadEffect m => MonadPlus m =>
  RS.Direction -> MouseEvent -> NodeId -> MS.State -> m MS.State
startResizeFromSelectionContainer direction me id state = do
  melement <- liftEffect $ runMaybeT do
    resizer <- liftMaybe $ (currentTarget $ toEvent me) >>= fromEventTarget
    node <- wrap $ closest (QuerySelector ".selection_container") resizer
    liftMaybe $ fromElement node
  maybe (pure state) startResizeFromElement melement

  where
  startResizeFromElement :: HTMLElement -> m MS.State
  startResizeFromElement element = do
    rect <- liftEffect $ getBoundingClientRect element
    Log.log Log.Info $ "Starting dims " <> show rect.width <> " " <> show rect.height
    pure state
      { mode = MM.Resize
        { direction: direction
        , x: toNumber $ clientX me
        , y: toNumber $ clientY me
        , width: rect.width
        , height: rect.height
        , id: id
        }
      }

updateSize :: MouseEvent -> MS.State -> MS.State
updateSize me state = resizeMode state \rstate ->
  let
    dx = (toNumber $ clientX me) - rstate.x
    dy = (toNumber $ clientY me) - rstate.y
    width = rstate.width + dx
    height = rstate.height + dy
    -- Update the RS state
    rstate' = rstate
                { x = rstate.x + dx
                , y = rstate.y + dy
                , width = width
                , height = height
                }
    -- Update MS state with the RS state
    state' = state { mode = MM.Resize rstate' }
    -- Update node dimensiosn
    widthState = updateNodeWidthIfNeeded rstate' state'
    finalState = updateNodeHeightIfNeeded rstate' widthState
  in
  finalState

  where
  updateNodeWidthIfNeeded :: RS.State -> MS.State -> MS.State
  updateNodeWidthIfNeeded rs s =
    if affectsWidth rs.direction then
      setNodeMaxWidth s rs.id (Just rs.width)
    else s

  updateNodeHeightIfNeeded :: RS.State -> MS.State -> MS.State
  updateNodeHeightIfNeeded rs s =
    if affectsHeight rs.direction then
      setNodeMaxHeight s rs.id (Just rs.height)
    else s

stopResize :: forall m. MonadEffect m => MouseEvent -> MS.State -> m MS.State
stopResize me state = resizeModeM state \rstate -> do
  let state' = state { mode = MM.Idle }
  melement <- runMaybeT do
    root <- liftMaybe $ (currentTarget $ toEvent me) >>= fromEventTarget
    resizer <- wrap $ liftEffect $ querySelector (QuerySelector ".resized") $ toParentNode root
    liftMaybe $ fromElement resizer
  maybe (pure state') (stopResize' rstate state') melement

  where
  stopResize' :: RS.State -> MS.State -> HTMLElement -> m MS.State
  stopResize' rstate localState element = do
    rect <- liftEffect $ getBoundingClientRect element
    let noWidthState = resetWidthIfNeeded rstate localState rect
    let finalState = resetHeightIfNeeded rstate noWidthState rect
    pure finalState

  resetWidthIfNeeded :: RS.State -> MS.State -> DOMRect -> MS.State
  resetWidthIfNeeded rs s r =
    if affectsWidth rs.direction && r.width + 3.0 < rs.width then
      setNodeMaxWidth s rs.id Nothing
    else s

  resetHeightIfNeeded :: RS.State -> MS.State -> DOMRect -> MS.State
  resetHeightIfNeeded rs s r =
    if affectsHeight rs.direction && r.height + 3.0 < rs.height then
      setNodeMaxHeight s rs.id Nothing
    else s

resizeModeM :: forall m.
  MonadEffect m =>
  MS.State -> (RS.State -> m MS.State) -> m MS.State
resizeModeM state f =
  case state.mode of
    MM.Resize rstate -> f rstate
    _ -> pure state

resizeMode :: MS.State -> (RS.State -> MS.State) -> MS.State
resizeMode state f =
  case state.mode of
    MM.Resize rstate -> f rstate
    _ -> state

liftMaybe :: forall m a. MonadPlus m => Maybe a -> m a
liftMaybe (Just x) = pure x
liftMaybe Nothing = empty

affectsWidth :: RS.Direction -> Boolean
affectsWidth RS.EW = true
affectsWidth _ = false

affectsHeight :: RS.Direction -> Boolean
affectsHeight RS.NS = true
affectsHeight _ = false

setNodeMaxWidth :: MS.State -> NodeId -> Maybe Number -> MS.State
setNodeMaxWidth state id value = state
  { nodes =
      Map.update (\node -> Just $ Node.setMaxWidth node value) id state.nodes
  }

setNodeMaxHeight :: MS.State -> NodeId -> Maybe Number -> MS.State
setNodeMaxHeight state id value = state
  { nodes =
      Map.update (\node -> Just $ Node.setMaxHeight node value) id state.nodes
  }
