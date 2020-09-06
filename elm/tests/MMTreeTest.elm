module MMTreeTest exposing (..)

import MMTree exposing (..)

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
        ]
    ]




                    
