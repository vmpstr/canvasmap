module App.Data.NodeImpl.ScrollerNode where

import App.Prelude
import App.Data.Map.Action as MapAction
import App.Data.Map.ViewState as ViewState
import App.Data.NodeCommon (NodeId, NodePosition(..), NodePath(..))
import App.Data.NodeClass (class LayoutNode)
import App.Data.CSSClasses as CC

import Data.Tuple as Tuple
import Data.Tuple.Nested ((/\))
import Data.Array (filter)

import Halogen.HTML as HH
import Halogen.HTML.Properties as HP

newtype ScrollerNodeImpl = ScrollerNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  , maxHeight :: Maybe Number
  }

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input

renderBeacon :: forall slots. String -> Boolean -> HH.HTML slots MapAction.Action
renderBeacon path closest =
  let
    classes = filterBySecond
      [ CC.beacon  /\ true
      , CC.closest /\ closest
      ]
  in
  HH.div
    [ HP.classes classes
    , HP.attr (HH.AttrName "path") path
    ] []

renderNSBeacon :: forall slots. ViewState.ViewState -> NodeId -> HH.HTML slots MapAction.Action
renderNSBeacon viewState id =
  if viewState.viewBeacons && viewState.parentState /= ViewState.NoParent then
    renderBeacon ("ns-" <> show id) (viewState.closestBeacon == (Just $ NextSibling id))
  else
    HH.div_ []

renderFCBeacon :: forall slots. ViewState.ViewState -> NodeId -> HH.HTML slots MapAction.Action
renderFCBeacon viewState id =
  if viewState.viewBeacons then
    renderBeacon ("fc-" <> show id) (viewState.closestBeacon == (Just $ FirstChild id))
  else
    HH.div_ []


instance scrollerNodeLayoutNode :: LayoutNode ScrollerNodeImpl where
  render renderChildren parentState impl@(ScrollerNodeImpl details) =
    let
      viewState = 
        if parentState.dragged == Just details.id then
          parentState { viewBeacons = false }
        else
          parentState

      childViewState = viewState { parentState = ViewState.HideParentEdge }
      classes = filterBySecond
        [ CC.node    /\ true
        , CC.root    /\ (viewState.parentState == ViewState.NoParent)
        , CC.child   /\ (viewState.parentState /= ViewState.NoParent)
        , CC.dragged /\ (viewState.dragged == Just details.id)
        ]
      parentEdge =
        if viewState.parentState == ViewState.ShowParentEdge then
          HH.div [ HP.class_ CC.parent_edge ] []
        else
          HH.div_ []

      nsBeacon = renderNSBeacon viewState details.id
      fcBeacon = renderFCBeacon viewState details.id
      siblingRail =
        if viewState.haveNextSibling then
          HH.div [ HP.class_ CC.sibling_rail ] []
        else
          HH.div_ []
    in
    HH.div_ []

instance scrollerNodeShow :: Show ScrollerNodeImpl where
  show (ScrollerNodeImpl n)
    =  "  Id: " <> show n.id <> "\n"
    <> "  Label: " <> n.label  <> "\n"

construct :: NodeId -> NodePosition -> ScrollerNodeImpl 
construct id position = ScrollerNodeImpl
  { id: id
  , label: "New Task"
  , position: position
  , maxWidth: Nothing
  , maxHeight: Nothing
  }

setPosition :: ScrollerNodeImpl -> NodePosition -> ScrollerNodeImpl
setPosition (ScrollerNodeImpl details) position =
  ScrollerNodeImpl $ details { position = position }

moveAbsolutePosition :: ScrollerNodeImpl -> Number -> Number -> ScrollerNodeImpl
moveAbsolutePosition impl@(ScrollerNodeImpl details) dx dy =
  case details.position of
    Absolute p -> ScrollerNodeImpl $ details { position = Absolute { x: p.x + dx, y: p.y + dy } }
    _ -> impl

setLabel :: ScrollerNodeImpl -> String -> ScrollerNodeImpl
setLabel (ScrollerNodeImpl details) value =
  ScrollerNodeImpl details { label = value }