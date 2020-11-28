module Geometry exposing (Vector, Rect, rectDecoder, vectorDecoder, add)

import Json.Decode exposing (Decoder, succeed, float)
import Json.Decode.Pipeline exposing (required)

type alias Vector =
  { x : Float
  , y : Float
  }

type alias Rect =
  { position : Vector
  , size : Vector
  }

vectorDecoder : Decoder Vector
vectorDecoder =
  succeed Vector
    |> required "x" float
    |> required "y" float

rectDecoder : Decoder Rect
rectDecoder =
  succeed Rect
    |> required "position" vectorDecoder
    |> required "size" vectorDecoder

add : Vector -> Vector -> Vector
add a b =
  { x = a.x + b.x
  , y = a.y + b.y
  }