module App.Data.Node (module App.Data.NodeCommon, Node(..)) where

import App.Data.NodeClass (class LayoutNode, render)
import App.Data.NodeImpl.ScrollerNode (ScrollerNodeImpl)
import App.Data.NodeImpl.TreeNode (TreeNodeImpl)
import App.Data.NodeCommon

import Data.Semigroup ((<>))
import Data.Show (class Show, show)

data Node
  = TreeNode TreeNodeImpl
  | ScrollerNode ScrollerNodeImpl

instance nodeLayoutNode :: LayoutNode Node where
  render = case _ of
    TreeNode impl -> render impl
    ScrollerNode impl -> render impl

instance nodeShow :: Show Node where
  show = case _ of
    TreeNode impl -> "TreeNode { " <> show impl <> "}\n"
    ScrollerNode impl -> "ScrollerNode { " <> show impl <> "}\n"
