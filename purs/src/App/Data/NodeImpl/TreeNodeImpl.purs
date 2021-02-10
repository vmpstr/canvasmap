module App.Data.NodeImpl.TreeNode where

import App.Data.Map.ViewState as ViewState
import App.Data.Map.Action as MapAction
import App.Data.NodeClass (class LayoutNode)
import App.Data.NodeCommon (NodeId, NodePosition, nodeIdToAttribute, positionToCSS)

import Data.Eq ((==))
import Data.Function (($))
import Data.Maybe (Maybe)
import Data.Semigroup ((<>))
import Data.Show (class Show, show)

import Halogen.HTML as HH
import Halogen.HTML.CSS as HC
import Halogen.HTML.Properties as HP

newtype TreeNodeImpl = TreeNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  }

renderContents ::
  forall slots
  .  ViewState.ViewState
  -> TreeNodeImpl
  -> HH.HTML slots MapAction.Action
renderContents viewState (TreeNodeImpl details) =
  HH.div
    [ HP.class_ $ HH.ClassName "contents_container" ]
    [ HH.text details.label ]

instance treeNodeLayoutNode :: LayoutNode TreeNodeImpl where
  render renderChildren viewState impl@(TreeNodeImpl details) =
    let
      childViewState = viewState { parentState = ViewState.ShowParentEdge }
      rootOrChild =
        if viewState.parentState == ViewState.NoParent then
          "root"
        else
          "child"
    in
    HH.div
      [ HP.id_ $ nodeIdToAttribute details.id
      , HP.classes
          [ HH.ClassName rootOrChild
          , HH.ClassName "node"
          ]
      , HC.style $ positionToCSS details.position
      ]
      [ renderContents viewState impl 
      , HH.div
          [ HP.class_ $ HH.ClassName "child_holder" ]
          (renderChildren childViewState details.id)
      ]

instance treeNodeShow :: Show TreeNodeImpl where
  show (TreeNodeImpl details)
    =  "  Id: " <> show details.id <> "\n"
    <> "  Label: " <> details.label  <> "\n"
