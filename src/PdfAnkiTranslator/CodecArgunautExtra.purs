module PdfAnkiTranslator.CodecArgunautExtra where

import Protolude
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Argonaut.Encode (encodeJson)
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.Codec as Data.Codec
import Data.Codec.Argonaut (JsonDecodeError, printJsonDecodeError)
import Data.Codec.Argonaut as Data.Codec.Argonaut

nonEmptyArray ∷ forall a . Data.Codec.Argonaut.JsonCodec a -> Data.Codec.Argonaut.JsonCodec (NonEmptyArray a)
nonEmptyArray codec = Data.Codec.Argonaut.prismaticCodec NonEmptyArray.fromArray NonEmptyArray.toArray (Data.Codec.Argonaut.array codec)
