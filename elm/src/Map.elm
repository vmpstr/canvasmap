port module Map exposing (main)

import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, classList, style, attribute, id)
import Html.Events exposing (custom, on)
import Json.Decode as Decoder exposing (Decoder, succeed, string, float, field)
import Json.Decode.Pipeline exposing (required, hardcoded)
import Json.Encode as Encode
import Maybe.Extra

import DragControl
import Node exposing (Node, Children(..), childList, idToAttribute, idToShadowAttribute, Id)
import UserAction
import TreeSpec
import MapView exposing (ViewState)
import Utilities
import Html.Events exposing (onDoubleClick)
import Html exposing (label)
import Geometry
import Utilities exposing (toMsgOrNoop)
import Tree

{- TODOs
 - I think it's overkill to have Vector and not array
 - Refactor a whole lot of this into separate decoders module
 - Test everything
 - maybe write some comments or documentation
 - the beacon finding anchor should depend on where the drag is moving:
    moving down: maybe bot left corner, moving up: maybe top left corner
 - selection gets removed after drag is finished
 -}

type Msg
  = MsgDrag DragControl.Msg
  | MsgNoop
  | MsgOnPointerDown OnPointerDownPortData
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData
  | MsgOnLabelChanged OnLabelChangedData
  | MsgEditLabel Id
  | MsgSetNodes Children
  | MsgNewNode Tree.Path Node
  | MsgSelectNode (Maybe Id)
  | MsgDeleteNode Id
  | MsgMapKeyDown Key

type alias Key =
  { code : String }

type alias Model =
  { nodes : Children
  , state : State
  }

-- action should just include the state
type alias State =
  { action : UserAction.Action
  , drag : Maybe DragControl.State
  , editing : Maybe Id
  , selected : Maybe Id
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

keyDecoder : Decoder Key
keyDecoder =
  succeed Key
    |> required "code" string

onSelectClickDecoder : Maybe Id -> Decoder MsgWithEventOptions
onSelectClickDecoder targetId =
  Decoder.map (MsgSelectNode >> andStopPropagation)
    (succeed targetId)

onEditLabelClickDecoder : Id -> Decoder MsgWithEventOptions
onEditLabelClickDecoder targetId =
  Decoder.map (MsgEditLabel >> andStopPropagation)
    (succeed targetId)

type alias FlatNode =
  { id : Int
  , label : String
  , x : Float
  , y : Float
  , width : Float
  , height : Float
  , childEdgeHeight : Float
  , children : Children
  }

newNodeOffset : Geometry.Vector
newNodeOffset =
  { x = -40.0
  , y = -20.0
  }

flatNodeToNode : FlatNode -> Node
flatNodeToNode f =
  { id = f.id
  , label = f.label
  , position = Geometry.add (Geometry.Vector f.x f.y) newNodeOffset
  , size = Geometry.Vector f.width f.height
  , childEdgeHeight = f.childEdgeHeight
  , children = f.children
  }

findMaxId : Children -> Int
findMaxId (Children nodes) =
  Maybe.withDefault
    0
    (List.maximum
      ( (List.map .id nodes)
        ++ (List.map (\node -> findMaxId node.children) nodes)
      )
    )

newNode : Children -> Node
newNode children =
  { id = (findMaxId children) + 1
  , label = "new item"
  , position = Geometry.Vector 0 0
  , size = Geometry.Vector 0 0
  , childEdgeHeight = 0
  , children = Children []
  }

onAddNewNodeClickDecoder : Children -> Decoder MsgWithEventOptions
onAddNewNodeClickDecoder children =
  Decoder.map (MsgNewNode (Tree.AtIndex 0) >> andStopPropagation)
    (Decoder.map flatNodeToNode
      (succeed FlatNode
        |> hardcoded ((findMaxId children) + 1)
        |> hardcoded "new item"
        |> required "clientX" float
        |> required "clientY" float
        |> hardcoded 0.0
        |> hardcoded 0.0
        |> hardcoded 0.0
        |> hardcoded (Children [])))
    
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
port portSaveState : Encode.Value -> Cmd msg
port portLoadState : () -> Cmd msg

initModel : Model
initModel =
  { nodes = Children []
  , state = 
      { action = UserAction.Idle
      , drag = Nothing
      , editing = Nothing
      , selected = Nothing
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
  div
    [ class "map"
    , custom "dblclick" (onAddNewNodeClickDecoder model.nodes)
    , custom "click" (onSelectClickDecoder Nothing)
    ]
    (childrenViewList ++ dragViewList)

viewDragNode : Node -> Html Msg
viewDragNode node =
  viewTopNode DragControl.dragNodeViewState -1 node

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

updateAndSave : Msg -> Model -> (Model, Cmd Msg)
updateAndSave msg model =
  let
    (newModel, cmd) = update msg model
    isDelete =
      case msg of
        MsgDeleteNode _ -> True
        _ -> False

    saveCmd =
      -- TODO: Make this more elegant somehow (remove not isdelete?)
      if (not isDelete) && model.state.action == newModel.state.action then
        Cmd.none
      else
        encodeNodes newModel.nodes |> portSaveState
  in
  (newModel, [cmd, saveCmd] |> Cmd.batch)


encodeVector : Geometry.Vector -> Encode.Value
encodeVector v =
  Encode.object
    [ ("x", Encode.float v.x )
    , ("y", Encode.float v.y )
    ]

encodeId : Id -> Encode.Value
encodeId id =
  Encode.int id

encodeNode : Node -> Encode.Value
encodeNode node =
  Encode.object
    [ ("id", encodeId node.id)
    , ("label", Encode.string node.label)
    , ("position", encodeVector node.position)
    , ("size", encodeVector node.size)
    , ("children", encodeNodes node.children)
    ]

encodeNodes : Children -> Encode.Value
encodeNodes (Children nodes) =
  Encode.list encodeNode nodes

nodeDecoder : Decoder Node
nodeDecoder =
  succeed Node
    |> required "id" Decoder.int
    |> required "label" Decoder.string
    |> required "position" Geometry.vectorDecoder
    |> required "size" Geometry.vectorDecoder
    |> hardcoded 0.0
    |> required "children" (Decoder.lazy (\() -> nodesDecoder))

nodesDecoder : Decoder Children
nodesDecoder =
  Decoder.map Children (Decoder.list nodeDecoder)

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

    MsgNoop ->
      (model, Cmd.none)

    -- TODO: have a loading state so that we don't do anything before this.
    MsgSetNodes children ->
      ({ model | nodes = children }, Cmd.none)

    MsgNewNode path node ->
      let 
        state = selectNode model.state (Just node.id)
      in
      update
        (MsgEditLabel node.id)
        { model
          | nodes = insertChild model.nodes path node
          , state = state
        }

    MsgSelectNode id ->
      let
        state = selectNode model.state id
      in
      ({ model | state = state }, Cmd.none)

    MsgDeleteNode id ->
      let
        state =
          if model.state.selected == Just id then
            selectNode model.state Nothing
          else
            model.state
      in
      ({ model | nodes = removeChild model.nodes id, state = state }, Cmd.none)

    MsgMapKeyDown key ->
      handleMapKeyDown key.code model


handleMapKeyDown : String -> Model -> (Model, Cmd Msg)
handleMapKeyDown key model =
  if key == "Backspace" || key == "Delete" then
    case model.state.selected of
       Just id ->
        -- We need to use updateAndSave here so that we intercept MsgDeleteNode
        -- and save state.
        updateAndSave (MsgDeleteNode id) model
       Nothing ->
        update MsgNoop model
  -- TODO: support Editing as well, but need to stop editing
  -- This seems to work already. How?
  else if key == "Tab" && model.state.action == UserAction.Idle then
    case model.state.selected of
      Just id ->
        let mpath = pathToFirstChildOfId model.nodes id in
        case mpath of
          Just path ->
            update (MsgNewNode path (newNode model.nodes)) model
          Nothing ->
            update MsgNoop model
      Nothing -> 
        update MsgNoop model
  else if key == "Enter" && model.state.action == UserAction.Idle then
    case model.state.selected of
      Just id ->
        let mpath = pathToNextSiblingOfId model.nodes id in
        case mpath of
          Just ppath ->
            update (MsgNewNode path (newNode model.nodes)) Model
          Nothing ->
            update MsgNoop Model
      Nothing ->
        update MsgNoop model    
  else
    update MsgNoop model

pathToNextSiblingOfId : Children -> Id -> Maybe Tree.Path
pathToNextSiblingOfId (Children nodes) id =
  case TreeSpec.findNode nodes id of
    Just path ->
      Just (Tree.incrementBase path)
    Nothing ->
      Nothing

pathToFirstChildOfId : Children -> Id -> Maybe Tree.Path
pathToFirstChildOfId (Children nodes) id =
  case TreeSpec.findNode nodes id of
    Just path ->
      Just (Tree.appendPath 0 (Just path))
    Nothing ->
      Nothing

selectNode : State -> Maybe Id -> State
selectNode state id =
  { state | selected = id }

insertChild : Children -> Tree.Path -> Node -> Children
insertChild (Children nodes) path node =
  Children (TreeSpec.addNode nodes path node)

removeChild : Children -> Id -> Children
removeChild (Children nodes) id =
  let
    mpath = TreeSpec.findNode nodes id
  in
  case mpath of
    Just path ->
      Children (TreeSpec.removeNode nodes path)
    Nothing ->
      Children nodes


init : () -> (Model, Cmd Msg)
init () = (initModel, portLoadState ())

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

port portOnLoadState : (Decoder.Value -> msg) -> Sub msg

onLoadStateSubscription : Sub Msg
onLoadStateSubscription =
  portOnLoadState
    (Decoder.decodeValue nodesDecoder >> toMsgOrNoop MsgSetNodes MsgNoop)

port portOnKeyDown : (Decoder.Value -> msg) -> Sub msg

onKeyDownSubscription : Sub Msg
onKeyDownSubscription =
  portOnKeyDown
    (Decoder.decodeValue keyDecoder >> toMsgOrNoop MsgMapKeyDown MsgNoop)

subscriptions : Model -> Sub Msg
subscriptions _ =
  [ Sub.map MsgDrag (DragControl.subscriptions ())
  , onLoadStateSubscription
  , onKeyDownSubscription
  ] |> Sub.batch

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
  { viewState
    | editId = state.editing
    , selected = state.selected
  }

adjustViewStateForNode : Int -> Node -> ViewState -> ViewState
adjustViewStateForNode _ _ viewState = viewState



main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = updateAndSave
      , subscriptions = subscriptions
      }
