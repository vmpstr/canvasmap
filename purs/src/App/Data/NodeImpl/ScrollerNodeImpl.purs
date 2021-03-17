module App.Data.NodeImpl.ScrollerNode where

import App.Prelude
import App.Data.Map.Action as MapAction
import App.Data.Map.ViewState as ViewState
import App.Data.NodeCommon (NodeId, NodePosition(..), NodePath(..), positionToCSS)
import App.Data.NodeClass (class LayoutNode)
import App.Data.CSSClasses as CC

import Component.Slots as Slots
import Component.LabelEditor as LabelEditor

import Data.Tuple as Tuple
import Data.Tuple.Nested ((/\))
import Data.Array (filter, (:))

import Web.UIEvent.MouseEvent (toEvent)

import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Halogen.HTML.CSS as HC
import Halogen.HTML.Events as HE

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

maybeDiv :: forall s a. Boolean -> HH.HTML s a -> HH.HTML s a
maybeDiv condition value =
  if condition then value else HH.div_ []

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
  maybeDiv
    (viewState.viewBeacons && viewState.parentState /= ViewState.NoParent) $
    renderBeacon ("ns-" <> show id) (viewState.closestBeacon == (Just $ NextSibling id))

renderFCBeacon :: forall slots. ViewState.ViewState -> NodeId -> HH.HTML slots MapAction.Action
renderFCBeacon viewState id =
  maybeDiv
    viewState.viewBeacons $
    renderBeacon ("fc-" <> show id) (viewState.closestBeacon == (Just $ FirstChild id))

renderContents ::
  forall m.
  MonadAff m =>
   ViewState.ViewState
  -> ScrollerNodeImpl
  -> HH.ComponentHTML MapAction.Action Slots.Slots m
  -> HH.ComponentHTML MapAction.Action Slots.Slots m
renderContents viewState (ScrollerNodeImpl details) children =
  let
    classes = filterBySecond
      [ CC.selection_container /\ true
      , CC.selected            /\ (viewState.selected == Just details.id)
      ]

    labelEditor = maybeDiv
      (viewState.editing == Just details.id) $
      HH.slot
        Slots._labelEditor
        details.id
        (LabelEditor.mkComponent unit)
        details.label
        (\result -> Just $ MapAction.FinishEdit details.id result)

    containerProps = filterBySecond
      [ (HP.class_ CC.contents_container) /\ true
      , (HE.onClick
          \mouseEvent ->
            let event = toEvent mouseEvent
                selectAction = MapAction.Select $ Just details.id
            in
            Just $ MapAction.StopPropagation event selectAction
        ) /\ viewState.reactsToMouse
      , (HE.onMouseDown
          \mouseEvent ->
            let event = toEvent mouseEvent
                mouseDownAction = MapAction.MouseDown mouseEvent details.id
            in
            Just $ MapAction.StopPropagation event mouseDownAction
        ) /\ viewState.reactsToMouse
      , (HE.onDoubleClick
          \mouseEvent ->
            let event = toEvent mouseEvent
                editAction = MapAction.EditLabel details.id
            in
            Just $ MapAction.StopPropagation event editAction
        ) /\ viewState.reactsToMouse
      ]
  in
  HH.div
    [ HP.classes classes ] -- selection_container
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
  render renderChildren parentState impl@(ScrollerNodeImpl details) =
    let
      viewState = 
        if parentState.dragged == Just details.id then
          parentState { viewBeacons = false }
        else
          parentState

      childViewState = viewState { parentState = ViewState.HideParentEdge }
      classes = filterBySecond
        [ CC.node     /\ true
        , CC.scroller /\ true
        , CC.root     /\ (viewState.parentState == ViewState.NoParent)
        , CC.child    /\ (viewState.parentState /= ViewState.NoParent)
        , CC.dragged  /\ (viewState.dragged == Just details.id)
        ]
      parentEdge = maybeDiv
        (viewState.parentState == ViewState.ShowParentEdge) $
        HH.div [ HP.class_ CC.parent_edge ] []

      nsBeacon = renderNSBeacon viewState details.id
      fcBeacon = renderFCBeacon viewState details.id
      siblingRail = maybeDiv
        (viewState.haveNextSibling && viewState.parentState == ViewState.ShowParentEdge) $
        HH.div [ HP.class_ CC.sibling_rail ] []
    in
    HH.div
      [ HP.classes classes -- node
      , HC.style $ positionToCSS details.position
      ]
      [ HH.div 
          [ HP.class_ CC.position_capture ]
          [ renderContents viewState impl
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