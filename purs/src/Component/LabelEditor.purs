module Component.LabelEditor where

import App.Prelude
import Effect.Aff.Class (class MonadAff)

import Data.Array (reverse)
import Data.String.CodeUnits (fromCharArray, toCharArray)

import Halogen as H
import Halogen.HTML as HH

data Action
  = ValueChanged String
  | Finished String

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
                        }
    }

initialState :: Input -> State
initialState = identity

receive :: Input -> Maybe Action
receive _ = Nothing

render ::
  forall m.
  MonadAff m =>
  State -> HH.ComponentHTML Action Slots m
render label = HH.div_ [ HH.text (fromCharArray $ reverse $ toCharArray label)]

handleAction ::
  forall m.
  MonadAff m =>
  Action -> H.HalogenM State Action Slots Output m Unit
handleAction _ = pure unit