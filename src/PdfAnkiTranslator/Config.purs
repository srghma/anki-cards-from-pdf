module PdfAnkiTranslator.Config where
import Protolude
import Data.Maybe as Maybe

import Data.String.NonEmpty (NonEmptyString)
import Data.String.NonEmpty as NonEmptyString
import Options.Applicative

nonEmptyString :: ReadM NonEmptyString
nonEmptyString = eitherReader $ NonEmptyString.fromString >>> note "Expected non empty string"

nonempty :: ReadM String
nonempty = nonEmptyString <#> NonEmptyString.toString

type Config =
  { cache                       :: String
  , abbyy_api_key               :: String
  , google_translate_access_key :: String
  }

configParser :: Parser Config
configParser = ado
  cache                       <- option nonempty $ long "cache"
  abbyy_api_key               <- option nonempty $ long "abbyy-api-key"
  google_translate_access_key <- option nonempty $ long "google-translate-access-key"

  in
    { cache
    , abbyy_api_key
    , google_translate_access_key
    }

opts :: ParserInfo Config
opts =
  info (configParser <**> helper) $ fullDesc <> progDesc "Adds translation to words" <> header "pdf-anki-translator - adds translation to words"
