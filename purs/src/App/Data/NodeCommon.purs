module App.Data.NodeCommon where

import App.Prelude
import Data.Tuple (Tuple)

import CSS.Stylesheet (CSS)
import CSS.Display as CSSDisplay
import CSS.Geometry as CSSGeometry
import CSS.Size as CSSSize

newtype NodeId = NodeId Int
derive newtype instance nodeIdEq :: Eq NodeId
derive newtype instance nodeIdOrd :: Ord NodeId
derive newtype instance nodeIdShow :: Show NodeId

nextId :: NodeId -> NodeId
nextId (NodeId n) = NodeId $ n + 1

nodeAttributePrefix :: String
nodeAttributePrefix = "n"

nodeIdToAttribute :: NodeId -> String
nodeIdToAttribute n = nodeAttributePrefix <> show n

data NodePosition
  = Absolute { x :: Number, y :: Number }
  | Static

positionToCSS :: NodePosition -> CSS
positionToCSS = case _ of
  Absolute position ->
    do
      CSSDisplay.position CSSDisplay.absolute
      CSSGeometry.left $ CSSSize.px position.x
      CSSGeometry.top $ CSSSize.px position.y
  Static  ->
    do
      CSSDisplay.position CSSDisplay.static

data NodePath
  = Top (Tuple Number Number)
  | NextSibling NodeId
  | FirstChild NodeId

derive instance genericNodePath :: Generic (NodePath) _
instance showNodePath :: Show NodePath where
  show = genericShow