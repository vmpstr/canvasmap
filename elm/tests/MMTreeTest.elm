module MMTreeTest exposing (suite)

import MMTree exposing (Path(..))

import Expect
import Test exposing (Test, describe, test)

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

smallTreeNodes : List Node
smallTreeNodes = unpack smallTree

-- Testing function

findNode : List Node -> String -> Maybe Path
findNode = MMTree.findNode unpack

removeNode : List Node -> Path -> List Node
removeNode = MMTree.removeNode pack unpack

takeNode : List Node -> Path -> (Maybe Node, List Node)
takeNode = MMTree.takeNode pack unpack

nodeAt : List Node -> Path -> Maybe Node
nodeAt = MMTree.nodeAt unpack

addNode : List Node -> Path -> Node -> List Node
addNode = MMTree.addNode pack unpack

moveNode : List Node -> Path -> Path -> List Node
moveNode = MMTree.moveNode pack unpack

isValidInsertionPath : List Node -> Path -> Bool
isValidInsertionPath = MMTree.isValidInsertionPath unpack

-- Helpers

nodesToString : List Node -> String
nodesToString nodes =
  case nodes of
    (first :: allbutone) ->
      let
          sub =
            if first.children == pack [] then
              ""
            else
              "(" ++ nodesToString (unpack first.children) ++ ")"
      in
      case allbutone of
        (_ :: _) ->
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
    , describe "addNode"
        [ test "grandchild" <|
            \_ ->
                let
                    nodes = addNode
                              smallTreeNodes
                              (InSubtree 0 (InSubtree 0 (AtIndex 0)))
                              { id = "7", children = Tree [] }
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234(7)) 345"
        , test "before child" <|
            \_ ->
                let
                    nodes = addNode
                              smallTreeNodes
                              (InSubtree 0 (AtIndex 0))
                              { id = "7", children = Tree [] }
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(7 234) 345"
        , test "after child" <|
            \_ ->
                let
                    nodes = addNode
                              smallTreeNodes
                              (InSubtree 0 (AtIndex 1))
                              { id = "7", children = Tree [] }
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234 7) 345"
        , test "between nodes" <|
            \_ ->
                let
                    nodes = addNode
                              smallTreeNodes
                              (AtIndex 1)
                              { id = "7", children = Tree [] }
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 7 345"
        , test "after last node" <|
            \_ ->
                let
                    nodes = addNode
                              smallTreeNodes
                              (AtIndex 2)
                              { id = "7", children = Tree [] }
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345 7"
        , test "non-possible location" <|
            \_ ->
                let
                    nodes = addNode
                              smallTreeNodes
                              (AtIndex 3)
                              { id = "7", children = Tree [] }
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        ]
    , describe "moveNode"
        [ test "leaf to sibling before" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (InSubtree 0 (AtIndex 0))
                              (AtIndex 0)
                in
                Expect.equal
                  (nodesToString nodes)
                  "234 123 345"
        , test "leaf to sibling after" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (InSubtree 0 (AtIndex 0))
                              (AtIndex 1)
                in
                Expect.equal
                  (nodesToString nodes)
                  "123 234 345"
        , test "leaf to sibling last" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (InSubtree 0 (AtIndex 0))
                              (AtIndex 2)
                in
                Expect.equal
                  (nodesToString nodes)
                  "123 345 234"
        , test "leaf child of sibling" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (InSubtree 0 (AtIndex 0))
                              (InSubtree 1 (AtIndex 0))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123 345(234)"
        , test "parent to self-child prepend (not-possible)" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (InSubtree 0 (AtIndex 0))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "parent to self-child append (not-possible)" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (InSubtree 0 (AtIndex 1))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "same path short" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (AtIndex 0)
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "same path long" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (InSubtree 0 (AtIndex 0))
                              (InSubtree 0 (AtIndex 0))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "try to reorder sibling (but same spot)" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (AtIndex 1)
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "reorder sibling to after" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (AtIndex 2)
                in
                Expect.equal
                  (nodesToString nodes)
                  "345 123(234)"
        , test "reorder sibling to after (too far)" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (AtIndex 3)
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "subtree to nest under sibling" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (InSubtree 1 (AtIndex 0))
                in
                Expect.equal
                  (nodesToString nodes)
                  "345(123(234))"
        , test "reorder sibling to before" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 1)
                              (AtIndex 0)
                in
                Expect.equal
                  (nodesToString nodes)
                  "345 123(234)"
        , test "sibling to child before" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 1)
                              (InSubtree 0 (AtIndex 0))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(345 234)"
        , test "sibling to child after" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 1)
                              (InSubtree 0 (AtIndex 1))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234 345)"
        , test "sibling to child after (too far)" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 1)
                              (InSubtree 0 (AtIndex 2))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "sibling to grandchild" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 1)
                              (InSubtree 0 (InSubtree 0 (AtIndex 0)))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234(345))"
        , test "to non-existent" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (AtIndex 0)
                              (InSubtree 3 (AtIndex 0))
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        , test "from non-existent" <|
            \_ ->
                let
                    nodes = moveNode
                              smallTreeNodes
                              (InSubtree 3 (AtIndex 0))
                              (AtIndex 0)
                in
                Expect.equal
                  (nodesToString nodes)
                  "123(234) 345"
        ]
    , describe "isValidInsertionPath"
        [ test "before 123" <|
            \_ ->
                Expect.true "before 123"
                  (isValidInsertionPath smallTreeNodes (AtIndex 0))
        , test "before 234" <|
            \_ ->
                Expect.true "before 234"
                  (isValidInsertionPath smallTreeNodes (InSubtree 0 (AtIndex 0)))
        , test "before 345" <|
            \_ ->
                Expect.true "before 345"
                  (isValidInsertionPath smallTreeNodes (AtIndex 1))
        , test "after 234" <|
            \_ ->
                Expect.true "after 234"
                  (isValidInsertionPath smallTreeNodes (InSubtree 0 (AtIndex 1)))
        , test "after 345" <|
            \_ ->
                Expect.true "after 345"
                  (isValidInsertionPath smallTreeNodes (AtIndex 2))
        , test "grandchild" <|
            \_ ->
                Expect.true "grandchild"
                  (isValidInsertionPath smallTreeNodes (InSubtree 0 (InSubtree 0 (AtIndex 0))))
        , test "past siblings + 1" <|
            \_ ->
                Expect.false "past siblings"
                  (isValidInsertionPath smallTreeNodes (AtIndex 3))
        , test "past child + 1" <|
            \_ ->
                Expect.false "past siblings"
                  (isValidInsertionPath smallTreeNodes (InSubtree 0 (AtIndex 2)))
        ]
    ]




                    
