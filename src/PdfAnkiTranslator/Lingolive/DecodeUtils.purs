module PdfAnkiTranslator.Lingolive.DecodeUtils where

import Data.Argonaut.Decode
import PdfAnkiTranslator.Lingolive.TranslationResponseTypes
import Protolude
import Data.Array as Array
import Affjax as Affjax
import Control.Monad.ST (ST)
import Data.Argonaut.Core (Json)
import Data.Argonaut.Core as Json
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Generic.Rep.Show (genericShow)
import Foreign.Object (Object)
import Foreign.Object as Object
import Foreign.Object.ST (STObject)
import Foreign.Object.ST as STObject
import Control.Monad.ST as Control.Monad.ST

-- | https://github.com/purescript-contrib/purescript-argonaut-codecs/blob/9ce8e17dfa6ceb41dd867de3220a476c08d4d412/src/Data/Argonaut/Decode/Decoders.purs#L203
-- | https://github.com/purescript/purescript-foreign-object/blob/f471d8a455be60011eb31cb5a365f60315784fed/src/Foreign/Object.purs#L203
getFieldAndPop' ::
  forall r a.
  (Json -> Either JsonDecodeError a) ->
  STObject r Json ->
  String ->
  ExceptT JsonDecodeError (ST r) a
getFieldAndPop' decoder stobj key = do
  mval <- lift $ STObject.peek key stobj
  when (isJust mval) (lift $ void $ STObject.delete key stobj)
  except
    $ maybe
        (Left $ AtKey key MissingValue)
        (lmap (AtKey key) <<< decoder)
        mval

getFieldAndPop ::
  forall r a.
  DecodeJson a =>
  STObject r Json ->
  String ->
  ExceptT JsonDecodeError (ST r) a
getFieldAndPop = getFieldAndPop' decodeJson

decodeObjectAndUseUpAllFields ::
  forall a.
  (forall r. STObject r Json -> ExceptT JsonDecodeError (ST r) a) ->
  Object Json ->
  Either JsonDecodeError a
decodeObjectAndUseUpAllFields f inputobj =
  Control.Monad.ST.run do
    stobj <- Object.thawST inputobj
    (runExceptT $ f stobj)
      >>= either (pure <<< Left) \result -> do
          obj <- Object.freezeST stobj
          let
            keys = Object.keys obj
          if Array.null keys then
            pure $ Right result
          else
            pure $ Left $ TypeMismatch $ "Expected to use up all fields, but fields left: " <> show keys

decodeNull :: Json -> Either JsonDecodeError Unit
decodeNull json = Json.caseJsonNull (Left $ Named "null" $ UnexpectedValue json) Right json
