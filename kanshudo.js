options = {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
}

for (let i = 0; i < kanji.length; i++) {
  const k = kanji[i]

  console.log(k)

  const output = await fetch("https://www.kanshudo.com/kanji/" + k, options);

  console.log(output)

  const text = await output.text()

  console.log(text)

  processed.push({ k, text })
}

p = distinctBy('k', processed.map(x => {
  const o = x.text.match(/\<div\ class="k_mnemonic"\>\s+\<span\ class="k_title"\>Kanshudo mnemonic\: <\/span>(.*?)<\/div>/ms)

  const o_ = o ? o[1].trim() : null

  return { k: x.k, o: o_ }
  })
)

x = require('/home/srghma/projects/extract-pdf-notes/kanshudo-cache.js')
o = x.x.map(x => JSON.stringify(x.k) + "," + JSON.stringify(x.o || "")).join('\n')
fs = require('fs')
fs.writeFileSync('/home/srghma/output', o)
