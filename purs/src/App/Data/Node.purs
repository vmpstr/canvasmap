module App.Data.Node (module App.Data.NodeCommon, Node(..), errorNode, NodeType(..), constructNode) where

import App.Prelude
import App.Data.NodeClass (class LayoutNode, render)
import App.Data.NodeImpl.ScrollerNode (ScrollerNodeImpl)
import App.Data.NodeImpl.ScrollerNode as ScrollerNodeImpl
import App.Data.NodeImpl.TreeNode as TreeNodeImpl
import App.Data.NodeImpl.TreeNode (TreeNodeImpl(..))
import App.Data.NodeCommon (
    NodeId(..)
  , NodePath(..)
  , NodePosition(..)
  , nextId
  , nodeAttributePrefix
  , nodeIdToAttribute
  , positionToCSS
  )

data Node
  = TreeNode TreeNodeImpl
  | ScrollerNode ScrollerNodeImpl

instance nodeLayoutNode :: LayoutNode Node where
  render renderChildren viewState node =
    case node of
      TreeNode impl -> render renderChildren viewState impl
      ScrollerNode impl -> render renderChildren viewState impl

instance nodeShow :: Show Node where
  show = case _ of
    TreeNode impl -> "TreeNode { " <> show impl <> "}\n"
    ScrollerNode impl -> "ScrollerNode { " <> show impl <> "}\n"

errorNode :: NodeId -> Node
errorNode id =
  TreeNode $ TreeNodeImpl
    { id: id
    , label: "Error! id: " <> show id
    , position: Static
    , maxWidth: Nothing
    }

data NodeType 
  = TreeNodeType
  | ScrollerNodeType

constructNode :: NodeType -> NodeId -> NodePosition -> Node
constructNode TreeNodeType id position = TreeNode $ TreeNodeImpl.construct id position
constructNode ScrollerNodeType id position = ScrollerNode $ ScrollerNodeImpl.construct id position