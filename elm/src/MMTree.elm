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
            { node |
                children
                  = pack (removeNode pack unpack (unpack node.children) subpath)
            }
      in
      List.Extra.updateAt index recurse nodes


takeNode : (List { c | children : b } -> b)
           -> (b -> List { c | children : b })
           -> List { c | children : b }
           -> Path
           -> (Maybe { c | children : b }, List { c | children : b })
takeNode pack unpack nodes path =
  let
      node = nodeAt unpack nodes path
  in
  (node, removeNode pack unpack nodes path)


nodeAt : (b -> List { c | children : b })
         -> List { c | children : b }
         -> Path
         -> Maybe { c | children : b }
nodeAt unpack nodes path =
  case path of
    InSubtree index subpath ->
      case List.Extra.getAt index nodes of
        Just node ->
          nodeAt unpack (unpack node.children) subpath
        Nothing ->
          Nothing
    AtIndex index ->
      List.Extra.getAt index nodes


addNode : (List { c | children : b } -> b)
          -> (b -> List { c | children : b })
          -> List { c | children : b }
          -> Path
          -> { c | children : b }
          -> List { c | children : b }
addNode pack unpack nodes path newNode =
  case path of
    InSubtree index subpath ->
      let
          recurse node =
            { node |
                children
                  = pack (addNode pack unpack (unpack node.children) subpath newNode)
            }
      in
      List.Extra.updateAt index recurse nodes
    AtIndex index ->
      if List.length nodes < index then
        nodes
      else
        let
            head = List.take index nodes
            tail = List.drop index nodes
        in
        head ++ newNode :: tail

moveNode : (List { c | children : b } -> b)
           -> (b -> List { c | children : b })
           -> List { c | children : b }
           -> Path
           -> Path
           -> List { c | children : b }
moveNode pack unpack nodes from to =
  let
      (removed, removedResult) = takeNode pack unpack nodes from
      maybeAdjustedTo = adjustPathAfterRemoval from to
  in
  case maybeAdjustedTo of
    Just adjustedTo ->
      case removed of
        Just node ->
          if isValidInsertionPath unpack removedResult adjustedTo then
            addNode pack unpack removedResult adjustedTo node
          else
            nodes
        Nothing ->
          nodes
    Nothing ->
      nodes


isValidPath : (b -> List { c | children : b })
              -> List { c | children : b }
              -> Path
              -> Bool
isValidPath unpack nodes path =
  case path of
    InSubtree index subpath ->
      let
        tail = List.drop index nodes
      in
      case tail of
        (first :: rest) ->
          isValidPath unpack (unpack first.children) subpath
        _ ->
          False
    AtIndex index ->
      List.length nodes > index

isValidInsertionPath : (b -> List { c | children : b })
                        -> List { c | children : b }
                        -> Path
                        -> Bool
isValidInsertionPath unpack nodes path =
  case path of
    InSubtree index subpath ->
      let
        tail = List.drop index nodes
      in
      case tail of
        (first :: rest) ->
          isValidInsertionPath unpack (unpack first.children) subpath
        _ ->
          False
    AtIndex index ->
      List.length nodes >= index

adjustPathAfterRemoval : Path -> Path -> Maybe Path
adjustPathAfterRemoval removed path =
  Just path

