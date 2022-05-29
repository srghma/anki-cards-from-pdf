function wrapNode(tag, value) { return `<${tag}>${value}</${tag}>` }

const loadStyle = function(src) {
  let s = document.createElement('link');
  s.rel = 'stylesheet';
  s.href = src;
  document.head.append(s);
}

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
abbyy.lingvo://show_word/WORD
/search.html?q=WORD
https://etimologias.dechile.net/?WORD
`.trim().split('\n').map(x => x.trim())

const userDictionaryFromLanguageReactor_names = `
conjucations babla
conjugations rev
dict babla
dict rev
abbyy
abbyy offline
search
etimology
`.trim().split('\n').map(x => x.trim())

const getAudioGoogleUrl = text => {
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&total=1&idx=0&client=tw-ob&prev=input&ttsspeed=0.75`
};

const getCurrentSentenceTextContent = () => document.getElementById('currentSentence').textContent

const userDictionaryFromLanguageReactor = zipWith((url, name) => ({ url, name }), userDictionaryFromLanguageReactor_urls, userDictionaryFromLanguageReactor_names)

function goUpUntilFind(element, p, maxDepth) {
  if (maxDepth <= 0) { return null }
  if (p(element)) {
    return element
  }
  const parent = element.parentElement
  if (!parent) { return null }
  return goUpUntilFind(parent, p, maxDepth - 1)
}

window.renderInContainer = function(spanishWord) {
  const containerId = "word-dictionaries-container"

  const html = userDictionaryFromLanguageReactor.map(({ url, name }) => {
    return `<a target="_blank" href="${url.replace('WORD', encodeURIComponent(spanishWord))}">${name}</a>`
  }).join(', ')

  getElementByIdRequired(containerId).innerHTML = `${spanishWord}: ${html}`
}

function addLinks(text) {
  const regex = /[áàãâéèêíìîõóòôúùûñ\w]+/gi
  const htmlText = text.replace(regex, match => `<span onclick="window.renderInContainer('${match}')">${match}</span>`)

  const firstWord = text.match(regex)[0]

  if (firstWord) window.renderInContainer(firstWord)

  return htmlText
}

document.addEventListener("DOMContentLoaded", async function(){
  const params = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop) })
  const bookName = decodeURIComponent(params.name)
  const bookData = await (fetch(`./${bookName}.json`).then(x => x.json()))

  document.title = bookData.title

  bookData.css.map(x => `${bookName}/${x}`).forEach(loadStyle)

  getElementByIdRequired('body').innerHTML = `<div><ul>${bookData.toc.map(x => wrapNode('sentence', x)).map(x => wrapNode('li', x)).join('\n')}</ul></div>
  ${bookData.htmlContent.replace(/IMAGES/g, `${bookName}/images`)}`

  ///////////////////////////

  let currentlySelectedElement = null
  const googleAudioEl = document.getElementById('tts-audio')

  getElementByIdRequired("body").addEventListener('click', function(event) {
    event.preventDefault()

    const element = goUpUntilFind(event.target, element => element.tagName === 'SENTENCE', 4)

    if (element === currentlySelectedElement) {
      googleAudioEl.play()
      return
    }

    currentlySelectedElement = element

    const text = currentlySelectedElement.textContent

    document.getElementById('currentSentence').innerHTML = addLinks(text)

    googleAudioEl.src = getAudioGoogleUrl(text)
    googleAudioEl.load()
    googleAudioEl.play()
  }, false)
})
