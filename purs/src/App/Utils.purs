module App.Utils where

import App.Prelude

import Data.Array (filter)

import Data.Tuple (Tuple)
import Data.Tuple as Tuple

import Halogen.HTML as HH

import Foreign.Object as Object
import CSS.Stylesheet (CSS, Rule(..), runS)
import CSS.Property (Key, Value)
import CSS.Render (render, renderedSheet, collect)
import CSS.Stylesheet (CSS, Rule(..), runS)

import Data.Array (mapMaybe, concatMap, singleton)
import Data.Either (Either)
import Data.Foldable (foldMap)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.MediaType (MediaType(..))
import Data.String (joinWith)
import Data.Tuple (Tuple(..))
import Foreign.Object as Object

import Halogen.HTML as HH
import Halogen.HTML.Elements as HE
import Halogen.HTML.Properties as HP
import Halogen.HTML.Core as HC

filterBySecond :: forall a. Array (Tuple a Boolean) -> Array a
filterBySecond input =
  map Tuple.fst $ filter Tuple.snd input

maybeDiv :: forall s a. Boolean -> HH.HTML s a -> HH.HTML s a
maybeDiv condition value =
  if condition then value else HH.div_ []

maybeDiv' :: forall s a. Boolean -> (Unit -> HH.HTML s a) -> HH.HTML s a
maybeDiv' condition valueFunc =
  if condition then valueFunc unit else HH.div_ []

cssToStyle :: forall i r. CSS → HP.IProp (style ∷ String|r) i
cssToStyle =
  HP.attr (HC.AttrName "style")
    <<< toString
    <<< rules
    <<< runS
  where
  toString ∷ Object.Object String → String
  toString = joinWith "; " <<< Object.foldMap (\key val → [ key <> ": " <> val])

  rules ∷ Array Rule → Object.Object String
  rules rs = Object.fromFoldable properties
    where
    properties ∷ Array (Tuple String String)
    properties = mapMaybe property rs >>= collect >>> rights

  property ∷ Rule → Maybe (Tuple (Key Unit) Value)
  property (Property k v) = Just (Tuple k v)
  property _              = Nothing

  rights ∷ ∀ a b. Array (Either a b) → Array b
  rights = concatMap $ foldMap singleton
