module PdfAnkiTranslator.Lingolive.Actions.Translation where

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

type Config
  = { accessKey :: String
    , requestFn :: Affjax.Request Json -> Aff (Either Affjax.Error (Affjax.Response Json))
    }

type Input
  = { text :: String
    , srcLang :: Language
    , dstLang :: Language
    }

data Error
  = Error__AffjaxError Affjax.Error
  | Error__InvalidStatus String
  | Error__JsonDecodeError JsonDecodeError

toQuery :: Object String -> Query
toQuery = unsafeCoerce

printQuery :: Array (Tuple String String) -> String
printQuery = Object.fromFoldable >>> toQuery >>> Node.URL.toQueryString

printError word e = "On abbyy translate of word " <> show word <> ": " <>
  case e of
       Error__AffjaxError affjaxError ->  Affjax.printError affjaxError
       Error__InvalidStatus status -> status
       Error__JsonDecodeError e -> printJsonDecodeError e

translation :: Config -> Input -> Aff (Either Error (NonEmptyArray ArticleModel))
translation config input =
  config.requestFn
  ( Affjax.defaultRequest
    { method = Left GET
    , url = serviceUrl <> "/api/v1/Translation?" <> printQuery
            [ Tuple "text" input.text
            , Tuple "srcLang" (show $ languageToLanguageId input.srcLang)
            , Tuple "dstLang" (show $ languageToLanguageId input.dstLang)
            ]
    , content = Nothing
    , responseFormat = Affjax.ResponseFormat.json
    , headers = [ RequestHeader "Authorization" ("Bearer " <> config.accessKey) ]
    }
  )
  <#> either (Left <<< Error__AffjaxError) \resp ->
      if resp.status /= StatusCode 200
        then Left $ Error__InvalidStatus resp.statusText
        else lmap Error__JsonDecodeError
          (PdfAnkiTranslator.Lingolive.Decoders.decodeArticleModels
            ( resp.body
            )
          )
