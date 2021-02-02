module Component.Map where

import App.Monad (AppM)
import App.Data.Map as Map

import Data.Maybe (Maybe(..))
import Data.Function (($))
import Data.Show (show)
import Data.Semiring ((+))
import Data.Ring ((-))
import Data.Unit (Unit)

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE

data Action = Increment | Decrement

mkComponent :: forall query input output. Unit -> H.Component HH.HTML query input output AppM
mkComponent _ =
  H.mkComponent
    { initialState: Map.initialState
    , render: render
    , eval: H.mkEval $ H.defaultEval { handleAction = handleAction }
    }
  where
  render state =
    HH.div_
      [ HH.button [ HE.onClick \_ -> Just Decrement ] [ HH.text "-" ]
      , HH.div_ [ HH.text $ show state ]
      , HH.button [ HE.onClick \_ -> Just Increment ] [ HH.text "+" ]
      ]

  handleAction = case _ of
    Increment -> H.modify_ \state -> state + 1
    Decrement -> H.modify_ \state -> state - 1