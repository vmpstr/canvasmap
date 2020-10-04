module Node exposing
  ( childList
  , Children(..)
  , Id
  , idDecoder
  , idToAttribute
  , idToShadowAttribute
  , Node
  )

import Geometry exposing (Vector)
import Json.Decode as Decoder exposing (Decoder, succeed, fail, string)

type Children = Children (List Node)

type alias Id = Int

type alias Node =
  { id : Id
  , position : Vector
  , size : Vector
  , childEdgeHeight: Float
  , children : Children
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

idDecoder : Decoder Id
idDecoder =
  string |> Decoder.andThen decodeId
