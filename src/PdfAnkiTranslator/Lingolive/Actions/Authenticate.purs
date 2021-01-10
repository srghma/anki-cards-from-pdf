module PdfAnkiTranslator.Lingolive.Actions.Authenticate where

import Data.Argonaut.Decode
import Data.HTTP.Method
import PdfAnkiTranslator.Lingolive.Config
import PdfAnkiTranslator.Lingolive.TranslationResponseTypes
import Protolude

import Affjax as Affjax
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.ResponseFormat as Affjax.ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders (decodeString)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Generic.Rep.Show (genericShow)
import Data.String as String
import Data.String.NonEmpty (NonEmptyString)
import Data.String.NonEmpty as NonEmptyString
import Foreign.Object (Object)

type Config
  = { apiKey :: String
    }

data Error
  = Error__AffjaxError Affjax.Error
  | Error__InvalidStatus String
  | Error__Empty
  -- | | Error__JsonDecodeError JsonDecodeError

printError e = "On auth: " <>
  case e of
       Error__AffjaxError affjaxError ->  Affjax.printError affjaxError
       Error__InvalidStatus status -> status
       Error__Empty -> "empty"
       -- | Error__JsonDecodeError e -> printJsonDecodeError e

authenticate :: Config -> Aff (Either Error String)
authenticate config =
  Affjax.request
  ( Affjax.defaultRequest
    { method = Left POST
    , url = serviceUrl <> "/api/v1.1/authenticate"
    , content = Nothing
    , responseFormat = Affjax.ResponseFormat.string
    , headers = [ RequestHeader "Authorization" ("Basic " <> config.apiKey) ]
    }
  )
  <#> either (Left <<< Error__AffjaxError) \resp ->
      if resp.status /= StatusCode 200
        then Left $ Error__InvalidStatus resp.statusText
        else NonEmptyString.fromString resp.body # note Error__Empty <#> NonEmptyString.toString
        -- | else lmap Error__JsonDecodeError (decodeNonEmptyString (spy "auth body " resp.body) <#> NonEmptyString.toString)
