module PdfAnkiTranslator.Cambridge.Transcription where

import Data.Argonaut.Decode
import PdfAnkiTranslator.Languages
import PdfAnkiTranslator.Lingolive.Types
import Protolude

import Affjax as Affjax
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.ResponseFormat as Affjax.ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.String.NonEmpty (NonEmptyString)
import Data.String.NonEmpty as NonEmptyString
import Data.Generic.Rep.Show (genericShow)
import Data.HTTP.Method (Method(..))
import Foreign.Object (Object)
import Foreign.Object as Object
import Node.URL (Query)
import Node.URL as Node.URL
import PdfAnkiTranslator.Lingolive.Config
import PdfAnkiTranslator.Lingolive.Decoders as PdfAnkiTranslator.Lingolive.Decoders
import Unsafe.Coerce (unsafeCoerce)
import PdfAnkiTranslator.AffjaxCache as PdfAnkiTranslator.AffjaxCache
import Data.String.Regex.Unsafe as Regex
import Data.String.Regex as Regex
import Data.String.Regex.Flags as Regex

type Config
  = { requestFn :: Affjax.Request String -> Aff (Either Affjax.Error (Affjax.Response String))
    }

type Input
  = { text :: String
    , srcLang :: Language
    , dstLang :: Language
    }

languageToLanguageId =
  case _ of
       German  -> "german"
       Russian -> "english"
       Japanese -> undefined

data Error
  = Error__AffjaxError Affjax.Error
  | Error__InvalidStatus String

toQuery :: Object String -> Query
toQuery = unsafeCoerce

printQuery :: Array (Tuple String String) -> String
printQuery = Object.fromFoldable >>> toQuery >>> Node.URL.toQueryString

printError word e = "On cambridge translate of word " <> show word <> ": " <>
  case e of
       Error__AffjaxError affjaxError ->  Affjax.printError affjaxError
       Error__InvalidStatus status -> status

transcription :: Config -> Input -> Aff (Either Error (Maybe String))
transcription config input =
  config.requestFn
  ( Affjax.defaultRequest
    { method = Left GET
    -- | https://dictionary.cambridge.org/dictionary/german-english/abgasen
    , url = spy "url" $ "https://dictionary.cambridge.org/dictionary/" <> languageToLanguageId input.srcLang <> "-" <> languageToLanguageId input.dstLang <> "/" <> input.text
    , content = Nothing
    , responseFormat = Affjax.ResponseFormat.string
    }
  )
  <#> either (Left <<< Error__AffjaxError) \resp ->
      if resp.status /= StatusCode 200
        then Left $ Error__InvalidStatus resp.statusText
        else
        -- spy "resp.body"
          case Regex.match (Regex.unsafeRegex """<span class="ipa dipa">([^<]+)<\/span>""" Regex.noFlags) ( resp.body) of
               Nothing -> Right Nothing
               Just matches ->
                 NonEmptyArray.index matches 1
                 # join
                 # Right
