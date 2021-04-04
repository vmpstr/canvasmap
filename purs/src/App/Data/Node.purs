module App.Data.Node where

import App.Prelude
import App.Class.LayoutNode (class LayoutNode, render)
import App.Data.NodeImpl.ScrollerNode (ScrollerNodeImpl)
import App.Data.NodeImpl.ScrollerNode as ScrollerNodeImpl
import App.Data.NodeImpl.TreeNode as TreeNodeImpl
import App.Data.NodeImpl.TreeNode (TreeNodeImpl(..))
import App.Data.NodeCommon (NodeId, NodePosition(..))

data Node
  = TreeNode TreeNodeImpl
  | ScrollerNode ScrollerNodeImpl

instance nodeLayoutNode :: LayoutNode Node where
  render wrap renderChildren viewState node =
    case node of
      TreeNode impl -> render wrap renderChildren viewState impl
      ScrollerNode impl -> render wrap renderChildren viewState impl

instance nodeShow :: Show Node where
  show = case _ of
    TreeNode impl -> "TreeNode { " <> show impl <> "}\n"
    ScrollerNode impl -> "ScrollerNode { " <> show impl <> "}\n"

instance encodeNode :: EncodeJson Node where
  encodeJson (TreeNode impl) = encodeJson { ctor: "TreeNode", impl: impl }
  encodeJson (ScrollerNode impl) = encodeJson { ctor: "ScrollerNode", impl: impl }

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

setPosition :: Node -> NodePosition -> Node
setPosition node position =
  case node of
    TreeNode impl -> TreeNode $ TreeNodeImpl.setPosition impl position
    ScrollerNode impl -> ScrollerNode $ ScrollerNodeImpl.setPosition impl position

moveAbsolutePosition :: Node -> Number -> Number -> Node
moveAbsolutePosition node dx dy =
  case node of
    TreeNode impl -> TreeNode $ TreeNodeImpl.moveAbsolutePosition impl dx dy
    ScrollerNode impl -> ScrollerNode $ ScrollerNodeImpl.moveAbsolutePosition impl dx dy

setLabel :: Node -> String -> Node
setLabel node value =
  case node of
    TreeNode impl -> TreeNode $ TreeNodeImpl.setLabel impl value
    ScrollerNode impl -> ScrollerNode $ ScrollerNodeImpl.setLabel impl value