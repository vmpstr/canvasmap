module MMTreeTest exposing (..)

import MMTree exposing (Path(..))

import Expect exposing (Expectation)
import Fuzz exposing (Fuzzer, int, list, string)
import Test exposing (..)

-- Data

type alias Node =
  { id : String
  , children : Tree
  }

type Tree = Tree (List Node)

unpack : Tree -> List Node
unpack (Tree nodes) =
  nodes

pack : List Node -> Tree
pack = Tree

smallTree : Tree
smallTree =
  Tree [ { id = "123"
         , children = Tree [ { id = "234" , children = Tree [] } ]
         }
       , { id = "345"
         , children = Tree []
         }
       ]

smallTreeNodes = unpack smallTree

-- Testing function

findNode = MMTree.findNode unpack

removeNode = MMTree.removeNode pack unpack

takeNode = MMTree.takeNode pack unpack

nodeAt = MMTree.nodeAt unpack

-- Helpers

nodesToString : List Node -> String
nodesToString nodes =
  case nodes of
    (first :: allbutone) ->
      let
          sub =
            if first.children == (pack []) then
              ""
            else
              "(" ++ nodesToString (unpack first.children) ++ ")"
      in
      case allbutone of
        (second :: rest) ->
          first.id ++ sub ++ " " ++ nodesToString allbutone
        [] ->
          first.id ++ sub
    [] ->
      ""

nodeIdOrNull : Maybe Node -> String
nodeIdOrNull maybeNode =
  case maybeNode of
    Just node ->
      node.id
    Nothing ->
      "null"

-- Tests

suite : Test
suite =
  describe "MMTree module"
    [ describe "findNode"
        [ test "found at index 0" <|
            \_ ->
              Expect.equal
                (findNode smallTreeNodes "123")
                (Just (AtIndex 0))
        , test "found at index 1" <|
            \_ ->
              Expect.equal
                (findNode smallTreeNodes "345")
                (Just (AtIndex 1))
        , test "found in subtree" <|
            \_ ->
              Expect.equal
                (findNode smallTreeNodes "234")
                (Just (InSubtree 0 (AtIndex 0)))
        , test "not found" <|
            \_ ->
              Expect.equal
                (findNode smallTreeNodes "777")
                Nothing
        ]
    , describe "removeNode"
        [ test "remove child" <|
            \_ ->
                let
                    resultingNodes = removeNode smallTreeNodes (InSubtree 0 (AtIndex 0))
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  result
                  "123 345"
        , test "remove leaf" <|
            \_ ->
                let
                    resultingNodes = removeNode smallTreeNodes (AtIndex 1)
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  result
                  "123(234)"
        , test "remove inner" <|
            \_ ->
                let
                    resultingNodes = removeNode smallTreeNodes (AtIndex 0)
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  result
                  "345"
        , test "remove non-existent" <|
            \_ ->
                let
                    resultingNodes = removeNode smallTreeNodes (InSubtree 0 (AtIndex 3))
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  result
                  "123(234) 345"
        ]
    , describe "takeNode"
        [ test "take child" <|
            \_ ->
                let
                    (node, resultingNodes) = takeNode smallTreeNodes (InSubtree 0 (AtIndex 0))
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  (result, nodeIdOrNull node)
                  ("123 345", "234")
        , test "take leaf" <|
            \_ ->
                let
                    (node, resultingNodes) = takeNode smallTreeNodes (AtIndex 1)
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  (result, nodeIdOrNull node)
                  ("123(234)", "345")
        , test "take inner" <|
            \_ ->
                let
                    (node, resultingNodes) = takeNode smallTreeNodes (AtIndex 0)
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  (result, nodeIdOrNull node)
                  ("345", "123")
        , test "take non-existent" <|
            \_ ->
                let
                    (node, resultingNodes) = takeNode smallTreeNodes (InSubtree 0 (AtIndex 3))
                    result = nodesToString resultingNodes
                in
                Expect.equal
                  (result, nodeIdOrNull node)
                  ("123(234) 345", "null")
        ]
    , describe "nodeAt"
        [ test "child" <|
            \_ ->
                let
                    node = nodeAt smallTreeNodes (InSubtree 0 (AtIndex 0))
                in
                Expect.equal
                  (nodeIdOrNull node)
                  "234"
        , test "take leaf" <|
            \_ ->
                let
                    node = nodeAt smallTreeNodes (AtIndex 1)
                in
                Expect.equal
                  (nodeIdOrNull node)
                  "345"
        , test "take inner" <|
            \_ ->
                let
                    node = nodeAt smallTreeNodes (AtIndex 0)
                in
                Expect.equal
                  (nodeIdOrNull node)
                  "123"
        , test "take non-existent" <|
            \_ ->
                let
                    node = nodeAt smallTreeNodes (InSubtree 0 (AtIndex 3))
                in
                Expect.equal
                  (nodeIdOrNull node)
                  "null"
        ]
    ]




                    
