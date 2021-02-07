module Component.Map where

import App.Monad (AppM)
import Capabilities.Logging as Log

import App.Data.Map.State as MapState
import App.Data.Map.Action as MapAction

import Data.Maybe (Maybe(..))
import Data.Function (($))
import Data.Show (show)
import Data.Unit (Unit)
import Control.Bind (discard)

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP

render :: forall slots. MapState.State -> HH.HTML slots MapAction.Action
render state =
  HH.div
    [ HP.class_ (HH.ClassName "map")
    ]
    [ HH.button [ HE.onClick \_ -> Just MapAction.Decrement ] [ HH.text "-" ]
    , HH.div_ [ HH.text $ show state ]
    , HH.button [ HE.onClick \_ -> Just MapAction.Increment ] [ HH.text "+" ]
    ]

handleAction ::
  forall s o.
  MapAction.Action
  -> H.HalogenM MapState.State MapAction.Action s o AppM Unit
handleAction action = do
  Log.log Log.Warning "finally"
  case action of
    MapAction.Increment -> do
      Log.log Log.Info "incrementing"
    MapAction.Decrement -> do
      Log.log Log.Error "decrementing"
  Log.log Log.Debug "ok done"

mkComponent ::
  forall query input output.
  Unit
  -> H.Component HH.HTML query input output AppM
mkComponent _ =
  H.mkComponent
    { initialState: MapState.initialState
    , render: render
    , eval: H.mkEval $ H.defaultEval { handleAction = handleAction }
    }
