module App.Control.Resize where

import App.Prelude
import App.Control.MapState as MS
import App.Control.MapMode as MM
import App.Control.ResizeAction (Action(..))
import App.Control.ResizeState as RS
import App.Control.StateChangeType as SCT
import App.Data.NodeCommon (NodeId)
import Capabilities.Logging as Log
import App.Data.MapRef (mapRef)

import Halogen as H

import Web.Event.Event (stopPropagation, currentTarget)
import Web.UIEvent.MouseEvent (MouseEvent, clientX, clientY, toEvent)
import Web.HTML.HTMLElement (fromEventTarget)
import Web.DOM.Element (closest)
import Web.DOM.ParentNode (QuerySelector)

handleAction :: forall m. Log.Logger m => MonadEffect m => Action -> MS.State -> m (Tuple MS.State SCT.Type)
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
    MouseMove mouseEvent ->
      if MM.isHookedToResize state.mode then
        pure $ updateSize mouseEvent state /\ SCT.Ephemeral
      else
        pure $ state /\ SCT.NoChange
    MouseUp mouseEvent ->
      if MM.isHookedToResize state.mode then
        let state' = updateSize mouseEvent state in
        map (_ /\ SCT.Persistent) $ stopResize state'
      else
        pure $ state /\ SCT.NoChange

-- TODO(vmpstr): Implement.
updateSize :: MouseEvent -> MS.State -> MS.State
updateSize me state = state

-- TODO(vmpstr): Remove size constraint if element size + delta < constraint
stopResize :: forall m. MonadEffect m => MS.State -> m MS.State
stopResize state = pure $ state { mode = MM.Idle }

startEWResize :: forall m. Log.Logger m => MonadEffect m => MouseEvent -> NodeId -> MS.State -> m MS.State
startEWResize me id state = do
  let mresizer = (currentTarget $ toEvent me) >>= fromEventTarget
  
  -- mhtmlMap <- H.lift $ H.getHTMLElementRef mapRef
  Log.log Log.Info $ "ew resize start at " <> show (clientX me) <> " " <> show (clientY me)
  pure state
    { mode = MM.Resize
      { direction: RS.EW
      , x: clientX me
      , y: clientY me
      , width: 0
      , height: 0
      , id: id
      }
    }