module Component.LabelEditor where

import App.Prelude
import Effect.Aff (Aff)

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
  forall query.
  Unit -> H.Component HH.HTML query Input Output Aff
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

render :: State -> HH.ComponentHTML Action Slots Aff
render label = HH.div_ [ HH.text (fromCharArray $ reverse $ toCharArray label)]

handleAction :: Action -> H.HalogenM State Action Slots Output Aff Unit
handleAction _ = pure unit