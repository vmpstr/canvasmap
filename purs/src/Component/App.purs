module Component.App where

import App.Prelude

import App.Control.StateChangeType as SCT
import App.Control.MapAction as MA
import Capabilities.Logging as Log
import App.Control.Map as MC
-- TODO(vmpstr): This is used for initial state. I need to make the state be
-- app state, and delegate to something like map to build up its own state?
import App.Control.MapState as MapState

import Data.Argonaut.Core (stringifyWithIndent)
import Component.Slots (Slots)

import Web.UIEvent.KeyboardEvent as KE
import Web.UIEvent.KeyboardEvent.EventTypes as KET
import Web.HTML (window)
import Web.HTML.Window (document, localStorage)
import Web.HTML.HTMLDocument as HTMLDocument

import Halogen as H
import Halogen.HTML as HH
import Halogen.Query.EventSource (eventListenerEventSource)

data Action 
  = Initialize
  | MapAction MA.Action

mkComponent ::
  forall q i o m.
  Log.Logger m => MonadAff m =>
  Unit -> H.Component HH.HTML q i o m
mkComponent _ =
  H.mkComponent
    { initialState: MapState.initialState
    , render: render
    , eval: H.mkEval H.defaultEval
        { handleAction = handleAction
        , initialize = Just Initialize
        }
    }
  where
  render :: MapState.State -> HH.ComponentHTML Action Slots m
  render state =
    MC.render MapAction state

  handleAction ::
    forall s.
    Action -> H.HalogenM MapState.State Action s o m Unit
  handleAction action = do -- HalogenM
    state <- H.get
    state' /\ changeType <-
      case action of
        Initialize -> do -- HalogenM
          document <- liftEffect $ document =<< window
          void $ H.subscribe $
            eventListenerEventSource
              KET.keydown
              (HTMLDocument.toEventTarget document)
              (map (MapAction <<< MA.HandleMapKeyPress) <<< KE.fromEvent)
          pure $ state /\ SCT.NoChange
        MapAction ma ->
          MC.handleAction ma state

    when (changeType /= SCT.NoChange)
      (H.modify_ $ const state')

    -- TODO(vmpstr): Should this be persistent && mode == Idle?
    when (changeType == SCT.Persistent)
      (H.lift $ saveState state')

  saveState :: MapState.State -> m Unit
  saveState state = do
    storage <- liftEffect $ localStorage =<< window
    let json = encodeJson state
    Log.log Log.Debug $ stringifyWithIndent 2 json
    pure unit
