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
import UserAction
import TreeSpec
import MapView exposing (ViewState)
import Utilities
import Html.Events exposing (onDoubleClick)

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
  | MsgEditLabel Id

type alias Model =
  { nodes : Children
  , state : State
  }

type alias State =
  { action : UserAction.Action
  , drag : Maybe DragControl.State
  }

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
port portEditLabel : Id -> Cmd msg

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
      viewState = getInitialViewState model.state
      childrenViewList = List.indexedMap (viewTopNode viewState) nodes
      dragViewList =
        List.map viewDragNode
          (DragControl.getDragNode model.state nodes
            |> Maybe.Extra.toList)
  in
  div [ class "map" ] (childrenViewList ++ dragViewList)

viewDragNode : Node -> Html Msg
viewDragNode node =
  viewTopNode DragControl.dragNodeViewState -1 node

viewNodeContents : Node -> Html Msg
viewNodeContents node =
  div
    [ custom "pointerdown" (onPointerDownDecoder node.id)
    , class "selection_container"
    ]
    [ div
        [ class "contents_container" ]
        [ Html.node "node-label"
            [ onDoubleClick  (MsgEditLabel node.id)
            ,  attribute "label" ("hello " ++ idToAttribute node.id)
            ]
            []
        ]
    ]

viewTopNode : ViewState -> Int -> Node -> Html Msg
viewTopNode parentState index node =
  let
    localState : ViewState
    localState = adjustViewStateForNode index node parentState

    onTop = index < 0
    tailBeacons =
      Utilities.maybeArray
        localState.viewBeacons
        (\() -> viewBeacon localState.tailBeaconPath)
    childNodes =
      childList node.children
        |> List.indexedMap (viewChildNode localState)
        |> List.concat
  in
  div
    [ id localState.htmlNodeId
      , class "top_child"
      , classList [("shadow", localState.shadow), ("on_top", onTop)]
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

viewChildNode : ViewState -> Int -> Node -> List (Html Msg)
viewChildNode parentState index node =
  let
    localState = adjustViewStateForNode index node parentState
    headBeacons =
      Utilities.maybeArray
        parentState.viewBeacons
        (\() -> viewBeacon localState.headBeaconPath)
    tailBeacons =
      Utilities.maybeArray
        localState.viewBeacons
        (\() -> viewBeacon localState.tailBeaconPath)
    childNodes =
       childList node.children
         |> List.indexedMap (viewChildNode localState)
         |> List.concat
  in
  headBeacons ++
  [ div []
      [ div
          [ id localState.htmlNodeId
          , classList [("child", True), ("shadow", localState.shadow)]
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
  let updater node = { node | childEdgeHeight = height } in
  case TreeSpec.findNode nodes targetId of
    Just path ->
      Children (TreeSpec.updateNode nodes path updater)
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
          (state, nodes, cmd) = DragControl.update dragMsg (model.state, model.nodes)
      in
      ({ model | state = state, nodes = nodes}, Cmd.map MsgDrag cmd)

    MsgOnChildEdgeHeightChanged data ->
      ({ model | nodes = applyChildEdgeHeightChange model.nodes data }, Cmd.none)

    MsgEditLabel nodeId ->
      let
          state = applyEditLabelState model.state
      in
      ({ model | state = state }, portEditLabel nodeId)

init : () -> (Model, Cmd Msg)
init () = (initModel, Cmd.none)

applyEditLabelState : State -> State
applyEditLabelState state =
  { state | action = UserAction.Editing, drag = Nothing }

subscriptions : Model -> Sub Msg
subscriptions _ =
  Sub.map MsgDrag (DragControl.subscriptions ())

initialViewStateAdjusters : State -> List (ViewState -> ViewState)
initialViewStateAdjusters state =
  [ DragControl.adjustInitialViewState state
  ]

viewStateAdjustersForNode : Int -> Node -> List (ViewState -> ViewState)
viewStateAdjustersForNode index node =
  [ DragControl.adjustViewStateForNode index node
  ]

getInitialViewState : State -> ViewState
getInitialViewState state =
  Utilities.listApply
    MapView.defaultViewState
    (initialViewStateAdjusters state)

adjustViewStateForNode : Int -> Node -> ViewState -> ViewState
adjustViewStateForNode index node viewState =
  Utilities.listApply
    viewState
    (viewStateAdjustersForNode index node)



main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = update
      , subscriptions = subscriptions
      }
