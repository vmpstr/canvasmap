module App.Data.Map where

type State = Int

initialState :: forall input. input -> State
initialState _ = 0