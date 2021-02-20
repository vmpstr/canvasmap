module App.Prelude (module X) where

import Control.Bind (bind, discard) as X
import Data.Eq (class Eq, (==), (/=)) as X
import Data.Ord (class Ord, (<), (>), (<=), (>=), abs) as X
import Data.Function (($), (#), flip, const) as X
import Data.Functor (map) as X
import Data.Maybe (Maybe(..), fromMaybe) as X
import Data.Unit (Unit, unit) as X
import Data.Semigroup ((<>)) as X
import Data.Show (class Show, show) as X
import Control.Applicative (pure, when) as X
import Data.Ring ((-)) as X
import Data.Semiring ((+)) as X
import Data.Int (toNumber) as X
import Data.HeytingAlgebra ((&&), (||)) as X