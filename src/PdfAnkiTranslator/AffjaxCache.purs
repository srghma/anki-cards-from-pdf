module PdfAnkiTranslator.AffjaxCache where

import Data.Argonaut.Decode
import Data.Exists
import Foreign
import Protolude

import Affjax as Affjax
import Affjax.RequestBody (RequestBody(..))
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.ResponseFormat as Affjax
import Affjax.ResponseFormat as Affjax.ResponseFormat
import Affjax.ResponseHeader (ResponseHeader(..))
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut.Core (Json, stringify, stringifyWithIndent)
import Data.Argonaut.Decode as ArgonautCodecs
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Encode (encodeJson)
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.Codec (Codec)
import Data.Codec as Data.Codec
import Data.Codec.Argonaut as Data.Codec.Argonaut
import Data.Codec.Argonaut.Common as Data.Codec.Argonaut
import Data.HTTP.Method (unCustomMethod)
import Data.Profunctor (dimap, wrapIso)
import Data.Traversable (for)
import Effect.Aff (bracket)
import Effect.Class.Console (log)
import Effect.Ref as Effect.Ref
import Foreign.Object (Object)
import Foreign.Object as Object
import Node.Encoding (Encoding(..))
import Node.Encoding as Node.Encoding
import Node.FS.Aff as Node.FS.Aff
import Options.Applicative as Options.Applicative
import Unsafe.Coerce (unsafeCoerce)

-- covar pos - unsafe
-- contra -- ????

-- | newtype Foo a = Foo (a -> a)

-- | foo :: Exists Foo
-- | foo = mkExists (Foo identity)

-- | fooTo :: forall b . (forall r. (forall a. Foo a -> r) -> r) -> b -> b
-- | fooTo x = x $ \(Foo f) -> f -- Could not match type        a1      with type        b0
-- | fooTo x = x (\(Foo f) -> unsafeCoerce f)

-- | useFoo :: Foo String -> String
-- | useFoo (Foo f) = f "used"

-- | x :: Int
-- | x = runExists (\(Foo f) -> f "a") foo

-- TODO: is it SAFE? NO
hackExistsF :: forall a f . Exists f -> f a
hackExistsF = unsafeCoerce

requestFnJson :: Exists Cache → Affjax.Request Json → Aff (Either Affjax.Error (Affjax.Response Json))
requestFnJson cache = \affjaxRequest -> requestWithCache { cache, affjaxRequest, bodyCodec: Data.Codec.Argonaut.json }

requestFnString :: Exists Cache → Affjax.Request String → Aff (Either Affjax.Error (Affjax.Response String))
requestFnString cache = \affjaxRequest -> requestWithCache { cache, affjaxRequest, bodyCodec: Data.Codec.Argonaut.string }

-- because why we nned them?
type AffjaxResponseWithoutHeaders a =
  { status :: StatusCode
  , statusText :: String
  , body :: a
  }

toAffjaxResponseWithoutHeaders :: forall a . Affjax.Response a -> AffjaxResponseWithoutHeaders a
toAffjaxResponseWithoutHeaders x =
  { status: x.status
  , statusText: x.statusText
  , body: x.body
  }

fromAffjaxResponseWithoutHeaders :: forall a . AffjaxResponseWithoutHeaders a -> Affjax.Response a
fromAffjaxResponseWithoutHeaders x =
  { status: x.status
  , statusText: x.statusText
  , body: x.body
  , headers: []
  }

newtype Cache a = Cache
  { get ::
      { affjaxRequest :: Affjax.Request a
      , bodyCodec :: Data.Codec.Argonaut.JsonCodec a
      } ->
      Effect (Maybe (Either Affjax.Error (Affjax.Response a)))
  , set ::
      { affjaxRequest :: Affjax.Request a
      , bodyCodec :: Data.Codec.Argonaut.JsonCodec a
      , response :: Either Affjax.Error (AffjaxResponseWithoutHeaders a)
      } ->
      Effect Unit
  }

affjaxRequestToKey :: forall a . Affjax.Request a -> String
affjaxRequestToKey affjaxRequest = stringify $ encodeJson $ Object.fromHomogeneous
  { method: either show unCustomMethod affjaxRequest.method
  , url: affjaxRequest.url
  , content:
      maybe
      "Nothing"
      (case _ of
            ArrayView f                   -> "ArrayView is unsupported"
            Blob blob                     -> "Blob is unsupported"
            Document document             -> "Document is unsupported"
            FormData formData             -> "FormData is unsupported"
            FormURLEncoded formURLEncoded -> "FormURLEncoded is unsupported"
            String string                 -> string
            Json json                     -> stringify json
      )
      affjaxRequest.content
  -- | , headers: show affjaxRequest.headers
  -- | , username: fromMaybe "Nothing" affjaxRequest.username
  -- | , password: fromMaybe "Nothing" affjaxRequest.password
  -- | , withCredentials: show affjaxRequest.withCredentials
  -- | , timeout: maybe "Nothing" show affjaxRequest.timeout
  }


codecResponseHeader :: Data.Codec.Argonaut.JsonCodec ResponseHeader
codecResponseHeader =
  Data.Codec.Argonaut.indexedArray "ResponseHeader" $
  ResponseHeader
    <$> (\(ResponseHeader x _) -> x) Data.Codec.~ Data.Codec.Argonaut.index 0 Data.Codec.Argonaut.string
    <*> (\(ResponseHeader _ x) -> x) Data.Codec.~ Data.Codec.Argonaut.index 1 Data.Codec.Argonaut.string

codecResponse :: forall a . Data.Codec.Argonaut.JsonCodec a -> Data.Codec.Argonaut.JsonCodec (AffjaxResponseWithoutHeaders a)
codecResponse bodyCodec =
    Data.Codec.Argonaut.object "AffjaxResponseWithoutHeaders" $ Data.Codec.Argonaut.record
      # Data.Codec.Argonaut.recordProp (SProxy :: _ "status") (wrapIso StatusCode Data.Codec.Argonaut.int)
      # Data.Codec.Argonaut.recordProp (SProxy :: _ "statusText") Data.Codec.Argonaut.string
      # Data.Codec.Argonaut.recordProp (SProxy :: _ "body") bodyCodec

-- TODO
codecAffjaxError :: Data.Codec.Argonaut.JsonCodec Affjax.Error
codecAffjaxError =
  Data.Codec.Argonaut.prismaticCodec "CodecAffjaxError" dec Affjax.printError Data.Codec.Argonaut.string
  where
    dec str = Just $ Affjax.RequestContentError str

codecEitherResponse :: forall a . Data.Codec.Argonaut.JsonCodec a -> Data.Codec.Argonaut.JsonCodec (Either Affjax.Error (AffjaxResponseWithoutHeaders a))
codecEitherResponse bodyCodec = Data.Codec.Argonaut.either codecAffjaxError (codecResponse bodyCodec)

-------------------

-- just like affjax request, but only supports Json
requestWithCache
  :: forall a
   . { cache :: Exists Cache
     , affjaxRequest :: Affjax.Request a
     , bodyCodec :: Data.Codec.Argonaut.JsonCodec a
     }
  -> Aff (Either Affjax.Error (Affjax.Response a))
requestWithCache
  { cache
  , affjaxRequest
  , bodyCodec
  } =
    let ((Cache cache) :: Cache a) = hackExistsF cache
     in liftEffect (cache.get { affjaxRequest, bodyCodec }) >>=
        case _ of
            Nothing -> do
                response <- Affjax.request affjaxRequest
                let (response' :: Either Affjax.Error (AffjaxResponseWithoutHeaders a)) = map toAffjaxResponseWithoutHeaders response
                liftEffect $ cache.set { affjaxRequest, bodyCodec, response: response' }
                pure response
            Just x -> pure x

-------------------

createCacheWithPersist ::
  String ->
  Aff
  { cache :: Exists Cache
  , persist :: Aff Unit
  }
createCacheWithPersist filename = do
  (initInMemoryContent :: Object Json) <-
    Node.FS.Aff.exists filename >>=
      if _
        then do
          text <- Node.FS.Aff.readTextFile Node.Encoding.UTF8 filename
          (ArgonautCodecs.parseJson text >>= ArgonautCodecs.decodeJson) # either (throwError <<< error <<< ArgonautCodecs.printJsonDecodeError) pure
        else pure $ Object.empty

  inMemoryCache <- liftEffect $ Effect.Ref.new initInMemoryContent

  pure
    { cache: mkExists $ Cache
      { get: \{ affjaxRequest, bodyCodec } -> do
          obj <- Effect.Ref.read inMemoryCache
          case Object.lookup (affjaxRequestToKey affjaxRequest) obj of
               Nothing -> pure Nothing
               Just json ->
                 json
                 # Data.Codec.decode (codecEitherResponse bodyCodec)
                 # map (map fromAffjaxResponseWithoutHeaders)
                 # either (throwError <<< error <<< Data.Codec.Argonaut.printJsonDecodeError) (pure <<< Just)
      , set: \{ affjaxRequest, bodyCodec, response } ->
        Effect.Ref.modify_ (Object.insert (affjaxRequestToKey affjaxRequest) (Data.Codec.encode (codecEitherResponse bodyCodec) response)) inMemoryCache
      }
    , persist: do
       obj <- liftEffect $ Effect.Ref.read inMemoryCache
       Node.FS.Aff.writeTextFile Node.Encoding.UTF8 filename (stringifyWithIndent 2 $ encodeJson obj)
    }

withCache :: forall a . String -> (Exists Cache -> Aff a) -> Aff a
withCache filename action = bracket (createCacheWithPersist filename) (\{ persist } -> persist) (\{ cache } -> action cache)
