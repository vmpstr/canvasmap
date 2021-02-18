module App.Data.NodeImpl.ScrollerNode where

import App.Prelude
import App.Data.NodeCommon (NodeId, NodePosition(..))
import App.Data.NodeClass (class LayoutNode)

import Halogen.HTML as HH

newtype ScrollerNodeImpl = ScrollerNodeImpl
  { id :: NodeId
  , label :: String
  , position :: NodePosition
  , maxWidth :: Maybe Number
  , maxHeight :: Maybe Number
  }

instance scrollerNodeLayoutNode :: LayoutNode ScrollerNodeImpl where
  render _ _ _ = HH.div_ []

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