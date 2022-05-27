function toList(arrayOfObjects) {
  const buffer = []
  arrayOfObjects.forEach(function(object) {
    for (let [key, value] of Object.entries(object)) {
      value.es = key
      buffer.push(value)
    }
  })
  return buffer
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  // accentedLetters.forEach(({ nonAccented, accented }) => {
  //   str = str.replace(new RegExp(accented, "g"), nonAccented)
  // })
  // return str
}

function mkRegexThatSearchesAccentedAndNonAccentedLetters(str) {
  // diactrics/accents
  const accentedLettersList = ["aàáâãäå", "eèéêë", "iìíîï", "oòóôõö", "uùúûü", "nñ"].map(x => x.split(""))
  accentedLettersList.forEach(accentedLetters => {
    const accentedLettersOr = `(${accentedLetters.join("|")})`
    str = str.replace(new RegExp(accentedLettersOr, "g"), accentedLettersOr)
  })
  return str
}

function addLinksToXdxf(htmlStr) {
  htmlStr = htmlStr.replace(/<kref>(.*?)<\/kref>/g, (_match, g1) => `<a class="kref" target="_blank" href="search?q=${encodeURIComponent(g1)}">${g1}</a>`)
  return htmlStr
}

const renderTable = (esAndGoogleTranslations, lastIdSubstring) => {
  const searchedWordRegexString = mkRegexThatSearchesAccentedAndNonAccentedLetters(lastIdSubstring);
  console.log({ lastIdSubstring, searchedWordRegexString })

  return esAndGoogleTranslations.map((x, index) => {
    // console.log(x)
    const tdClass     = (kl, x) => String.raw`<td class="${kl}">${x}</td>`
    const tdClassData = (kl, x) => String.raw`<td class="${kl}" data-content="${x}"></td>`

    let word = x.esWordWithAccent || x.es
    word = word.replace(new RegExp(searchedWordRegexString, "g"), match => `<span style="color: #79ff79;">${match}</span>`)

    const ruOrGoogleTd = x.ru ? tdClass("xdxf", addLinksToXdxf(x.ru)) : tdClassData("googleRu", x.googleRu)

    const tds = [
      tdClass("index",        String.raw`<a href="show.html#${encodeURIComponent(x.es)}" target="_blank">${index + 1}</td>`),
      tdClass("word",         word),
      ruOrGoogleTd,
      tdClass("conjugations", x.conjugations ? "C" : ""),
      tdClass("etimologyEs",  x.etimologyEs ? "E" : ""),
      tdClass("freq",         x.freqIndex || ""),
    ]

    return String.raw`<tr>${tds.join('')}</tr>`
  })
}

function searchForUntil({ id, allInfos, predicate }) {
  let infos = allInfos.filter(x => predicate(x, id))

  while (true) {
    console.log(`while`, { id, infos: infos.length })
    if (id.length === 0) { break }
    if (infos.length > 1) { break }
    id = id.slice(0, -1)
    infos = allInfos.filter(x => predicate(x, id))
    console.log(`while end`, { id, infos: infos.length })
  }

  return { infos, lastIdSubstring: id }
}

;(async function(){
  let allInfos = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    'other',
  ]

  allInfos = allInfos.map(x => fetch(`./info-${x}.json`).then(x => x.json()))
  allInfos = await Promise.all(allInfos)
  allInfos = toList(allInfos)
  // console.log(allInfos.filter(x => x.es.includes('ñ')).map(x => x.es).sort())

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  })

  const word = decodeURIComponent(params.q)
  document.title = `search ${word}`

  // console.log(id)
  let { infos, lastIdSubstring } = searchForUntil({
    id: removeAccents(word.toLowerCase()), // arañar -> aranar
    allInfos: allInfos.map(x => [removeAccents(x.es), x]),
    predicate: ([id, _], lastIdSubstring) => id.includes(lastIdSubstring)
  })
  infos = infos.map(([id, x]) => x)

  const table = document.querySelector('table')

  table.innerHTML = renderTable(infos, lastIdSubstring).join('')
  table.style.display = "table"
})();
