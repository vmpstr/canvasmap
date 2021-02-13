module Component.Map where

import App.Data.Map.Action as MapAction
import App.Data.Map.State as MapState
import App.Data.Map.ViewState (ViewState)
import App.Data.Node (Node, NodeId, errorNode)
import App.Data.NodeClass (render)
import App.Monad (AppM)
import Capabilities.Logging as Log

import Control.Bind (discard)
import Data.Eq ((==))
import Data.Function (($))
import Data.Functor (map)
import Data.List (toUnfoldable)
import Data.Map (values, lookup, filterKeys)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Unit (Unit, unit)
import Data.Semigroup ((<>))
import Data.Show (show)
import Control.Applicative (pure)

import Web.Event.Event (stopPropagation)

import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP

renderMap :: forall slots. MapState.State -> HH.HTML slots MapAction.Action
renderMap state =
  let
    viewState = MapState.toInitialViewState state
    noParent :: NodeId -> Boolean
    noParent nodeId =
      (lookup nodeId state.relations.parents) == Nothing

    rootNodes :: Array Node
    rootNodes = toUnfoldable $ values (filterKeys noParent state.nodes)

    toNode :: NodeId -> Node
    toNode nodeId = fromMaybe (errorNode nodeId) $ lookup nodeId state.nodes

    getChildren :: NodeId -> Array Node
    getChildren nodeId =
      case lookup nodeId state.relations.children of
        Nothing -> []
        Just children -> toUnfoldable $ map toNode children

    renderChildren :: ViewState -> NodeId -> Array (HH.HTML slots MapAction.Action)
    renderChildren localViewState nodeId =
      map (render renderChildren localViewState) (getChildren nodeId)

  in
  HH.div
    [ HP.class_ (HH.ClassName "map")
    , HE.onClick \_ -> Just $ MapAction.Select Nothing
    ]
    (map (render renderChildren viewState) rootNodes)

handleAction ::
  forall s o.
  MapAction.Action
  -> H.HalogenM MapState.State MapAction.Action s o AppM Unit
handleAction action = do
  Log.log Log.Info ("handling action: " <> show action)
  case action of
    MapAction.Noop -> pure unit
    MapAction.StopPropagation event nextAction -> do
      H.liftEffect $ stopPropagation event
      handleAction nextAction
    MapAction.Select selection -> do
      H.modify_ \s -> s { selected = selection }

mkComponent ::
  forall query input output.
  Unit
  -> H.Component HH.HTML query input output AppM
mkComponent _ =
  H.mkComponent
    { initialState: MapState.initialState
    , render: renderMap
    , eval: H.mkEval $ H.defaultEval { handleAction = handleAction }
    }
