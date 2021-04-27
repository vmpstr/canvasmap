module Component.App where

import App.Prelude

import App.Control.StateChangeType as SCT
import App.Control.MapAction as MA
import Capabilities.Logging as Log
import App.Control.Map as MC
-- TODO(vmpstr): This is used for initial state. I need to make the state be
-- app state, and delegate to something like map to build up its own state?
import App.Control.MapState as MapState

import Data.Argonaut.Core (stringify)
import Component.Slots (Slots)

import Web.UIEvent.KeyboardEvent as KE
import Web.UIEvent.KeyboardEvent.EventTypes as KET
import Web.HTML (window)
import Web.HTML.Window (document, localStorage)
import Web.HTML.HTMLDocument as HTMLDocument
import Web.Storage.Storage as Storage

import Data.Argonaut.Parser (jsonParser)
import Data.Argonaut.Decode.Error (printJsonDecodeError)

import Halogen as H
import Halogen.HTML as HH
import Halogen.Query.Event (eventListener)

data Action 
  = Initialize
  | MapAction MA.Action

mkComponent ::
  forall q i o m.
  Log.Logger m => MonadAff m => MonadPlus m =>
  Unit -> H.Component q i o m
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
            eventListener
              KET.keydown
              (HTMLDocument.toEventTarget document)
              (map (MapAction <<< MA.HandleMapKeyPress) <<< KE.fromEvent)
          -- Make this ephemeral so we actually apply it.
          map (_ /\ SCT.Ephemeral) $ H.lift $ loadState unit
        MapAction ma ->
          H.lift $ MC.handleAction ma state

    when (changeType /= SCT.NoChange)
      (H.modify_ $ const state')

    -- TODO(vmpstr): Should this be persistent && mode == Idle?
    when (changeType == SCT.Persistent)
      (H.lift $ saveState state')

  storageName = "cmstate" :: String

  saveState :: MapState.State -> m Unit
  saveState state = do
    storage <- liftEffect $ localStorage =<< window
    let json = encodeJson state
    liftEffect $ Storage.setItem storageName (stringify json) storage
    --Log.log Log.Debug $ stringifyWithIndent 2 json

  mapLeft :: forall a b c. (a -> b) -> Either a c -> Either b c
  mapLeft _ (Right x) = Right x
  mapLeft f (Left x) = Left $ f x

  fromEither' :: forall a b. Show a => (Unit -> b) -> Either a b -> m b
  fromEither' _ (Right x) = pure x
  fromEither' gen (Left x) = do
    Log.log Log.Error $ "Error: " <> show x
    pure $ gen unit

  loadState :: Unit -> m MapState.State
  loadState _ = do
    storage <- liftEffect $ localStorage =<< window
    mvalue <- liftEffect $ Storage.getItem storageName storage
    fromEither' MapState.initialState do
      value <- note "Empty storage" mvalue
      json <- jsonParser value
      mapLeft printJsonDecodeError $ decodeJson json
