module ScrollerLayout exposing (viewTopNode, viewChildNodes, adjustStateForChildren)

import MapView exposing (ViewState)
import Html exposing (Html, div, text)
import Html.Attributes exposing (attribute, id, style, class, classList)
import Html.Events exposing (on, custom)
import Node exposing (Node, Children(..), childList, idToAttribute, idToShadowAttribute, Id, NodeType(..))
import Utilities exposing (asPx)
import MapMsg exposing (Msg)
import EventDecoders exposing (..)

viewTopNode : Bool -> List (Html Msg) -> List (Html Msg) -> ViewState -> Node -> Html Msg
viewTopNode onTop tailBeacons childNodes localState node =
  div
    [ id localState.htmlNodeId
      , class "top_child"
      , class "scroller"
      , classList [("shadow", localState.shadow), ("on_top", onTop)]
      , style "left" (asPx node.position.x)
      , style "top" (asPx node.position.y)
    ]
    [ viewNodeContents node localState childNodes tailBeacons ]

adjustStateForChildren : ViewState -> ViewState
adjustStateForChildren state =
    { state | showParentEdge = False }

viewChildNodes : List (Html Msg) -> List (Html Msg) -> List (Html Msg) -> ViewState  -> Node -> List (Html Msg)
viewChildNodes headBeacons tailBeacons childNodes localState node =
  headBeacons ++
  [ div []
      [ div
          [ id localState.htmlNodeId
          , class "child"
          , class "scroller"
          , classList [("shadow", localState.shadow)]
          ]
          -- TODO: Don't show the div if there is no parent edge.
          [ div [ classList [ ("parent_edge", localState.showParentEdge) ] ] []
          , viewNodeContents node localState childNodes tailBeacons
          ]
      ]
   ]

viewNodeContents : Node -> ViewState -> List (Html Msg) -> List (Html Msg) -> Html Msg
viewNodeContents node viewState childNodes tailBeacons =
  let
    attributes =
      [ class "contents"
      , class "selection_container"
      , classList [ ("selected", viewState.selected == Just node.id) ]
      , custom "click" (onSelectClickDecoder (Just node.id))
      ] ++
      if viewState.editId == Nothing then
        [ custom "pointerdown" (onPointerDownDecoder node.id) ]
      else
        []
  in
  div
      attributes
      [ div
        [ class "label_container"
        , custom "dblclick" (onEditLabelClickDecoder node.id)
        ]
        [ Html.node "node-label"
            [ on "labelchanged" (onLabelChangedDecoder node.id)
            , attribute "label" node.label
            ]
            []
        ]
      , div [ class "divider" ] []
      , div
          [ class "child_area" ] 
          (childNodes ++ tailBeacons)
      ]