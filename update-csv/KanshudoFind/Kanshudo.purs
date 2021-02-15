module KanshudoFind.Kanshudo where

import Data.Argonaut.Decode
import PdfAnkiTranslator.Languages
import PdfAnkiTranslator.Lingolive.Config
import PdfAnkiTranslator.Lingolive.TranslationResponseTypes
import Protolude

import Affjax as Affjax
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.ResponseFormat as Affjax.ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic (genericDecodeJson)
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.HTTP.Method (Method(..))
import Data.Maybe (fromJust)
import Data.Show.Generic (genericShow)
import Data.String.NonEmpty (NonEmptyString)
import Data.String.NonEmpty as NonEmptyString
import Data.String.Regex as Regex
import Data.String.Regex.Flags as Regex
import Data.String.Regex.Unsafe as Regex
import Effect.Exception.Unsafe (unsafeThrow)
import Foreign.Object (Object)
import Foreign.Object as Object
import JSURI (encodeURIComponent)
import Node.URL (Query)
import Node.URL as Node.URL
import Partial.Unsafe (unsafeCrashWith, unsafePartial)
import PdfAnkiTranslator.AffjaxCache as PdfAnkiTranslator.AffjaxCache
import PdfAnkiTranslator.Lingolive.TranslationResponseDecoders as PdfAnkiTranslator.Lingolive.TranslationResponseDecoders
import Unsafe.Coerce (unsafeCoerce)

type Config
  = { requestFn :: Affjax.Request String -> Aff (Either Affjax.Error (Affjax.Response String))
    }

type Input
  = { text :: String
    }

data Error
  = Error__AffjaxError Affjax.Error
  | Error__InvalidStatus String

printError word e = "On cambridge translate of word " <> show word <> ": " <>
  case e of
       Error__AffjaxError affjaxError ->  Affjax.printError affjaxError
       Error__InvalidStatus status -> status

transcription :: Config -> Input -> Aff (Either Error String)
transcription config input =
  config.requestFn
  ( Affjax.defaultRequest
    { method = Left GET
    , url = "https://www.purpleculture.net/dictionary-details/?word=" <> (unsafePartial $ fromJust $ encodeURIComponent input.text)
    , content = Nothing
    , responseFormat = Affjax.ResponseFormat.string
    }
  )
  <#> either (Left <<< Error__AffjaxError) \resp ->
      if resp.status /= StatusCode 200
        then Left $ Error__InvalidStatus resp.statusText
        else Right resp.body