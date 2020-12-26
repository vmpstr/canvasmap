module TreeSpec exposing (findNode, moveNode, nodeAtById, updateNode, removeNode, addNode, findMaxId, updateNodeById)

import Tree
import Node exposing (Node, Id, Children(..), childList)

findNode : List Node -> Id -> Maybe Tree.Path
findNode = Tree.findNode childList

moveNode : List Node -> Tree.Path -> Tree.Path -> List Node
moveNode = Tree.moveNode Children childList

nodeAtById : List Node -> Id -> Maybe Node
nodeAtById = Tree.nodeAtById childList

updateNode : List Node -> Tree.Path -> (Node -> Node) -> List Node
updateNode = Tree.updateNode Children childList

removeNode : List Node -> Tree.Path -> List Node
removeNode = Tree.removeNode Children childList

addNode : List Node -> Tree.Path -> Node -> List Node
addNode = Tree.addNode Children childList

findMaxId : Children -> Int
findMaxId (Children nodes) =
  Maybe.withDefault
    0
    (List.maximum
      ( (List.map .id nodes)
        ++ (List.map (\node -> findMaxId node.children) nodes)
      )
    )

updateNodeById : List Node -> Id -> (Node -> Node) -> List Node
updateNodeById nodes id updater =
  case findNode nodes id of
    Just path -> updateNode nodes path updater
    Nothing -> nodes
