module Utilities exposing (maybeJust, maybeCmd)

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
