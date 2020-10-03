module Tree exposing
  (findNode
  , updateNode
  , nodeAt
  , Path(..)
  , adjustPathForMove
  , isValidInsertionPath
  , pathDecoder
  , isSubpath
  , moveNode
  , nodeAtById
  , removeNode
  , takeNode
  , addNode
  )

{- TODOs
 - Put pack/unpack into a record
 - Type alias record for easier type annotations
 - Rename moveTo to moveToBefore (vs moveToAfter?)
 - Read through List and List.Extra to condense functions
 - Write more tests for deeper trees
 - Take a root tree object, as opposed to a list of nodes
 - Test updateNode
 -}

import Json.Decode as Decoder exposing (Decoder, succeed, string)
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
          Maybe.map (InSubtree index) (findNode unpack (unpack node.children) target)
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
      maybeAdjustedTo = adjustPathForMove from to
  in
  case (maybeAdjustedTo, removed) of
    (Just adjustedTo, Just node) ->
      if isValidInsertionPath unpack removedResult adjustedTo then
        addNode pack unpack removedResult adjustedTo node
      else
        nodes
    _ ->
      nodes

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
        (first :: _) ->
          isValidInsertionPath unpack (unpack first.children) subpath
        _ ->
          False
    AtIndex index ->
      List.length nodes >= index

adjustPathForMove : Path -> Path -> Maybe Path
adjustPathForMove removed path =
  case (removed, path) of
    (AtIndex ri, AtIndex pi) ->
      if ri == pi then
        Nothing
      else if ri < pi then
        Just (AtIndex (pi - 1))
      else
        Just (AtIndex pi)
    (AtIndex ri, InSubtree pi psub) ->
      if ri == pi then
        Nothing
      else if ri < pi then
        Just (InSubtree (pi - 1) psub)
      else
        Just (InSubtree pi psub)
    (InSubtree _ _, AtIndex _) ->
      Just path
    (InSubtree ri rsub, InSubtree pi psub) ->
      if ri == pi then
        let
            maybeSub = adjustPathForMove rsub psub
        in
        case maybeSub of
          Just sub ->
            Just (InSubtree pi sub)
          Nothing ->
            Nothing
      else
        Just path

updateNode : (List { c | children: b } -> b)
           -> (b -> List { c | children: b })
           -> List { c | children: b }
           -> Path
           -> ({ c | children: b } -> { c | children: b })
           -> List { c | children: b }
updateNode pack unpack nodes path updater =
  case path of
    AtIndex index ->
      List.Extra.updateAt index updater nodes
    InSubtree index subpath ->
      let
          recurse node =
            { node |
                children
                  = pack (updateNode pack unpack (unpack node.children) subpath updater)
            }
      in
      List.Extra.updateAt index recurse nodes

stringToPath : String -> Maybe Path
stringToPath s =
  let
    stringList = String.split " " s
    intList = List.filterMap String.toInt (String.split " " s)

    maybePrepend index mpath =
      Just (prependPath index mpath)
  in
  if List.length stringList == List.length intList then
    List.foldr maybePrepend Nothing intList
  else
    Nothing

decodePath : String -> Decoder Path
decodePath s =
  case stringToPath s of
    Just path ->
      succeed path
    Nothing ->
      Decoder.fail ("Invalid path: " ++ s)

pathDecoder : Decoder Path
pathDecoder =
  string |> Decoder.andThen decodePath

prependPath : Int -> Maybe Path -> Path
prependPath index maybePath =
  case maybePath of
    Just path ->
      InSubtree index path
    Nothing ->
      AtIndex index

nodeAtById : (b -> List { c | children : b, id : a })
             -> List { c | children : b, id : a }
             -> a
             -> Maybe { c | children : b, id : a }
nodeAtById unpack nodes target =
  findNode unpack nodes target |> Maybe.andThen (nodeAt unpack nodes)

isSubpath : Path -> Path -> Bool
isSubpath path lead =
  case (path, lead) of
    (AtIndex _, AtIndex _) ->
      False -- even if pi == li, it's not a subpath
    (AtIndex _, InSubtree _ _) ->
      False -- path stops short of the lead
    (InSubtree pi _, AtIndex li) ->
      pi == li -- if path goes into the subtree of lead, it's a subpath
    (InSubtree pi psub, InSubtree li lsub) ->
      pi == li && isSubpath psub lsub -- recurse if equal

