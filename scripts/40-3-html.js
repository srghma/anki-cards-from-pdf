groupByAndToArray = (byFn, key, val, input) => R.toPairs(R.groupBy(byFn, input)).map(x => ({ [key]: x[0], [val]: x[1] }))

tOrig = fs.readFileSync('./table-with-tabs.txt').toString()
tOrigLines = tOrig.split('\n')
splitLine = line => R.split('\t', line).flat().flat()
sections_ = tOrigLines.filter(R.identity).map(line => ({ sectionLetter: line.trim()[0], pinyins: splitLine(line) }))
toSectionId = x => x.replace(/ü/g, 'v')

t___ = t__.flat().map(R.values).flat().filter(R.identity).map(x => ({ ...x, sectionLetter: x.withoutMark[0] }))
t___ = groupByAndToArray(R.prop('withoutMark'), "sectionLetter", "pinyins", t___)

output_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Hua ma</title>
  <link rel="stylesheet" href="main.css">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
.pinyin__containers { display: flex; }
.pinyin__root_container { display: none; }
.pinyin__root_container--show { display: block; }
.pinyin__container { flex-grow: 1; flex-basis: 0; }
  </style>
 </head>
 <body id="ruby" class="nightMode my-pinyin-hanzi_container--front trainchinese-container--hide-hanzi purpleculture_pinyin--front">
  <div class="table-container">
  <table border="1">
   ${sections_.map(x => String.raw`<tr>` + x.pinyins.map(x => String.raw`<td><a onclick="window.showRootContainer('${x}')" href="#${x}">${x}</a></td>`).join('') + String.raw`</tr>`).join('\n')}
  </table>
  </div>
  ${
  t___.map(({ sectionLetter, pinyins }) => {
    return String.raw`
<div id="pinyin__root_container__${sectionLetter}" class="pinyin__root_container">
<h1><a id="${sectionLetter}"></a>${sectionLetter}</h1>
<div class="pinyin__containers">
${
pinyins.map(pinyin => {
return String.raw`
<div class="pinyin__container">
<div class="pinyin__header">${pinyin.marked}</div>
<div class="pinyin__item">${pinyin.front}</div>
</div>`
}).join('\n')
}
</div>
</div>
`
  }).join('\n')
  }
<div id="kanjiIframeContainer"></div>
<script src="myscripts.js"></script>
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/f.html', output_)

output_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Hua ma</title>
  <link rel="stylesheet" href="main.css">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
.pinyin__containers { display: flex; }
.pinyin__root_container { display: none; }
.pinyin__root_container--show { display: block; }
.pinyin__container { flex-grow: 1; flex-basis: 0; }
  </style>
 </head>
 <body id="ruby" class="nightMode my-pinyin-hanzi_container--back">
  <div class="table-container">
  <table border="1">
   ${sections_.map(x => String.raw`<tr>` + x.pinyins.map(x => String.raw`<td><a onclick="window.showRootContainer('${x}')" href="#${x}">${x}</a></td>`).join('') + String.raw`</tr>`).join('\n')}
  </table>
  </div>
  ${
  t___.map(({ sectionLetter, pinyins }) => {
    return String.raw`
<div id="pinyin__root_container__${sectionLetter}" class="pinyin__root_container">
<h1><a id="${sectionLetter}"></a>${sectionLetter}</h1>
<div class="pinyin__containers">
${
pinyins.map(pinyin => {
return String.raw`
<div class="pinyin__container">
<div class="pinyin__header">${pinyin.marked}</div>
<div class="pinyin__item">${pinyin.front}</div>
</div>`
}).join('\n')
}
</div>
</div>
`
  }).join('\n')
  }
<div id="kanjiIframeContainer"></div>
<script src="myscripts.js"></script>
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/b.html', output_)

output_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Hua ma</title>
  <link rel="stylesheet" href="main.css">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
  </style>
 </head>
 <body class="nightMode">
<div id="kanjiIframeContainer"></div>
<script src="myscripts.js"></script>
<script>
window.showKanjiIframe(window.location.hash.slice(1))
</script>
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/h.html', output_)
