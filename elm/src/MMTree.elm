module MMTree exposing (..)

import List.Extra

type Path
  = AtIndex Int
  | InSubtree Int Path

findNode : (b -> List { c | children : b, id : a })
           -> List { c | children : b, id : a }
           -> a
           -> Maybe Path
findNode unpack nodes target =
  let
      indexed = List.indexedMap Tuple.pair nodes
      results = List.filterMap returnOrRecurse indexed

      returnOrRecurse : (Int, { c | children : b, id : a }) -> Maybe Path
      returnOrRecurse (index, node) =
        if node.id == target then
          Just (AtIndex index)
        else
          case findNode unpack (unpack node.children) target of
            Just result ->
              Just (InSubtree index result)
            Nothing ->
              Nothing
  in
  List.head results

removeNode : (List { c | children : b } -> b)
             -> (b -> List { c | children : b })
             -> List { c | children : b }
             -> Path
             -> List { c | children : b }
removeNode pack unpack nodes path =
  case path of
    AtIndex index ->
      List.Extra.removeAt index nodes
    InSubtree index subpath ->
      let
          recurse node =
            { node | children = pack (removeNode pack unpack (unpack node.children) subpath) }
      in
      List.Extra.updateAt index recurse nodes
