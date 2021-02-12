module App.Data.NodeImpl.TreeNode where

import App.Data.Map.ViewState as ViewState
import App.Data.Map.Action as MapAction
import App.Data.NodeClass (class LayoutNode)
import App.Data.NodeCommon (NodeId, NodePosition, nodeIdToAttribute, positionToCSS)

import Data.Eq ((==), (/=))
import Data.Function (($))
import Data.Maybe (Maybe(..))
import Data.Semigroup ((<>))
import Data.Show (class Show, show)
import Data.Tuple (Tuple(..))
import Data.Tuple as Tuple
import Data.Functor (map)
import Data.Array (filter)

import Halogen.HTML as HH
import Halogen.HTML.CSS as HC
import Halogen.HTML.Properties as HP

newtype TreeNodeImpl = TreeNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  }

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input

renderContents ::
  forall slots
  .  ViewState.ViewState
  -> TreeNodeImpl
  -> HH.HTML slots MapAction.Action
renderContents viewState (TreeNodeImpl details) =
  let
    classes = filterBySecond
      [ Tuple (HH.ClassName "selection_container") true
      , Tuple (HH.ClassName "selected") (viewState.selected == Just details.id)
      ]
  in
  HH.div
    [ HP.classes classes ]
    [ HH.div
        [ HP.class_ $ HH.ClassName "contents_container" ]
        [ HH.div 
            [ HP.class_ $ HH.ClassName "node_label" ]
            [ HH.text details.label ]
        ]
    ]

instance treeNodeLayoutNode :: LayoutNode TreeNodeImpl where
  render renderChildren viewState impl@(TreeNodeImpl details) =
    let
      childViewState = viewState { parentState = ViewState.ShowParentEdge }
      classes = filterBySecond
        [ Tuple (HH.ClassName "node") true
        , Tuple (HH.ClassName "root") (viewState.parentState == ViewState.NoParent)
        , Tuple (HH.ClassName "child") (viewState.parentState /= ViewState.NoParent)
        ]
      parentEdge =
        if viewState.parentState == ViewState.ShowParentEdge then
          HH.div [ HP.class_ $ HH.ClassName "parent_edge" ] []
        else
          HH.div_ []
    in
    HH.div
      [ HP.id_ $ nodeIdToAttribute details.id
      , HP.classes classes
      , HC.style $ positionToCSS details.position
      ]
      [ renderContents viewState impl 
      , parentEdge
      , HH.div
          [ HP.class_ $ HH.ClassName "child_holder" ]
          [ HH.div [ HP.class_ $ HH.ClassName "child_edge" ] []
          , HH.div [ HP.class_ $ HH.ClassName "child_area" ]
              (renderChildren childViewState details.id)
          ]
      ]

instance treeNodeShow :: Show TreeNodeImpl where
  show (TreeNodeImpl details)
    =  "  Id: " <> show details.id <> "\n"
    <> "  Label: " <> details.label  <> "\n"
