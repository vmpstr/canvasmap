module TreeLayout exposing (viewTopNode, viewChildNodes, adjustStateForChildren)

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
  let
    attributes =
        ([ id localState.htmlNodeId
        , class "top_child"
        , classList [("shadow", localState.shadow), ("on_top", onTop)]
        , style "left" (asPx node.position.x)
        , style "top" (asPx node.position.y)
        ]) ++
        (case node.maxWidth of
            Just width -> [ style "max-width" (asPx width) ]
            Nothing -> []
        )
  in
  div
    attributes
    [ viewNodeContents node localState
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

adjustStateForChildren : ViewState -> ViewState
adjustStateForChildren state =
    { state | showParentEdge = True }

viewChildNodes : List (Html Msg) -> List (Html Msg) -> List (Html Msg) -> ViewState  -> Node -> List (Html Msg)
viewChildNodes headBeacons tailBeacons childNodes localState node =
  let
    parentEdge =
        if localState.showParentEdge then
            [ div [ class "parent_edge" ] [] ]
        else
            []

    attributes =
        ([ id localState.htmlNodeId
        , classList [("child", True), ("shadow", localState.shadow)]
        ]) ++
        (case node.maxWidth of
            Just width -> [ style "max-width" (asPx width) ]
            Nothing -> []
        )
  in
  headBeacons ++
  [ div []
      [ div
          attributes
          ([ viewNodeContents node localState ] ++ parentEdge)
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
      ( if viewState.editId == Nothing then
          [ custom "pointerdown" (onPointerDownDecoder node.id) ]
        else
          []
      ) ++
      [ classList
          [ ( "selection_container", True)
          , ( "selected", viewState.selected == Just node.id)
          ]
      ]
  in
  div
    attributes
    [ div
        [ class "contents_container"
        , custom "click" (onSelectClickDecoder (Just node.id))
        , custom "dblclick" (onEditLabelClickDecoder node.id)
        ]
        [ Html.node "node-label"
            [ on "labelchanged" (onLabelChangedDecoder node.id)
            , attribute "label" node.label
            ]
            []
        ]
    , div
        [ class "ew_resizer"
        , custom "pointerdown" (onEwResizePointerDown node.id)
        ]
        []
    ]
