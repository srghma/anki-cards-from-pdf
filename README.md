```bash
mkdir -p ~/.local/bin
curl -sSL https://raw.githubusercontent.com/v-sukt/extract-pdf-notes/master/extract_notes.sh -o ~/.local/bin/extract_notes && chmod a+x ~/.local/bin/extract_notes
echo $PATH | grep ~/.local/bin > /dev/null || echo "export PATH=$HOME/.local/bin:$PATH" >> ~/.bashrc && source ~/.bashrc
extract_notes "Sample File.pdf"
```

```
<span class="pron-info dpron-info"><span class="pron dpron">/<span class="ipa dipa">fɛɐˈzuːxən</span>/</span></span>

<span class="ipa dipa">([^<]+)<\/span>

https://dictionary.cambridge.org/dictionary/german-english/versuchen
```

## Using local docker image

```
docker build -t extract_pdf_notes .
```

## google translate example request

```
# https://cloud.google.com/translate/docs/basic/translating-text#translating_text

# resp
# {
#   "data": {
#     "translations": [
#       {
#         "translatedText": "прибыть"
#       }
#     ]
#   }
# }

json='
{
  "q": "ankommen",
  "source": "de",
  "target": "ru"
}
'
echo $json | curl -X POST \
-H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
-H "Content-Type: application/json; charset=utf-8" \
-d @- \
https://translation.googleapis.com/language/translate/v2
```

https://developers.lingvolive.com/ru-ru/Help

key at - https://console.cloud.google.com/apis/credentials/serviceaccountkey

## add translations

```
./extract_notes.sh > /tmp/asdf

abbyy_api_key="ZDkwOTkyMTktODFmNC00OTdlLThjNjMtZTg3NzU0NWZhMmFlOmE0OWViNmViMDIyYTQwYzhiZTU2NDk4NDJmNTI3YTdk"

export GOOGLE_APPLICATION_CREDENTIALS="./My First Project.json"
google_translate_access_key="$(gcloud auth application-default print-access-token)"

cat ./from-pdf-tmp.json | spago run \
  --main PdfAnkiTranslator.Main \
  --node-args "--cache ./mycache.json --abbyy-api-key '$abbyy_api_key' --google-translate-access-key '$google_translate_access_key'"
```

```
abbyy_api_key="ZDkwOTkyMTktODFmNC00OTdlLThjNjMtZTg3NzU0NWZhMmFlOmE0OWViNmViMDIyYTQwYzhiZTU2NDk4NDJmNTI3YTdk"

export GOOGLE_APPLICATION_CREDENTIALS="./My First Project.json"
google_translate_access_key="$(gcloud auth application-default print-access-token)"

spago run \
  --main UpdateCsv.Main \
  --node-args "--cache ./mycache.json --abbyy-api-key '$abbyy_api_key' --google-translate-access-key '$google_translate_access_key'"
```
