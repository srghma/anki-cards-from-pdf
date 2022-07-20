const zip = (a, b) => a.map((k, i) => [k, b[i]]);
const zipWith = (f, a, b) => a.map((k, i) => f(k, b[i]));
const getElementByIdRequired = (id) => {
  const element = document.getElementById(id)
  if (!element) { throw new Error(`no #${id}`) }
  return element
}

const userDictionaryFromLanguageReactor_urls = `
https://www.babla.ru/%D1%81%D0%BF%D1%80%D1%8F%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F/%D0%B8%D1%81%D0%BF%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9/WORD
https://conjugator.reverso.net/conjugation-spanish-verb-WORD.html
https://en.bab.la/dictionary/spanish-english/WORD
https://dictionary.reverso.net/spanish-english/WORD
https://www.lingvolive.com/ru-ru/translate/es-ru/WORD
lingvo://article/?WORD
/search?q=WORD
/search.html?q=WORD
https://en.m.wiktionary.org/wiki/WORD
http://www.spanishdict.com/translate/WORD
https://context.reverso.net/translation/english-russian/WORD
https://etimologias.dechile.net/?WORD
https://etimologias-dechile-net.translate.goog/?WORD&_x_tr_sch=http&_x_tr_sl=es&_x_tr_tl=ru&_x_tr_hl=en&_x_tr_pto=wapp
`.trim().split('\n').map(x => x.trim())

const userDictionaryFromLanguageReactor_names = `
conjucations babla
conjugations rev
dict babla
dict rev
abbyy
abbyy offline
search
search.html
wiki
spanishdict
context
ETIMOLOGY
RU ETIMOLOGY
`.trim().split('\n').map(x => x.trim())

const userDictionaryFromLanguageReactor = zipWith((url, name) => ({ url, name }), userDictionaryFromLanguageReactor_urls, userDictionaryFromLanguageReactor_names)

function renderHtmlOfLinks(spanishWord, etimology_link) {
  const linksHtml = userDictionaryFromLanguageReactor.map(({ url, name }) => {
    return `<a target="_blank" href="${url.replace('WORD', encodeURIComponent(spanishWord.toLowerCase()))}">${name}</a>`
  })

  const etimologiasLinkHtml = etimology_link
    ? [`<a target="_blank" href="https://etimologias.dechile.net/?${encodeURIComponent(etimology_link)}">etimology ${etimology_link}</a>`,
       `<a target="_blank" href="https://etimologias-dechile-net.translate.goog/?${encodeURIComponent(etimology_link)}&_x_tr_sch=http&_x_tr_sl=es&_x_tr_tl=ru&_x_tr_hl=en&_x_tr_pto=wapp">ru etimology ${etimology_link}</a>`]
    : []
    
  return [...linksHtml, ...etimologiasLinkHtml].filter(x => x).join(', ')
}



function removeSpans() {
  event.preventDefault()
  document.querySelector('.conjugations').innerHTML = document.querySelector('.conjugations').innerHTML.replace(/<span[^>]+>([^<]+)<\/span>/g, '$1')
}

;(async function(){
  // var info = JSON.parse(document.getElementById('info').textContent)

  const word = decodeURIComponent(window.location.hash.slice(1))
  document.title = word

  bucketIds = {
    w1: 'bergantin',
    w2: 'cortaforrajes',
    w3: 'escuatina',
    w4: 'jaretera',
    w5: 'patraquear',
    w6: 'sedente'
  }

  const is1     = x => x <= bucketIds.w1
  const is2     = x => x > bucketIds.w1 && x <= bucketIds.w2
  const is3     = x => x > bucketIds.w2 && x <= bucketIds.w3
  const is4     = x => x > bucketIds.w3 && x <= bucketIds.w4
  const is5     = x => x > bucketIds.w4 && x <= bucketIds.w5
  const is6     = x => x > bucketIds.w5 && x <= bucketIds.w6
  const isOther = x => x > bucketIds.w6

  const infoId = [
    is1(word)     ? '1' : null,
    is2(word)     ? '2' : null,
    is3(word)     ? '3' : null,
    is4(word)     ? '4' : null,
    is5(word)     ? '5' : null,
    is6(word)     ? '6' : null,
    isOther(word) ? 'other' : null,
  ].filter(x => x)[0]

  const info = await fetch(`./info-${infoId}.json`).then(x => x.json())

  const data = info[word]
  console.log(data)

  document.querySelector('.es').textContent = word
  document.querySelector('.googleRu').textContent = data.googleRu
  document.querySelector('.ru').innerHTML = data.ru || ""
  document.querySelector('.conjugations').innerHTML = data.conjugations || ""
  document.querySelector('.etimologias').innerHTML = data.etimologyEs || ""
  document.querySelector('.etimologias-ru').innerHTML = data.etimologyRu.split('\n').join('<br>') || ""
  
  getElementByIdRequired("buttons-container").innerHTML = renderHtmlOfLinks(word, null)
})();
