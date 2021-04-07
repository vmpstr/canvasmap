module App.Data.NodeCommon where

import App.Prelude
import Data.Tuple (Tuple)

import CSS.Stylesheet (CSS)
import CSS.Display (position, absolute, static) as CSS
import CSS.Geometry (left, top) as CSS
import CSS.Size (px) as CSS

newtype NodeId = NodeId Int
derive newtype instance nodeIdEq :: Eq NodeId
derive newtype instance nodeIdOrd :: Ord NodeId
derive newtype instance nodeIdShow :: Show NodeId
derive newtype instance nodeIdEncode :: EncodeJson NodeId
derive newtype instance nodeIdDecode :: DecodeJson NodeId

nextId :: NodeId -> NodeId
nextId (NodeId n) = NodeId $ n + 1

data NodePosition
  = Absolute { x :: Number, y :: Number }
  | Static

derive instance genericNodePosition :: Generic NodePosition _
instance encodeNodePosition :: EncodeJson NodePosition where encodeJson = genericEncodeJson
instance decodeNodePosition :: DecodeJson NodePosition where decodeJson = genericDecodeJson

positionToCSS :: NodePosition -> CSS
positionToCSS = case _ of
  Absolute position -> do -- StyleM
    CSS.position CSS.absolute
    CSS.left $ CSS.px position.x
    CSS.top $ CSS.px position.y
  Static -> do -- StyleM
    CSS.position CSS.static

data NodePath
  = Top (Tuple Number Number)
  | NextSibling NodeId
  | FirstChild NodeId

derive instance eqNodePath :: Eq NodePath
derive instance genericNodePath :: Generic NodePath _
instance showNodePath :: Show NodePath where show = genericShow
instance encodeNodePath :: EncodeJson NodePath where encodeJson = genericEncodeJson
instance decodeNodePath :: DecodeJson NodePath where decodeJson = genericDecodeJson
