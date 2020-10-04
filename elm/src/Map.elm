port module Map exposing (main)

import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, classList, style, attribute, id)
import Html.Events exposing (custom, on)
import Json.Decode as Decoder exposing (Decoder, succeed, string, float, field)
import Json.Decode.Pipeline exposing (required, hardcoded)
import Maybe.Extra

import DragControl
import Node exposing (Node, Children(..), childList, idToAttribute, idToShadowAttribute, Id)
import Tree
import UserAction

{- TODOs
 - I think it's overkill to have Vector and not array
 - Refactor a whole lot of this into separate decoders module
 - Test everything
 - Move path functionality into something like Tree.Path
 - maybe write some comments or documentation
 - the beacon finding anchor should depend on where the drag is moving:
    moving down: maybe bot left corner, moving up: maybe top left corner
 - beacon finding should filter to ignore beacons to the right so that
    nodes don't attach as children so much
 - need custom hover to avoid glitchy render?
 -}

type Msg
  = MsgDrag DragControl.Msg
  | MsgOnPointerDown OnPointerDownPortData
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData

type alias Model =
  { nodes : Children
  , state : State
  }

type alias State =
  { action : UserAction.Action
  , drag : Maybe DragControl.State
  }

-- Tree customization
findNode : List Node -> Id -> Maybe Tree.Path
findNode = Tree.findNode childList

updateNode : List Node -> Tree.Path -> (Node -> Node) -> List Node
updateNode = Tree.updateNode Children childList

-- Helpers
asPx : Float -> String
asPx n =
  String.fromInt (round n) ++ "px"

type alias OnPointerDownPortData =
  { targetId : String
  , pointerType : String
  , x : Float
  , y : Float
  }

type alias OnChildEdgeHeightChangedData =
  { targetId : Id
  , height: Float
  }

type alias MsgWithEventOptions =
  { message: Msg
  , stopPropagation: Bool
  , preventDefault: Bool
  }

andStopPropagation : Msg -> MsgWithEventOptions
andStopPropagation msg =
  { message = msg
  , stopPropagation = True
  , preventDefault = False
  }

-- Functionality
onPointerDownDecoder : Id -> Decoder MsgWithEventOptions
onPointerDownDecoder targetId =
  Decoder.map (MsgOnPointerDown >> andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

onChildEdgeHeightChangedDecoder : Id -> Decoder Msg
onChildEdgeHeightChangedDecoder targetId =
  Decoder.map MsgOnChildEdgeHeightChanged
    (succeed OnChildEdgeHeightChangedData
      |> hardcoded targetId
      |> required "detail" (field "height" float))

port portOnPointerDown : OnPointerDownPortData -> Cmd msg

initModel : Model
initModel =
  { nodes =
      Children [ { id = 1
                 , position = { x = 10, y = 10 }
                 , size = { x = 200, y = 50 }
                 , childEdgeHeight = 0
                 , children = Children [ { id = 3
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , childEdgeHeight = 0
                                         , children = Children [ { id = 4
                                                                 , position = { x = 0, y = 0 }
                                                                 , size = { x = 200, y = 50 }
                                                                 , childEdgeHeight = 0
                                                                 , children = Children []
                                                                 }
                                                               ]
                                         },
                                         { id = 5
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , childEdgeHeight = 0
                                         , children = Children []
                                         }
                                       ]
                 }
               , { id = 2
                 , position = { x = 300, y = 20 }
                 , size = { x = 200, y = 50 }
                 , childEdgeHeight = 0
                 , children = Children []
                 }
               ]
  , state = 
      { action = UserAction.Idle
      , drag = Nothing
      }
  }

view : Model -> Html Msg
view model =
  let
      nodes = childList model.nodes
      drawBeacons = model.state.action == UserAction.Dragging
      childrenViewList = List.indexedMap (viewTopNode drawBeacons model.state.drag) nodes
      dragViewList =
        List.map viewDragNode
          (DragControl.getDragNode nodes model.state.drag
            |> Maybe.Extra.toList)
  in
  div [ class "map" ] (childrenViewList ++ dragViewList)

viewDragNode : Node -> Html Msg
viewDragNode node =
  viewTopNode False Nothing -1 node

getViewParams : Bool -> Maybe DragControl.State -> Node -> (String, Bool, Bool)
getViewParams drawBeacons mdragState node =
  -- returning id, shadow, drawChildBeacons
  case mdragState of
    Just dragState ->
      if dragState.dragId == node.id then
        (idToShadowAttribute node.id, True, False)
      else
        (idToAttribute node.id, False, drawBeacons)
    Nothing ->
      (idToAttribute node.id, False, drawBeacons)

viewNodeContents : Node -> Html Msg
viewNodeContents node =
  div
    [ custom "pointerdown" (onPointerDownDecoder node.id)
    , class "selection_container"
    ]
    [ div
        [ class "contents_container" ]
        [ div
            [ class "label" ]
            [ text ("hello " ++ (idToAttribute node.id)) ]
        ]
    ]

viewTopNode : Bool -> Maybe DragControl.State -> Int -> Node -> Html Msg
viewTopNode drawBeacons mdragState index node =
  let
    path = String.fromInt index
    (nodeId, shadow, drawChildBeacons) = getViewParams drawBeacons mdragState node
    onTop = index < 0

    tailBeacons =
      if drawChildBeacons then
        [viewBeacon (path ++ " " ++ (List.length (childList node.children) |> String.fromInt))]
      else
        []

    childNodes =
      childList node.children
        |> List.indexedMap (viewChildNode drawChildBeacons path mdragState)
        |> List.concat
  in
  div
    [ id nodeId
      , class "top_child"
      , classList [("shadow", shadow), ("on_top", onTop)]
      , style "left" (asPx node.position.x)
      , style "top" (asPx node.position.y)
    ]
    [ viewNodeContents node
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

viewChildNode : Bool -> String -> Maybe DragControl.State -> Int -> Node -> List (Html Msg)
viewChildNode drawBeacons parentPath mdragState index node =
  let
    path = parentPath ++ " " ++ String.fromInt index
    (nodeId, shadow, drawChildBeacons) = getViewParams drawBeacons mdragState node

    headBeacons =
      if drawBeacons then
        [viewBeacon path]
      else
        []

    tailBeacons =
      if drawChildBeacons then
        [viewBeacon (path ++ " " ++ (List.length (childList node.children) |> String.fromInt))]
      else
        []

    childNodes =
       childList node.children
         |> List.indexedMap (viewChildNode drawChildBeacons path mdragState)
         |> List.concat
  in
  headBeacons ++
  [ div []
      [ div
          [ id nodeId
          , classList [("child", True), ("shadow", shadow)]
          ]
          [ viewNodeContents node
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

viewBeacon : String -> Html Msg
viewBeacon path =
  div [ class "beacon"
      , attribute "path" path
      ] []


applyChildEdgeHeightChange : Children -> OnChildEdgeHeightChangedData -> Children
applyChildEdgeHeightChange (Children nodes) { targetId, height } =
  let
      mpath = findNode nodes targetId
      updater node = { node | childEdgeHeight = height }
  in
  case mpath of
    Just path ->
      Children (updateNode nodes path updater)
    Nothing ->
      Children nodes

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    MsgOnPointerDown data ->
      -- filter this: primary button only for drag?
      (model, portOnPointerDown data)

    MsgDrag dragMsg ->
      let
          (dragState, nodes, cmd) = DragControl.update dragMsg model.state.drag model.nodes
          oldState = model.state
          state = 
            if dragState == Nothing then
              { oldState | action = UserAction.Idle, drag = Nothing }
            else
              { oldState | action = UserAction.Dragging, drag = dragState }

      in
      ({ model | state = state, nodes = nodes}, Cmd.map MsgDrag cmd)

    MsgOnChildEdgeHeightChanged data ->
      ({ model | nodes = applyChildEdgeHeightChange model.nodes data }, Cmd.none)

init : () -> (Model, Cmd Msg)
init () = (initModel, Cmd.none)

subscriptions : Model -> Sub Msg
subscriptions _ =
  Sub.map MsgDrag (DragControl.subscriptions ())

main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = update
      , subscriptions = subscriptions
      }
