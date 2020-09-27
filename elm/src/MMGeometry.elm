module MMGeometry exposing (Vector, Rect, rectDecoder, vectorDecoder)

import Json.Decode as Decoder exposing (Decoder, succeed, float)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)

type alias Vector = { x : Float, y : Float }
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

