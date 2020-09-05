module MMTreeTest exposing (..)

import MMTree exposing (..)

import Expect exposing (Expectation)
import Fuzz exposing (Fuzzer, int, list, string)
import Test exposing (..)

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


findNode = MMTree.findNode unpack

smallTree : Tree
smallTree =
  Tree [ { id = "123"
         , children = Tree [ { id = "234" , children = Tree [] } ]
         }
       , { id = "345",
         , children = Tree []
         }
       ]

smallTreeNodes = unpack smallTree

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
    ]




                    
