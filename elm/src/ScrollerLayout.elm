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
    [ div
        [ class "contents" ]
        [ viewNodeContents node localState
        , div [ class "divider" ] []
        , div
          [ class "child_area" ] 
          childNodes
        ]
    ]

adjustStateForChildren : ViewState -> ViewState
adjustStateForChildren state =
    { state | showParentEdge = False }

viewChildNodes : List (Html Msg) -> List (Html Msg) -> List (Html Msg) -> ViewState  -> Node -> List (Html Msg)
viewChildNodes headBeacons tailBeacons childNodes localState node =
  headBeacons ++
  [ div []
      [ div
          [ id localState.htmlNodeId
          , classList [("child", True), ("shadow", localState.shadow)]
          ]
          [ viewNodeContents node localState
          , div [ class "parent_edge" ] []
          ]
      , div
          [ class "child_holder" ]
          [ div
              [ class "child_edge"
              , style "height" (asPx node.childEdgeHeight)
              ] []
          , Html.node "child-area"
              [ class "child_area"
              , on "childedgeheightchanged" (onChildEdgeHeightChangedDecoder node.id)
              ]
              (childNodes ++ tailBeacons)
          ]
       ]
   ]

viewNodeContents : Node -> ViewState -> Html Msg
viewNodeContents node viewState =
  let
    attributes =
      if viewState.editId == Nothing then
        [ custom "pointerdown" (onPointerDownDecoder node.id) ]
      else
        []
  in
  div
    [ class "label_container"
    , custom "click" (onSelectClickDecoder (Just node.id))
    , custom "dblclick" (onEditLabelClickDecoder node.id)
    ]
    [ Html.node "node-label"
        [ on "labelchanged" (onLabelChangedDecoder node.id)
        , attribute "label" node.label
        ]
        []
    ]
