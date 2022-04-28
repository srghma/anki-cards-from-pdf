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
  const accentedLettersList = ["aàáâãäå", "eèéêë", "iìíîï", "oòóôõö", "uùúûü"].map(x => x.split(""))
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

const renderTable = (esAndGoogleTranslations, searchedWord) => {
  const searchedWordRegexString = mkRegexThatSearchesAccentedAndNonAccentedLetters(searchedWord);
  console.log({ searchedWord, searchedWordRegexString })

  return esAndGoogleTranslations.map((x, index) => {
    // console.log(x)
    const tdClass     = (kl, x) => String.raw`<td class="${kl}">${x}</td>`
    const tdClassData = (kl, x) => String.raw`<td class="${kl}" data-content="${x}"></td>`

    let word = x.esWordWithAccent || x.es
    word = word.replace(new RegExp(searchedWordRegexString, "g"), `<span style="color: #79ff79;">${searchedWord}</span>`)

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

function searchForUntil(wordNonAccented, allInfos) {
  console.log({ wordNonAccented })
  let infos = allInfos.filter(x => x.es.includes(wordNonAccented))

  while (true) {
    console.log(`while`, { wordNonAccented, infos: infos.length })
    if (wordNonAccented.length === 0) { break }
    if (infos.length > 1) { break }
    wordNonAccented = wordNonAccented.slice(0, -1)
    infos = allInfos.filter(x => x.es.includes(wordNonAccented))
    console.log(`while end`, { wordNonAccented, infos: infos.length })
  }

  return { infos, lastWordWithoutAccents: wordNonAccented }
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

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  })

  const word = params.q
  document.title = `search ${word}`

  const { infos, lastWordWithoutAccents } = searchForUntil(removeAccents(word), allInfos)
  const table = document.querySelector('table')

  table.innerHTML = renderTable(infos, lastWordWithoutAccents).join('')
  table.style.display = "table"
})();
