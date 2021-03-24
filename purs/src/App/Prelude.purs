module App.Prelude (module X) where

import Control.Applicative (pure, when) as X
import Control.Bind (bind, discard, (>>=), (=<<)) as X
import Control.Category (identity) as X
import Control.Semigroupoid ((<<<)) as X

import Data.Boolean (otherwise) as X
import Data.Eq (class Eq, (==), (/=)) as X
import Data.Function (($), (#), flip, const) as X
import Data.Foldable (traverse_) as X
import Data.Functor (map, void) as X
import Data.Generic.Rep (class Generic) as X
import Data.Generic.Rep.Show (genericShow) as X
import Data.HeytingAlgebra ((&&), (||), not) as X
import Data.Int (toNumber) as X
import Data.Maybe (Maybe(..), fromMaybe, fromMaybe') as X
import Data.Ord (class Ord, (<), (>), (<=), (>=), abs, compare) as X
import Data.Ring ((-)) as X
import Data.Semigroup ((<>)) as X
import Data.Semiring ((+), (*)) as X
import Data.Show (class Show, show) as X
import Data.Unit (Unit, unit) as X
import Data.Tuple (Tuple(..)) as X
import Data.Void (Void) as X
import Data.Symbol (SProxy(..)) as X
import Effect.Aff.Class (class MonadAff) as X
import Effect.Class (liftEffect) as X
import Type.Proxy (Proxy(..)) as X
import Data.Tuple.Nested ((/\)) as X
