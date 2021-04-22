module App.Prelude (module X) where

import Control.Applicative (pure, when) as X
import Control.Bind (bind, discard, (>>=), (=<<)) as X
import Control.Category (identity) as X
import Control.Semigroupoid ((<<<), (>>>)) as X

import Data.Argonaut.Encode.Class (class EncodeJson) as X
import Data.Argonaut.Encode.Generic (genericEncodeJson) as X
import Data.Argonaut.Decode.Class (class DecodeJson) as X
import Data.Argonaut.Decode.Generic (genericDecodeJson) as X
import Data.Argonaut.Encode (encodeJson) as X
import Data.Argonaut.Decode (decodeJson) as X
import Data.Boolean (otherwise) as X
import Data.Either (Either(..), note) as X
import Data.Eq (class Eq, (==), (/=)) as X
import Data.Function (($), (#), flip, const) as X
import Data.Foldable (traverse_, foldr) as X
import Data.Traversable (traverse) as X
import Data.Functor (map, void) as X
import Data.Generic.Rep (class Generic) as X
import Data.Show.Generic (genericShow) as X
import Data.HeytingAlgebra ((&&), (||), not) as X
import Data.Int (toNumber, round) as X
import Data.Maybe (Maybe(..), fromMaybe, fromMaybe') as X
import Data.Ord (class Ord, (<), (>), (<=), (>=), abs, compare) as X
import Data.Ring ((-)) as X
import Data.Semigroup ((<>)) as X
import Data.Semiring ((+), (*)) as X
import Data.Show (class Show, show) as X
import Data.Unit (Unit, unit) as X
import Data.Tuple (Tuple(..)) as X
import Data.Void (Void) as X
import Type.Proxy (Proxy(..)) as X
import Effect.Aff.Class (class MonadAff, liftAff) as X
import Effect.Class (liftEffect, class MonadEffect) as X
import Data.Tuple.Nested ((/\)) as X
