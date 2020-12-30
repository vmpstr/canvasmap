module ScrollerLayout exposing (viewTopNode, viewChildNodes, adjustStateForChildren)

import DragControl
import EventDecoders exposing (..)
import Html exposing (Html, div, text)
import Html.Attributes exposing (attribute, id, style, class, classList)
import Html.Events exposing (on, custom)
import MapMsg exposing (Msg(..))
import MapView exposing (ViewState)
import Node exposing (Node, Children(..), childList, Id, NodeType(..))
import NodeUtils exposing (idToAttribute, idToShadowAttribute)
import ResizeControl
import Utils exposing (asPx)
import NodeControl


viewTopNode : Bool -> List (Html Msg) -> List (Html Msg) -> ViewState -> Node -> Html Msg
viewTopNode onTop tailBeacons childNodes localState node =
  div
    ([ id localState.htmlNodeId
      , class "top_child"
      , class "scroller"
      , classList [("shadow", localState.shadow), ("on_top", onTop)]
      , style "left" (asPx node.position.x)
      , style "top" (asPx node.position.y)
    ] ++
    (case node.maxWidth of
        Just width -> [ style "max-width" (asPx width) ]
        Nothing -> []
    ) ++
    (case node.maxHeight of
        Just height -> [ style "max-height" (asPx height) ]
        Nothing -> []
    ))
    [ viewNodeContents node localState childNodes tailBeacons ]

adjustStateForChildren : ViewState -> ViewState
adjustStateForChildren state =
    { state | showParentEdge = False }

viewChildNodes : List (Html Msg) -> List (Html Msg) -> List (Html Msg) -> ViewState  -> Node -> List (Html Msg)
viewChildNodes headBeacons tailBeacons childNodes localState node =
  headBeacons ++
  [ div []
      [ div
          ([ id localState.htmlNodeId
          , class "child"
          , class "scroller"
          , classList [("shadow", localState.shadow)]
          ] ++
          (case node.maxWidth of
              Just width -> [ style "max-width" (asPx width) ]
              Nothing -> []
          ) ++
          (case node.maxHeight of
              Just height -> [ style "max-height" (asPx height) ]
              Nothing -> []
          ))
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
      , NodeControl.onSelectAttribute MsgNode node.id
      ] ++
      if viewState.editId == Nothing then
        [ Html.Attributes.map MsgDrag (DragControl.onDragAttribute node.id) ]
      else
        []
  in
  div
      attributes
      [ div
        [ class "label_container"
        , NodeControl.onEditLabelAttribute MsgNode node.id
        ]
        [ Html.node "node-label"
            [ NodeControl.onLabelChangedAttribute MsgNode node.id
            , attribute "label" node.label
            ]
            []
        ]
      , div [ class "divider" ] []
      , div
          [ class "child_area" ] 
          (childNodes ++ tailBeacons)
      , Html.map MapMsg.MsgResize (ResizeControl.ewResizer node.id)
      , Html.map MapMsg.MsgResize (ResizeControl.nsResizer node.id)
      , Html.map MapMsg.MsgResize (ResizeControl.nsewResizer node.id)
      ]