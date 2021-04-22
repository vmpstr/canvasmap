module App.Data.NodeImpl.TreeNode where

import App.Prelude

import App.Class.LayoutNode (class LayoutNode)
import App.Control.NodeAction as NA
import App.Data.CSSClasses as CC
import App.Data.NodeCommon (NodeId, NodePosition(..), positionToCSS, maxWidthToCSS, NodePath(..))
import App.Events.Node as NE
import App.Utils as Utils
import App.View.ViewState as ViewState
import Component.Slots as Slots
import Data.Array ((:))
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP

newtype TreeNodeImpl = TreeNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  }

derive newtype instance encodeTreeNodeImpl :: EncodeJson TreeNodeImpl
derive newtype instance decodeTreeNodeImpl :: DecodeJson TreeNodeImpl

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
  (NA.Action -> a )
  -> ViewState.ViewState
  -> TreeNodeImpl
  -> HH.ComponentHTML a Slots.Slots m
renderContents wrap viewState (TreeNodeImpl details) =
  let
    classes = Utils.filterBySecond
      [ CC.selection_container /\ true
      , CC.selected            /\ (viewState.selected == Just details.id)
      ]

    labelEditor = Utils.maybeDiv'
      (viewState.editing == Just details.id) $
      \_ -> NE.labelEditor wrap details.id details.label

    containerProps = Utils.filterBySecond
      [ (HP.class_ CC.contents_container) /\ true
      , (NE.selectHandler wrap (Just details.id)) /\ viewState.reactsToMouse
      , (NE.editLabelHandler wrap details.id) /\ viewState.reactsToMouse
      , (NE.dragStartHandler (wrap <<< NA.DragAction) details.id) /\ viewState.reactsToMouse
      ]
  in
  HH.div
    [ HP.classes classes -- selection_container
    , Utils.cssToStyle $ maxWidthToCSS details.maxWidth
    ]
    [ HH.div
        containerProps -- contents_container
        [ labelEditor
        , HH.div 
            [ HP.class_ CC.node_label ] -- pointer-events: none.
            [ HH.text details.label ]
        ]
    , NE.ewResizer wrap details.id
    ]

instance treeNodeLayoutNode :: LayoutNode TreeNodeImpl where
  render wrap renderChildren parentState impl@(TreeNodeImpl details) =
    let
      viewState =
        if parentState.dragged == Just details.id then
          parentState { viewBeacons = false }
        else
          parentState

      childViewState = viewState { parentState = ViewState.ShowParentEdge }
      classes = Utils.filterBySecond
        [ CC.node    /\ true
        , CC.root    /\ (viewState.parentState == ViewState.NoParent)
        , CC.child   /\ (viewState.parentState /= ViewState.NoParent)
        , CC.dragged /\ (viewState.dragged == Just details.id)
        , CC.resized /\ (viewState.resized == Just details.id)
        ]
      parentEdge = Utils.maybeDiv
        (viewState.parentState == ViewState.ShowParentEdge) $
        HH.div [ HP.class_ CC.parent_edge ] []

      nsBeacon = renderNSBeacon viewState details.id
      fcBeacon = renderFCBeacon viewState details.id
      siblingRail = Utils.maybeDiv
        (viewState.haveNextSibling && viewState.parentState == ViewState.ShowParentEdge) $
        HH.div [ HP.class_ CC.sibling_rail ] []
    in
    HH.div
      [ HP.classes classes -- node
      , Utils.cssToStyle $ positionToCSS details.position
      ]
      [ HH.div 
          [ HP.class_ CC.position_capture ]
          [ renderContents wrap viewState impl 
          , parentEdge
          ]
      , HH.div
          [ HP.class_ CC.child_area ]
            $ fcBeacon : renderChildren childViewState details.id
      , siblingRail
      , nsBeacon
      ]

instance treeNodeShow :: Show TreeNodeImpl where
  show (TreeNodeImpl details)
    =  "  Id: " <> show details.id <> "\n"
    <> "  Label: " <> details.label  <> "\n"

construct :: NodeId -> NodePosition -> TreeNodeImpl 
construct id position = TreeNodeImpl
  { id: id
  , label: "New Task"
  , position: position
  , maxWidth: Nothing
  }

setPosition :: TreeNodeImpl -> NodePosition -> TreeNodeImpl
setPosition (TreeNodeImpl details) position =
  TreeNodeImpl $ details { position = position }

moveAbsolutePosition :: TreeNodeImpl -> Number -> Number -> TreeNodeImpl
moveAbsolutePosition impl@(TreeNodeImpl details) dx dy =
  case details.position of
    Absolute p -> TreeNodeImpl $ details { position = Absolute { x: p.x + dx, y: p.y + dy } }
    _ -> impl

setLabel :: TreeNodeImpl -> String -> TreeNodeImpl
setLabel (TreeNodeImpl details) value =
  TreeNodeImpl details { label = value }

setMaxWidth :: TreeNodeImpl -> Maybe Number -> TreeNodeImpl
setMaxWidth (TreeNodeImpl details) value =
  TreeNodeImpl details { maxWidth = value }