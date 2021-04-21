{-
Welcome to a Spago project!
You can edit this file as you like.
-}
{ name = "my-project"
, dependencies =
  [ "argonaut"
  , "argonaut-generic"
  , "console"
  , "css"
  , "effect"
  , "halogen"
  , "maybe"
  , "psci-support"
  , "transformers"
  , "web-dom"
  ]
, packages = ./packages.dhall
, sources = [ "src/**/*.purs", "test/**/*.purs" ]
}
