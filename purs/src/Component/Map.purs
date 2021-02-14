module Component.Map where

import App.Prelude
import App.Data.Map.Action as MapAction
import App.Data.Map.State as MapState
import App.Data.Map.ViewState (ViewState)
import App.Data.Node (Node, NodeId, errorNode)
import App.Data.NodeCommon (NodePath(..), nextId)
import App.Data.NodeClass (render)
import App.Monad (AppM)
import Capabilities.Logging as Log
import App.Control.Node as NodeControl

import Data.List (toUnfoldable)
import Data.Map (values, lookup, filterKeys)
import Data.Tuple (Tuple(..))
import Data.Int (toNumber)

import Web.Event.Event (stopPropagation)
import Web.UIEvent.MouseEvent (clientX, clientY)

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
    , HE.onMouseUp \_ -> Just MapAction.MouseUp
    , HE.onDoubleClick \e -> Just $ MapAction.NewTopNode (clientX e) (clientY e)
    ]
    (map (render renderChildren viewState) rootNodes)

{-
- EventSource for ResizeObserver-like behavior
- Slots for label edits
-}
handleAction ::
  forall s o.
  MapAction.Action
  -> H.HalogenM MapState.State MapAction.Action s o AppM Unit
handleAction action = do
  Log.log Log.Info $ "handling action: " <> show action
  case action of
    MapAction.Noop -> pure unit
    MapAction.MouseUp -> do
      state <- H.get
      when (MapState.isDrag state.mode) $
        H.modify_ _ { mode = MapState.Idle }
    MapAction.StopPropagation event nextAction -> do
      H.liftEffect $ stopPropagation event
      handleAction nextAction
    MapAction.Select selection -> do
      H.modify_ _ { selected = selection }
    MapAction.NewTopNode x y -> do
      H.modify_ \state ->
        let
          x' = toNumber x - 40.0
          y' = toNumber y - 20.0
          id = nextId state.maxId
          state' = NodeControl.newNode id (Top $ Tuple x' y') state
        in
        state' { maxId = id, selected = Just id }

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
