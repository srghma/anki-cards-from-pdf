module Test.Main where

import Protolude
import Test.Parser.ArticleModel as Test.Parser.ArticleModel

main :: Effect Unit
main = launchAff_ Test.Parser.ArticleModel.main
