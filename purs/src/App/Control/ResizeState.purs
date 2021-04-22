module App.Control.ResizeState where

import App.Prelude
import App.Data.NodeCommon (NodeId)

data Direction
  = EW

derive instance directionEq :: Eq Direction
derive instance genericDirection :: Generic Direction _
instance directionShow :: Show Direction where
  show = genericShow

instance encodeDirection :: EncodeJson Direction where
  encodeJson = genericEncodeJson

instance decodeDirection :: DecodeJson Direction where
  decodeJson = genericDecodeJson


type State =
  { direction :: Direction
  , x :: Number
  , y :: Number 
  , width :: Number
  , height :: Number
  , id :: NodeId
  }
