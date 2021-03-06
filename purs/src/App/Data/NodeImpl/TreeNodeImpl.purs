module App.Data.NodeImpl.TreeNode where

import App.Prelude
import App.Data.Map.ViewState as ViewState
import App.Data.Map.Action as MapAction
import App.Data.NodeClass (class LayoutNode)
import App.Data.NodeCommon (NodeId, NodePosition(..), positionToCSS, NodePath(..))

import Component.Slots as Slots
import Component.LabelEditor as LabelEditor

import Data.Array (filter, (:))
import Data.Tuple (Tuple(..))
import Data.Tuple as Tuple

import Web.UIEvent.MouseEvent (toEvent)

import Halogen.HTML as HH
import Halogen.HTML.CSS as HC
import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

newtype TreeNodeImpl = TreeNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  }

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input


renderBeacon :: forall slots. String -> Boolean -> HH.HTML slots MapAction.Action
renderBeacon path closest =
  let
    classes = filterBySecond
      [ Tuple (HH.ClassName "beacon") true
      , Tuple (HH.ClassName "closest") closest
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


renderContents ::
  forall m.
  MonadAff m =>
   ViewState.ViewState
  -> TreeNodeImpl
  -> HH.ComponentHTML MapAction.Action Slots.Slots m
renderContents viewState (TreeNodeImpl details) =
  let
    classes = filterBySecond
      [ Tuple (HH.ClassName "selection_container") true
      , Tuple (HH.ClassName "selected") (viewState.selected == Just details.id)
      ]

    labelEditor =
      if viewState.editing == Just details.id then -- "Are we editing this?"
        HH.slot Slots._labelEditor details.id (LabelEditor.mkComponent unit) details.label (\_ -> Nothing)
      else
        HH.div_ []

    containerProps = filterBySecond
      [ Tuple (HP.class_ $ HH.ClassName "contents_container") true
      , Tuple
          (HE.onClick
            \mouseEvent ->
              let
                event = toEvent mouseEvent
                selectAction = MapAction.Select $ Just details.id
              in
              Just $ MapAction.StopPropagation event selectAction
          ) viewState.reactsToMouse
      , Tuple
          (HE.onMouseDown
            \mouseEvent ->
              let
                event = toEvent mouseEvent
                mouseDownAction = MapAction.MouseDown mouseEvent details.id
              in
              Just $ MapAction.StopPropagation event mouseDownAction
          ) viewState.reactsToMouse
      , Tuple
          (HE.onDoubleClick
            \mouseEvent ->
              let
                event = toEvent mouseEvent
                editAction = MapAction.EditLabel details.id
              in
              Just $ MapAction.StopPropagation event editAction
          ) viewState.reactsToMouse
      ]
  in
  HH.div
    [ HP.classes classes ] -- selection_container
    [ HH.div
        containerProps -- contents_container
        [ labelEditor
        , HH.div 
            [ HP.class_ $ HH.ClassName "node_label" ] -- pointer-events: none.
            [ HH.text details.label ]
        ]
    ]

instance treeNodeLayoutNode :: LayoutNode TreeNodeImpl where
  render renderChildren parentState impl@(TreeNodeImpl details) =
    let
      viewState =
        if parentState.dragged == Just details.id then
          parentState { viewBeacons = false }
        else
          parentState

      childViewState = viewState { parentState = ViewState.ShowParentEdge }
      classes = filterBySecond
        [ Tuple (HH.ClassName "node") true
        , Tuple (HH.ClassName "root") (viewState.parentState == ViewState.NoParent)
        , Tuple (HH.ClassName "child") (viewState.parentState /= ViewState.NoParent)
        , Tuple (HH.ClassName "dragged") (viewState.dragged == Just details.id)
        ]
      parentEdge =
        if viewState.parentState == ViewState.ShowParentEdge then
          HH.div [ HP.class_ $ HH.ClassName "parent_edge" ] []
        else
          HH.div_ []

      nsBeacon = renderNSBeacon viewState details.id
      fcBeacon = renderFCBeacon viewState details.id
      siblingRail =
        if viewState.haveNextSibling then
          HH.div [ HP.class_ $ HH.ClassName "sibling_rail" ] []
        else
          HH.div_ []
    in
    HH.div
      [ HP.classes classes
      , HC.style $ positionToCSS details.position
      ]
      [ HH.div 
          [ HP.class_ $ HH.ClassName "position_capture" ]
          [ renderContents viewState impl 
          , parentEdge
          ]
      , HH.div
          [ HP.class_ $ HH.ClassName "child_holder" ]
          [ HH.div [ HP.class_ $ HH.ClassName "child_edge" ] []
          , HH.div [ HP.class_ $ HH.ClassName "child_area" ]
              $ fcBeacon : renderChildren childViewState details.id
          ]
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