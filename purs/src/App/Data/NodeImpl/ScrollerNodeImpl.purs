module App.Data.NodeImpl.ScrollerNode where

import App.Prelude
import App.Utils as Utils

import App.Control.NodeAction as NA
import App.View.ViewState as ViewState
import App.Data.NodeCommon (NodeId, NodePosition(..), NodePath(..), positionToCSS)
import App.Class.LayoutNode (class LayoutNode)
import App.Data.CSSClasses as CC

import App.Events.Node as NE

import Component.Slots as Slots

import Data.Tuple.Nested ((/\))
import Data.Array ((:))

import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Halogen.HTML.CSS as HC

newtype ScrollerNodeImpl = ScrollerNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  , maxHeight :: Maybe Number
  }

renderBeacon :: forall a slots. String -> Boolean -> HH.HTML slots a
renderBeacon path closest =
  let
    classes = Utils.filterBySecond
      [ CC.beacon  /\ true
      , CC.closest /\ closest
      ]
  in
  HH.div
    [ HP.classes classes
    , HP.attr (HH.AttrName "path") path
    ] []

renderNSBeacon :: forall a slots. ViewState.ViewState -> NodeId -> HH.HTML slots a
renderNSBeacon viewState id =
  Utils.maybeDiv
    (viewState.viewBeacons && viewState.parentState /= ViewState.NoParent) $
    renderBeacon ("ns-" <> show id) (viewState.closestBeacon == (Just $ NextSibling id))

renderFCBeacon :: forall a slots. ViewState.ViewState -> NodeId -> HH.HTML slots a
renderFCBeacon viewState id =
  Utils.maybeDiv
    viewState.viewBeacons $
    renderBeacon ("fc-" <> show id) (viewState.closestBeacon == (Just $ FirstChild id))

renderContents ::
  forall m a.
  MonadAff m =>
  (NA.Action -> a)
  -> ViewState.ViewState
  -> ScrollerNodeImpl
  -> HH.ComponentHTML a Slots.Slots m
  -> HH.ComponentHTML a Slots.Slots m
renderContents wrap viewState (ScrollerNodeImpl details) children =
  let
    labelEditor = Utils.maybeDiv'
      (viewState.editing == Just details.id) $
      \_ -> NE.labelEditor wrap details.id details.label

    containerProps = Utils.filterBySecond
      [ (HP.class_ CC.contents_container) /\ true
      , (NE.selectHandler wrap (Just details.id)) /\ viewState.reactsToMouse
      , (NE.editLabelHandler wrap details.id) /\ viewState.reactsToMouse
      , (NE.dragStartHandler (wrap <<< NA.DragAction) details.id) /\ viewState.reactsToMouse
      ]

    props = HP.classes $ Utils.filterBySecond
      [ CC.selection_container /\ true
      , CC.selected            /\ (viewState.selected == Just details.id)
      ]
  in
  HH.div
    [ props ]
    [ HH.div
        containerProps -- contents_container
        [ labelEditor
        , HH.div 
            [ HP.class_ CC.node_label ] -- pointer-events: none.
            [ HH.text details.label ]
        ]
    , children
    ]

instance scrollerNodeLayoutNode :: LayoutNode ScrollerNodeImpl where
  render wrap renderChildren parentState impl@(ScrollerNodeImpl details) =
    let
      viewState = 
        if parentState.dragged == Just details.id then
          parentState { viewBeacons = false }
        else
          parentState

      childViewState = viewState { parentState = ViewState.HideParentEdge }
      classes = Utils.filterBySecond
        [ CC.node     /\ true
        , CC.scroller /\ true
        , CC.root     /\ (viewState.parentState == ViewState.NoParent)
        , CC.child    /\ (viewState.parentState /= ViewState.NoParent)
        , CC.dragged  /\ (viewState.dragged == Just details.id)
        ]

      parentEdge = Utils.maybeDiv
        (viewState.parentState == ViewState.ShowParentEdge) $
        HH.div [ HP.class_ CC.parent_edge ] []
      siblingRail = Utils.maybeDiv
        (viewState.haveNextSibling && viewState.parentState == ViewState.ShowParentEdge) $
        HH.div [ HP.class_ CC.sibling_rail ] []

      nsBeacon = renderNSBeacon viewState details.id
      fcBeacon = renderFCBeacon viewState details.id
    in
    HH.div
      [ HP.classes classes -- node
      , HC.style $ positionToCSS details.position
      ]
      [ HH.div 
          [ HP.class_ CC.position_capture ]
          [ renderContents wrap viewState impl
              (HH.div
                [ HP.classes [ CC.child_area, CC.scroller ] ]
                $ fcBeacon : renderChildren childViewState details.id
              )
          , parentEdge
          ]
      , siblingRail
      , nsBeacon
      ]

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