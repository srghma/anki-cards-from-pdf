popularVerbs = fs.readFileSync('spanish-verbs.txt').toString()
popularVerbs = popularVerbs.trim().split('\n')
popularVerbs = R.splitWhenever(x => x == '', popularVerbs)
popularVerbs = popularVerbs.map(([type, ...verbs]) => ({ type: type.toLowerCase(), verbs: verbs.map(x => x.split('|')) }))

// // verbs[0].verbs
// verbs = verbs.map(({ type, verbs }) => verbs.map(([spanish, en, googleRu]) => ({ ...(esAndGoogleTranslationsMap[spanish.replace('í', 'i')] || { googleRu }), type, spanish, en, id: spanish.replace('í', 'i') }))).flat()
// // verbs.filter(x => !x.googleRu)

// console.log(R.uniq(verbs.map(x => x.type)).sort().map(x => `my spanish verbs 1000::${x}`).join('\n'))

// require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["id", "en", "spanish", "_prompt", "_image",  "_a_en", "_a_tr", "_section", "_topic", "type", "googleRu", "etimologyEs", "etimologyRu", "ru", "conjugations"].map(x => ({ id: x, title: x })) }).writeRecords(verbs).then(() => { console.log('...Done') })

popularVerbsMap = popularVerbs.map(({ type, verbs }) => verbs.map(([spanish, en]) => ({ id: spanish.replace('í', 'i'), spanish, en, type }))).flat()
popularVerbsMap1 = R.fromPairs(popularVerbsMap.map((x) => [x.id, x]))

f = x => ({ esWordWithAccent: x.spanish, es: x.id, googleRu: x.en })
verbs = esAndGoogleTranslations.filter(x => x.conjugations)
left = {
  porracear: {
    id: 'porracear',
    spanish: 'porracear',
    en: 'thrash',
    type: 'regular-ar'
  },
  judicializar: {
    id: 'judicializar',
    spanish: 'judicializar',
    en: 'prosecute',
    type: 'regular-zar'
  },
  atenerse: {
    id: 'atenerse',
    spanish: 'atenerse',
    en: 'abide, stick to',
    type: 'irregular-er'
  },
  freir: {
    id: 'freir',
    spanish: 'freír',
    en: 'fry, cook',
    type: 'irregular-ir'
  },
  oir: {
    id: 'oir',
    spanish: 'oír',
    en: 'hear, listen to',
    type: 'irregular-ir'
  }
}

verbs = [ ...verbs, ...(R.values(left).map(f)) ]

// es: 'abanico',
// googleRu: 'поклонник',
// conjugations: undefined,
// ru:
// etimologyEs:
// etimologyRu:
// freqIndex: 9388,
// esWordWithAccent: 'abanico'

verbs = verbs.map(x => ({ ...x, popular: popularVerbsMap1[x.es] }))
verbs = R.sortBy(R.prop('es'), verbs)

// verbs.map(x => x.es).join(', ')
// x = verbs.filter(x => x.popular)
// x.forEach(x => {
//   delete popularVerbsMap1[x.popular.spanish]
// })

popularVerbsMap.length
verbs.length
x.length
R.keys(popularVerbsMap1).length
popularVerbsMap1

renderTable = (esAndGoogleTranslations, popular) => {
  const td         = (x) => String.raw`<td>${x}</td>`
  const tdOptional = (x) => x ? String.raw`<td>${x}</td>` : ''
  const tdData     = (kl, x) => String.raw`<td class="${kl}" data-content="${x}"></td>`

  return esAndGoogleTranslations.map((x, index) => {
    let ruTranslation

    if (x.ru) {
      ruTranslation = Array.from(x.ru.matchAll(/<dtrn>(.*?)<\/dtrn>/g))
      ruTranslation = ruTranslation.map(x => x[1])
      ruTranslation = ruTranslation.map(x => x.replace(/<co>(.*?)<\/co>/g, ''))
      // console.log(ruTranslation)
      ruTranslation = ruTranslation.map(x => x.replace(/<abr>(.*?)<\/abr>/g, ''))
      ruTranslation = ruTranslation.map(x => x.trim())
      ruTranslation = ruTranslation.filter(x => x)
      ruTranslation = ruTranslation.filter(x => !x.includes('<kref>'))
      ruTranslation = ruTranslation[0]
      if (ruTranslation) { ruTranslation = ruTranslation.split('<br>').map(x => x.trim().replace(/^,/, '').trim()).filter(x => x).join(', ') }
      if (ruTranslation) { ruTranslation = ruTranslation.replace(/<\/?.*?>/g, '') }
    }

    const ruTranslationOrGoogle = ruTranslation ? ruTranslation : x.googleRu
    const ruTranslationOrGoogleClass = ruTranslation ? 'ru-translation-from-dictionary' : null

    const tds = [
      td(String.raw`<a href="show.html#${encodeURIComponent(x.es)}" target="_blank">${index + 1}</td>`),
      td(x.esWordWithAccent || x.es),
      tdData(['ru-translation-get-from-content', ruTranslationOrGoogleClass].filter(x => x).join(' '), ruTranslationOrGoogle),
      td(x.conjugations ? "C" : ""),
      td(x.etimologyEs ? "E" : ""),
      td(x.freqIndex || ""),
    ]

    return String.raw`<tr>${tds.join('')}</tr>`
  })
}

renderHtml = (verbs) => `<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Spanish dict</title>
  <link rel="stylesheet" href="index.css">
  <link rel="stylesheet" href="common.css">
  <script src="index.js"></script>
 </head>
 <body class="nightMode">
  <table border="1" class="mytable" style="display: none;">
   ${renderTable(verbs).join('\n')}
  </table>
</div>
</div>
 </body>
</html>`

await (require('mkdirp'))('/home/srghma/projects/anki-cards-from-pdf/html/spanish')
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/verbs--all.html', renderHtml(verbs))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/verbs--popular.html', renderHtml(verbs.filter(x => x.popular)))
