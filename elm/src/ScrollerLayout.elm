module ScrollerLayout exposing (viewTopNode, viewChildNodes)

import MapView exposing (ViewState)
import Html exposing (Html, div, text)
import Node exposing (Node, Children(..), childList, idToAttribute, idToShadowAttribute, Id, NodeType(..))
import MapMsg exposing (Msg)

viewTopNode : Bool -> List (Html Msg) -> List (Html Msg) -> ViewState -> Node -> Html Msg
viewTopNode onTop tailBeacons childNodes localState node =
  div [] []

viewChildNodes : List (Html Msg) -> List (Html Msg) -> List (Html Msg) -> ViewState  -> Node -> List (Html Msg)
viewChildNodes headBeacons tailBeacons childNodes localState node =
  []