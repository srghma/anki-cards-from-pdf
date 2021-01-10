module Test.Parser.ArticleModel where

import Protolude
import Control.Parallel (parTraverse)
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode
import Data.Traversable (traverse_)
import Effect (Effect)
import Effect.Aff (Aff, launchAff_)
import Effect.Class (liftEffect)
import Node.Encoding (Encoding(..))
import Node.FS.Aff (readTextFile)
import Node.Path as Node.Path
import Test.Parser.ArticleModel.Angekommen.Actual as Test.Parser.ArticleModel.Angekommen.Actual
import Test.Parser.ArticleModel.Ankommen.Actual as Test.Parser.ArticleModel.Ankommen.Actual
import Test.Spec as Test.Spec
import Test.Spec.Assertions (shouldEqual)
import Test.Spec.Reporter as Test.Spec.Reporter
import Test.Spec.Runner as Test.Spec.Runner
import PdfAnkiTranslator.Lingolive.TranslationResponseTypes
import PdfAnkiTranslator.Lingolive.TranslationResponseDecoders
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray

type JsonTest
  = { name :: String
    , actual :: NonEmptyArray ArticleModel
    }

type JsonTestWithExpected
  = { name :: String
    , actual :: NonEmptyArray ArticleModel
    , expected :: String
    }

jsonTests :: Array JsonTest
jsonTests =
  [ { name: "Angekommen", actual: Test.Parser.ArticleModel.Angekommen.Actual.actual }
  , { name: "Ankommen", actual: Test.Parser.ArticleModel.Ankommen.Actual.actual }
  ]

addText :: JsonTest -> Aff JsonTestWithExpected
addText test = do
  let
    path = Node.Path.concat [ "test", "Test", "Parser", "ArticleModel", test.name, "Expected.json" ]
  absolutePath <- liftEffect $ Node.Path.resolve [] path
  expected <- readTextFile UTF8 absolutePath
  pure { name: test.name, actual: test.actual, expected }

mkAllTests :: Array JsonTestWithExpected -> Test.Spec.Spec Unit
mkAllTests = \tests -> traverse_ mkTest tests
  where
  mkTest :: JsonTestWithExpected -> Test.Spec.Spec Unit
  mkTest test =
    Test.Spec.it test.name do
      actualParsed <-
        (parseJson test.expected >>= decodeArticleModels)
          # either (throwError <<< error <<< printJsonDecodeError) pure
      actualParsed `shouldEqual` test.actual

main :: Aff Unit
main = do
  (jsonTestsWithExpected :: Array JsonTestWithExpected) <- flip parTraverse jsonTests addText
  let
    (allTests :: Test.Spec.Spec Unit) = mkAllTests jsonTestsWithExpected
  Test.Spec.Runner.runSpec' Test.Spec.Runner.defaultConfig [ Test.Spec.Reporter.consoleReporter ] allTests
