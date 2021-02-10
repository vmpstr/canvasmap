module Component.Map where

import App.Data.Map.Action as MapAction
import App.Data.Map.State as MapState
import App.Data.Map.ViewState (initialViewState, ViewState)
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
import Data.Unit (Unit)

import Halogen as H
import Halogen.HTML as HH
--import Halogen.HT ML.Events as HE
import Halogen.HTML.Properties as HP

renderMap :: forall slots. MapState.State -> HH.HTML slots MapAction.Action
renderMap state =
  let
    viewState = initialViewState
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
    [ HP.class_ (HH.ClassName "map") ]
    (map (render renderChildren viewState) rootNodes)

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
    , render: renderMap
    , eval: H.mkEval $ H.defaultEval { handleAction = handleAction }
    }
