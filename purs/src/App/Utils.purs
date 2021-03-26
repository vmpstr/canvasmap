module App.Utils where

import App.Prelude

import Data.Array (filter)

import Data.Tuple (Tuple)
import Data.Tuple as Tuple

import Halogen.HTML as HH

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input

maybeDiv :: forall s a. Boolean -> HH.HTML s a -> HH.HTML s a
maybeDiv condition value =
  if condition then value else HH.div_ []

maybeDiv' :: forall s a. Boolean -> (Unit -> HH.HTML s a) -> HH.HTML s a
maybeDiv' condition valueFunc =
  if condition then valueFunc unit else HH.div_ []
