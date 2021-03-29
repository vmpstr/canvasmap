module Component.App where

import App.Prelude

import App.Data.Map.Action as MA
import Capabilities.Logging as Log
import App.Control.Map as MC
-- TODO(vmpstr): This is used for initial state. I need to make the state be
-- app state, and delegate to something like map to build up its own state?
import App.Data.Map.State as MapState

import Component.Slots (Slots)

import Web.UIEvent.KeyboardEvent as KE
import Web.UIEvent.KeyboardEvent.EventTypes as KET
import Web.HTML (window)
import Web.HTML.Window (document)
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
    case action of
      Initialize -> void do
        document <- liftEffect $ document =<< window
        H.subscribe $
          eventListenerEventSource
            KET.keydown
            (HTMLDocument.toEventTarget document)
            (map (MapAction <<< MA.HandleMapKeyPress) <<< KE.fromEvent)
      MapAction ma -> do
        state <- H.get >>= MC.handleAction ma
        H.modify_ $ const state