module Node exposing
  (Children(..)
  , childList
  , Id
  , Node
  , NodeType(..)
  )

import Geometry exposing (Vector)
import Json.Decode as Decoder exposing (Decoder, succeed, fail, string, nullable, float)
import Json.Encode as Encode
import Json.Decode.Pipeline exposing (required, hardcoded, optional)

type Children = Children (List Node)

childList : Children -> List Node
childList (Children nodes) =
  nodes

type alias Id = Int

type NodeType
  = NodeTypeTree
  | NodeTypeScroller

type alias Node =
  { id : Id
  , label : String
  , position : Vector
  , childEdgeHeight: Float
  , children : Children
  , nodeType : NodeType
  , maxWidth : Maybe Float
  , maxHeight : Maybe Float
  }
