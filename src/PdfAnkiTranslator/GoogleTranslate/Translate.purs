module PdfAnkiTranslator.GoogleTranslate.Translate where

import PdfAnkiTranslator.CodecArgunautExtra
import PdfAnkiTranslator.GoogleTranslate.Config
import PdfAnkiTranslator.Languages
import Protolude

import Affjax as Affjax
import Affjax.RequestBody (RequestBody(..))
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.ResponseFormat as Affjax.ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Argonaut.Encode (encodeJson)
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.Codec as Data.Codec
import Data.Codec.Argonaut (JsonDecodeError, printJsonDecodeError)
import Data.Codec.Argonaut as Data.Codec.Argonaut
import Data.Generic.Rep.Show (genericShow)
import Data.HTTP.Method (Method(..))
import Data.String.NonEmpty (NonEmptyString)
import Data.String.NonEmpty as NonEmptyString
import Foreign.Object (Object)
import Foreign.Object as Object

type Response =
  { "data" ::
    { translations :: NonEmptyArray
      { translatedText :: String
      }
    }
  }

responseToWords :: Response -> NonEmptyArray String
responseToWords r = map _.translatedText r."data".translations

type Config =
  { accessKey :: String
  , requestFn :: Affjax.Request Json -> Aff (Either Affjax.Error (Affjax.Response Json))
  }

type Input =
  { source :: Language
  , target :: Language
  , q :: String
  }

data Error
  = Error__AffjaxError Affjax.Error
  | Error__InvalidStatus String
  | Error__JsonDecodeError JsonDecodeError

printError q e = "On google translate of q " <> show q <> ": " <>
  case e of
       Error__AffjaxError affjaxError ->  Affjax.printError affjaxError
       Error__InvalidStatus status -> status
       Error__JsonDecodeError e -> printJsonDecodeError e

responseCodec :: Data.Codec.Argonaut.JsonCodec Response
responseCodec =
  Data.Codec.Argonaut.object "Response 1" $ Data.Codec.Argonaut.record
    # Data.Codec.Argonaut.recordProp (SProxy :: _ "data")
    ( Data.Codec.Argonaut.object "Response 2" $ Data.Codec.Argonaut.record
      # Data.Codec.Argonaut.recordProp (SProxy :: _ "translations")
      ( nonEmptyArray
        ( Data.Codec.Argonaut.object "Response 3" $ Data.Codec.Argonaut.record
          # Data.Codec.Argonaut.recordProp (SProxy :: _ "translatedText") Data.Codec.Argonaut.string
        )
      )
    )

request :: Config -> Input -> Aff (Either Error (NonEmptyArray String))
request config input = request' config input <#> map responseToWords

request' :: Config -> Input -> Aff (Either Error Response)
request' config input =
  config.requestFn
  ( Affjax.defaultRequest
    { method = Left POST
    , url = serviceUrl <> "/language/translate/v2"
    , content = Just $ Json $ encodeJson $ Object.fromHomogeneous
        { source: languageToLanguageId input.source
        , target: languageToLanguageId input.target
        , q: input.q
        }
    , responseFormat = Affjax.ResponseFormat.json
    , headers = [ RequestHeader "Authorization" ("Bearer " <> config.accessKey) ]
    }
  )
  <#> either (Left <<< Error__AffjaxError) \resp ->
      if resp.status /= StatusCode 200
        then Left $ Error__InvalidStatus resp.statusText
        else lmap Error__JsonDecodeError (Data.Codec.decode responseCodec resp.body)
