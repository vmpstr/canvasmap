module TreeSpec exposing (findNode, moveNode, nodeAtById, updateNode, removeNode, addNode)

import Tree
import Node exposing (Node, Id, childList, Children(..))

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