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



smallTree : Tree
smallTree =
  Tree [ { id = "123",
           children = Tree [ { id = "234"
                             , children = Tree []
                             }
                           ]
         }
       , { id = "345",
           children = Tree []
         }
       ]

suite : Test
suite =
  describe "MMTree module"
    [ describe "findNode"
        [ test "found at index 0" <|
            \_ ->
              Expect.equal
                (MMTree.findNode unpack (unpack smallTree) "123")
                (Just (AtIndex 0))
        , test "found at index 1" <|
            \_ ->
              Expect.equal
                (MMTree.findNode unpack (unpack smallTree) "345")
                (Just (AtIndex 1))
        , test "found in subtree" <|
            \_ ->
              Expect.equal
                (MMTree.findNode unpack (unpack smallTree) "234")
                (Just (InSubtree 0 (AtIndex 0)))
        , test "not found" <|
            \_ ->
              Expect.equal
                (MMTree.findNode unpack (unpack smallTree) "777")
                Nothing
        ]
    ]




                    
