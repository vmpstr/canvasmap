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
import Html exposing (label)

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
  | MsgOnLabelChanged OnLabelChangedData
  | MsgEditLabel Id

type alias Model =
  { nodes : Children
  , state : State
  }

-- action should just include the state
type alias State =
  { action : UserAction.Action
  , drag : Maybe DragControl.State
  , editing : Maybe Id
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

type alias OnLabelChangedData =
  { targetId : Id
  , label : String
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
onLabelChangedDecoder : Id -> Decoder Msg
onLabelChangedDecoder targetId =
  Decoder.map MsgOnLabelChanged
    (succeed OnLabelChangedData
      |> hardcoded targetId
      |> required "detail" (field "label" string))

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
port portEditLabel : { targetId : String } -> Cmd msg

initModel : Model
initModel =
  { nodes =
      Children [ { id = 1
                 , label = "label1"
                 , position = { x = 10, y = 10 }
                 , size = { x = 200, y = 50 }
                 , childEdgeHeight = 0
                 , children = Children [ { id = 3
                                         , label = "label3"
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , childEdgeHeight = 0
                                         , children = Children [ { id = 4
                                                                 , label = "label4"
                                                                 , position = { x = 0, y = 0 }
                                                                 , size = { x = 200, y = 50 }
                                                                 , childEdgeHeight = 0
                                                                 , children = Children []
                                                                 }
                                                               ]
                                         },
                                         { id = 5
                                         , label = "label5"
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , childEdgeHeight = 0
                                         , children = Children []
                                         }
                                       ]
                 }
               , { id = 2
                 , label = "label2"
                 , position = { x = 300, y = 20 }
                 , size = { x = 200, y = 50 }
                 , childEdgeHeight = 0
                 , children = Children []
                 }
               ]
  , state = 
      { action = UserAction.Idle
      , drag = Nothing
      , editing = Nothing
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

viewNodeContents : Node -> Bool -> Html Msg
viewNodeContents node needPointerDown =
  let
    attributes =
      if needPointerDown then
        [ custom "pointerdown" (onPointerDownDecoder node.id)
        , class "selection_container"
        ]
      else
        [ class "selection_container" ]
  in
  div
    attributes
    [ div
        [ class "contents_container"
        , onDoubleClick  (MsgEditLabel node.id)
        ]
        [ Html.node "node-label"
            [ on "labelchanged" (onLabelChangedDecoder node.id)
            , attribute "label" node.label
            ]
            []
        ]
    ]

viewTopNode : ViewState -> Int -> Node -> Html Msg
viewTopNode parentState index node =
  let
    localState : ViewState
    localState = getViewStateForNode index node parentState

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
    [ viewNodeContents node (localState.editId == Nothing)
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
    localState = getViewStateForNode index node parentState
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
          [ viewNodeContents node (localState.editId == Nothing)
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
          state = applyEditLabelState model.state nodeId
      in
      ({ model | state = state }, portEditLabel { targetId = idToAttribute nodeId })

    MsgOnLabelChanged data ->
      let
          nodes = applyLabelChange model.nodes data.targetId data.label
          state = endEditLabelState model.state
      in
      ({ model | nodes = nodes, state = state }, Cmd.none)


init : () -> (Model, Cmd Msg)
init () = (initModel, Cmd.none)

applyLabelChange : Children -> Id -> String -> Children
applyLabelChange (Children nodes) targetId label =
  let updater node = { node | label = label } in
  case TreeSpec.findNode nodes targetId of
    Just path ->
      Children (TreeSpec.updateNode nodes path updater)
    Nothing ->
      Children nodes

endEditLabelState : State -> State
endEditLabelState state =
  { state | action = UserAction.Idle, drag = Nothing, editing = Nothing }

applyEditLabelState : State -> Id -> State
applyEditLabelState state id =
  { state | action = UserAction.Editing, drag = Nothing, editing = Just id }

subscriptions : Model -> Sub Msg
subscriptions _ =
  Sub.map MsgDrag (DragControl.subscriptions ())

initialViewStateAdjusters : State -> List (ViewState -> ViewState)
initialViewStateAdjusters state =
  [ DragControl.adjustInitialViewState state
  , adjustInitialViewState state
  ]

viewStateAdjustersForNode : Int -> Node -> List (ViewState -> ViewState)
viewStateAdjustersForNode index node =
  [ DragControl.adjustViewStateForNode index node
  , adjustViewStateForNode index node
  ]

getInitialViewState : State -> ViewState
getInitialViewState state =
  Utilities.listApply
    MapView.defaultViewState
    (initialViewStateAdjusters state)

getViewStateForNode : Int -> Node -> ViewState -> ViewState
getViewStateForNode index node viewState =
  Utilities.listApply
    viewState
    (viewStateAdjustersForNode index node)

adjustInitialViewState : State -> ViewState -> ViewState
adjustInitialViewState state viewState =
  { viewState | editId = state.editing }

adjustViewStateForNode : Int -> Node -> ViewState -> ViewState
adjustViewStateForNode _ _ viewState = viewState



main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = update
      , subscriptions = subscriptions
      }
