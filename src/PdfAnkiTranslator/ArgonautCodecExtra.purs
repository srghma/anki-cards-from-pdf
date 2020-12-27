module PdfAnkiTranslator.ArgonautCodecExtra where

import Protolude
import Data.Argonaut.Decode
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders (decodeString)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Generic.Rep.Show (genericShow)
import Data.String as String
import Data.String.NonEmpty (NonEmptyString)
import Data.String.NonEmpty as NonEmptyString

decodeNonEmptyString :: Json -> Either JsonDecodeError NonEmptyString
decodeNonEmptyString json =
  note (Named "NonEmptyString" $ UnexpectedValue json)
    =<< map (NonEmptyString.fromString) (decodeString json)

decodeNonempty :: Json -> Either JsonDecodeError String
decodeNonempty = map NonEmptyString.toString <<< decodeNonEmptyString

