module Node exposing
  ( childList
  , Children(..)
  , Id
  , idDecoder
  , idToAttribute
  , idToShadowAttribute
  , Node
  , NodeType(..)
  )

import Geometry exposing (Vector)
import Json.Decode as Decoder exposing (Decoder, succeed, fail, string)

type Children = Children (List Node)

type alias Id = Int

type NodeType
  = NodeTypeTree
  | NodeTypeScroller

type alias Node =
  { id : Id
  , label : String
  , position : Vector
  , size : Vector
  , childEdgeHeight: Float
  , children : Children
  , nodeType : NodeType
  }

attributePrefix : String
attributePrefix = "n"

childList : Children -> List Node
childList (Children nodes) =
  nodes

idToAttribute : Id -> String
idToAttribute id =
  attributePrefix ++ String.fromInt id

idToShadowAttribute : Id -> String
idToShadowAttribute id =
  "shadow-" ++ idToAttribute id

decodeId : String -> Decoder Id
decodeId str =
  if String.startsWith attributePrefix str then
    case String.dropLeft (String.length attributePrefix) str |> String.toInt of
       Just id ->
        succeed id
       Nothing ->
        fail ("Invalid id " ++ str)
  else
    fail ("Invalid id " ++ str)

-- rename this to idAttributeDecoder
idDecoder : Decoder Id
idDecoder =
  string |> Decoder.andThen decodeId
