module App.Data.NodeImpl.ScrollerNode where

import Data.Maybe (Maybe(..))
import Data.Unit (unit)
import Data.Show (class Show, show)
import Data.Semigroup ((<>))

import App.Data.NodeCommon (NodeId, NodePosition)
import App.Data.NodeClass (class LayoutNode)

newtype ScrollerNodeImpl = ScrollerNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Number
  }

instance scrollerNodeLayoutNode :: LayoutNode ScrollerNodeImpl where
  render _ = Just unit

instance scrollerNodeShow :: Show ScrollerNodeImpl where
  show (ScrollerNodeImpl n)
    =  "  Id: " <> show n.id <> "\n"
    <> "  Label: " <> n.label  <> "\n"