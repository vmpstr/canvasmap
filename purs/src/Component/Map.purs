module Component.Map where

import App.Monad (AppM)
import Capabilities.Logging as Log
import App.Data.Map as Map

import Data.Maybe (Maybe(..))
import Data.Function (($))
import Data.Show (show)
import Data.Semiring ((+))
import Data.Ring ((-))
import Data.Unit (Unit)
import Control.Bind (discard)

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

  handleAction :: forall s o. Action -> H.HalogenM Int Action s o AppM Unit
  handleAction action = do
    Log.log Log.Warning "finally"
    case action of
      Increment -> do
        Log.log Log.Info "incrementing"
        H.modify_ \state -> state + 1
      Decrement -> do
        Log.log Log.Error "decrementing"
        H.modify_ \state -> state - 1
    Log.log Log.Debug "ok done"