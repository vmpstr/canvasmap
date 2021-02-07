module App.Data.NodeImpl.TreeNode where

import Data.Maybe (Maybe(..))
import Data.Unit (unit)
import Data.Show (class Show, show)
import Data.Semigroup ((<>))

import App.Data.NodeCommon (NodeId, NodePosition)
import App.Data.NodeClass (class LayoutNode)

newtype TreeNodeImpl = TreeNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  }

instance treeNodeLayoutNode :: LayoutNode TreeNodeImpl where
  render _ = Just unit

instance treeNodeShow :: Show TreeNodeImpl where
  show (TreeNodeImpl n)
    =  "  Id: " <> show n.id <> "\n"
    <> "  Label: " <> n.label  <> "\n"
