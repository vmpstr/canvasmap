module Component.LabelEditor where

import App.Prelude
import Effect.Aff.Class (class MonadAff)

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

import Web.HTML.HTMLInputElement as Input
import Web.UIEvent.KeyboardEvent (KeyboardEvent, code, toEvent)
import Web.Event.Event (Event, stopPropagation)

import Web.HTML.HTMLElement (focus)

data Action
  = Noop
  | Initialize
  | StopPropagation Event Action
  | HandleKeyPress KeyboardEvent
  | Cancelled
  | Finished

type State =
  { original :: String
  , finalized :: Boolean
  }

type Input = String
type Output = String

type Slots = ()

mkComponent ::
  forall q m.
  MonadAff m =>
  Unit -> H.Component HH.HTML q Input Output m
mkComponent _ =
  H.mkComponent
    { initialState
    , render
    , eval: H.mkEval $ H.defaultEval
                        { handleAction = handleAction
                        , receive = receive
                        , initialize = Just Initialize
                        }
    }

initialState :: Input -> State
initialState input =
  { original: input
  , finalized: false
  }

receive :: Input -> Maybe Action
receive _ = Nothing

inputRef = H.RefLabel "input" :: H.RefLabel

render ::
  forall m.
  MonadAff m =>
  State -> HH.ComponentHTML Action Slots m
render state =
  let
    attributes =
      if state.finalized then
        [ HP.type_ HP.InputText
        , HP.value state.original
        , HP.class_ $ H.ClassName "label-editor"
        , HP.ref inputRef
        ]
      else
        [ HP.type_ HP.InputText
        , HP.value state.original
        , HP.class_ $ H.ClassName "label-editor"
        , HP.ref inputRef
        , HE.onBlur \_ -> Just Finished
        , HE.onKeyDown \ke -> Just $ HandleKeyPress ke
        ]
  in
  HH.input attributes

handleAction ::
  forall m.
  MonadAff m =>
  Action -> H.HalogenM State Action Slots Output m Unit
handleAction  = case _ of
  Noop -> pure unit
  Initialize -> do
    H.getHTMLElementRef inputRef >>= traverse_ \e -> do
      liftEffect $ focus e
      Input.fromHTMLElement e # traverse_ \input -> do
        liftEffect $ Input.select input
  StopPropagation event action -> do
    liftEffect $ stopPropagation event
    handleAction action
  HandleKeyPress ke
    | code ke == "Enter" -> handleAction $ StopPropagation (toEvent ke) Finished
    | code ke == "Escape" -> handleAction $ StopPropagation (toEvent ke) Cancelled
    -- Don't stop the propagation on Tab, since we want the map to handle it.
    | code ke == "Tab" -> pure unit
    | otherwise -> handleAction $ StopPropagation (toEvent ke) Noop
  Cancelled -> do
    state <- H.get
    H.modify_ _ { finalized = true }
    H.raise state.original
  Finished -> do
    state <- H.get
    H.modify_ _ { finalized = true }
    H.getHTMLElementRef inputRef >>= traverse_ \e -> do
      Input.fromHTMLElement e # traverse_ \input -> do
        value <- liftEffect $ Input.value input
        H.raise value