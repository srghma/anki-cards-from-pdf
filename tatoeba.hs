#!/usr/bin/env stack
{- stack
   script
   --nix
   --nix-path "nixpkgs=https://github.com/NixOS/nixpkgs-channels/archive/nixos-unstable.tar.gz"
   --nix-packages "zlib pcre-cpp pcre git"
   --resolver lts-16.17
   --package turtle
   --package protolude
   --package directory
   --package filepath
   --package text
   --package foldl
   --package directory-tree
   --package containers
   --package regex
   --package regex-base
   --package regex-tdfa
   --package string-qq
   --package cases
   --package ilist
-}

{-# LANGUAGE OverloadedStrings #-}

-- | This is an example of using the Sv library to parse and decode a real CSV
-- document into a Haskell datatype. We consider this a good demonstration of
-- usage of the library.
--
-- This is a literate Haskell file. If you are reading the haddock,
-- we recommend that instead you view the source to follow along.
module Data.Sv.Example.Species where
import Data.ByteString (ByteString)
import System.Exit (exitFailure)
import Data.Sv
import qualified Data.Sv.Decode as D

file :: FilePath
file = "csv/species.csv"

opts :: ParseOptions
opts = defaultParseOptions

data Species =
  Species {
    taxonId :: ID
  , kingdom :: ByteString
  , clazz :: ByteString
  , family :: ByteString
  , scientificName :: ByteString
  , taxonAuthor :: ByteString
  , commonName :: ByteString
  , ncaCode:: Maybe NcaCode
  , epbcCode :: Maybe EpbcCode
  , significant :: Maybe Significance
  , endemicityCode :: Maybe Endemicity
  }
  deriving Show
newtype ID = ID Int deriving Show

idDecode :: Decode ByteString ByteString ID
idDecode = ID <$> D.int

data NcaCode
  = NExtinct -- PE
  | NCriticallyEndangered -- CE
  | NEndangered -- E
  | NVulnerable -- V
  | NNearThreatened -- NT
  | NSpecialLeastConcern -- SL
  | NLeastConcern -- C
  | NInternational -- I
  | NProhibited -- P
  deriving Show

nca :: Decode' ByteString NcaCode
nca =
  D.categorical [
    (NExtinct, "PE")
  , (NCriticallyEndangered, "CE")
  , (NEndangered, "E")
  , (NVulnerable, "V")
  , (NNearThreatened, "NT")
  , (NSpecialLeastConcern, "SL")
  , (NLeastConcern, "C")
  , (NInternational, "I")
  , (NProhibited, "P")
  ]
\end{code}

The following are similar types and decoders, this time for categories defined
in Environment Protection and Biodiversity Conservation Act 1999, and an
endemicity code. They are defined similarly to NcaCode above and its decoder.

\begin{code}
data EpbcCode
  = EExtinct -- EX
  | EWildExtinct -- WX
  | ECriticallyEndangered -- CE
  | EEndangered -- E
  | EVulnerable -- V
  | EConservationDependent -- CD
  deriving Show
epbc :: Decode' ByteString EpbcCode
epbc =
  D.categorical [
    (EExtinct, "EX")
  , (EWildExtinct, "WX")
  , (ECriticallyEndangered, "CE")
  , (EEndangered, "E")
  , (EVulnerable, "V")
  , (EConservationDependent, "CD")
  ]
data Endemicity
  = QueenslandEndemic -- Q
  | AustralianEndemic -- QA
  | QldAndInternational -- QI
  | AustraliaAndInternational -- QAI
  | QldNativeUndefinedEndemicity -- U
  | NaturalisedFromOverseas -- II
  | NaturalisedFromElsewhereInAus -- IA
  | NaturalisedFromUndefinedOrigin -- IU
  | VagrantAustralian -- VA
  | VagrantInternational -- VI
  | VagrantUndefined -- VU
  deriving Show
endemicity :: Decode' ByteString Endemicity
endemicity =
  D.categorical [
    (QueenslandEndemic, "Q")
  , (AustralianEndemic, "QA")
  , (QldAndInternational, "QI")
  , (AustraliaAndInternational, "QAI")
  , (QldNativeUndefinedEndemicity, "U")
  , (NaturalisedFromOverseas, "II")
  , (NaturalisedFromElsewhereInAus, "IA")
  , (NaturalisedFromUndefinedOrigin, "IU")
  , (VagrantAustralian, "VA")
  , (VagrantInternational, "VI")
  , (VagrantUndefined, "VU")
  ]
\end{code}

This is a boolean indicator of significance. We give it a categorical decoder.
This categorical decoder is different because we allow several
different strings to indicate each of the two values. This helps to deal with
data sets with inconsistently labeled categorical data.

\begin{code}
data Significance
  = Y
  | N
  deriving Show
significance :: Decode' ByteString Significance
significance =
  D.categorical' [
    (Y, ["Y", "y", "yes"])
  , (N, ["N", "n", "no"])
  ]
\end{code}

Now we put it all together! This is the decoder for our Species data type
defined above. We use our idDecode, a bunch of bytestrings, and then our
categorical decoders, each wrapped in orEmpty since they might be missing.
It's all glued together with Applicative combinators.

\begin{code}
speciesDecoder :: Decode' ByteString Species
speciesDecoder = let s = D.byteString in
  Species <$> idDecode <*> s <*> s <*> s <*> s <*> s <*> s <*>
    D.orEmpty nca <*> D.orEmpty epbc <*> D.orEmpty significance <*> D.orEmpty endemicity
\end{code}

We call parseDecodeFromFile to load, parse, and decode our file. Note that we're
passing our parse options in.

\begin{code}
species :: IO (DecodeValidation ByteString [Species])
species = parseDecodeFromFile speciesDecoder opts file
\end{code}

And that's it! We've defined a data type for our rows, built a Decode for
that type, and then parsed our CSV file into useful Haskell data types.

\begin{code}
main :: IO ()
main = do
  dv <- species
  case dv of
    Success rows ->
      print (length rows)
    Failure e -> do
      putStrLn "Failed to parse and decode species.csv:"
      print e
      exitFailure
\end{code}
