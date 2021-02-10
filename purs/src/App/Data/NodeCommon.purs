module App.Data.NodeCommon where

import Data.Eq (class Eq)
import Data.Ord (class Ord)
import Data.Show (class Show, show)
import Control.Bind (discard)
import Data.Function (($))
import Data.Semigroup ((<>))

import CSS.Stylesheet (CSS)
import CSS.Display as CSSDisplay
import CSS.Geometry as CSSGeometry
import CSS.Size as CSSSize

newtype NodeId = NodeId Int
derive newtype instance nodeIdEq :: Eq NodeId
derive newtype instance nodeIdOrd :: Ord NodeId
derive newtype instance nodeIdShow :: Show NodeId

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