module AnnotationView exposing (..)

import AnnotationControl exposing (Msg(..))
import MapModel exposing (Model)
import Html exposing (Html, div)
import Html.Attributes exposing (style, class)

view : (Msg -> msg) -> Model -> Html msg
view wrapMsg model =
  Html.map wrapMsg <| 
    div
      [ class "annotation_cover"
      , AnnotationControl.endAnnotationsAttribute
      ]
      [
        -- ...
      ]
