module EventDecoders exposing (..)

import EventDecodersData exposing (..)
import Geometry
import Json.Decode as Decoder exposing (Decoder, succeed, string, float, field, bool, fail, nullable)
import Json.Decode.Pipeline exposing (required, hardcoded, optional)
import MapMsg exposing (..)
import MsgUtils
import Node exposing (Node, NodeType(..), Id, Children(..))
import NodeUtils exposing (idToAttribute, idAttributeDecoder, nodeFromClickDecoder)
import Tree
import TreeSpec


onChildEdgeHeightChangedDecoder : Id -> Decoder Msg
onChildEdgeHeightChangedDecoder targetId =
  Decoder.map MsgOnChildEdgeHeightChanged
    (succeed OnChildEdgeHeightChangedData
      |> hardcoded targetId
      |> required "detail" (field "height" float))
