module Component.LabelEditor where

import App.Prelude
import Effect.Aff.Class (class MonadAff)

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

import Web.HTML.HTMLInputElement as Input

import Web.HTML.HTMLElement (focus)

data Action
  = ValueChanged String
  | Finished String
  | Initialize

type State = String
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
initialState = identity

receive :: Input -> Maybe Action
receive _ = Nothing

inputRef = H.RefLabel "input" :: H.RefLabel

render ::
  forall m.
  MonadAff m =>
  State -> HH.ComponentHTML Action Slots m
render label =
  let
    attributes =
      [ HP.type_ HP.InputText
      , HP.value label
      , HP.class_ $ H.ClassName "label-editor"
      , HP.ref inputRef
      ]
  in
  HH.input attributes

handleAction ::
  forall m.
  MonadAff m =>
  Action -> H.HalogenM State Action Slots Output m Unit
handleAction  = case _ of
  Initialize -> do
    H.getHTMLElementRef inputRef >>= traverse_ \e -> do
      liftEffect $ focus e
      Input.fromHTMLElement e # traverse_ \input -> do
        liftEffect $ Input.select input
  _ -> pure unit