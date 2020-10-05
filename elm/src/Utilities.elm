module Utilities exposing (maybeJust, maybeCmd, toMsgOrNoop, listApply)

maybeJust : Bool -> a -> Maybe a
maybeJust condition data =
  if condition then
    Just data
  else
    Nothing

maybeCmd : Bool -> (() -> Cmd a) -> Cmd a
maybeCmd condition cmd =
  if condition then
    cmd ()
  else
    Cmd.none

toMsgOrNoop : (data -> msg) -> msg -> Result err data -> msg
toMsgOrNoop toMsg noop result =
  case result of
      Ok data ->
        toMsg data
      Err _ ->
        noop

listApply : a -> List (a -> a) -> a
listApply start list =
  case list of
    (first :: rest) ->
      listApply (first start) rest
    [] ->
      start