module App.Data.NodeClass where

import Data.Maybe (Maybe)
import Data.Unit (Unit)

class LayoutNode n where
  render :: n -> Maybe Unit
