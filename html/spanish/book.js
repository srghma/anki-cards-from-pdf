let etimologias_with_ru_cache = null; fetch('etimologias_with_ru_cache.json').then(x => x.json()).then(x => { etimologias_with_ru_cache = x })
let etimologias_cache__urls__without_nulls = null; fetch('etimologias_cache--urls--without-nulls.json').then(x => x.json()).then(x => { etimologias_cache__urls__without_nulls = x })

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
lingvo://article/?WORD
/search?q=WORD
/search.html?q=WORD
https://en.m.wiktionary.org/wiki/WORD
https://www.spanishdict.com/translate/WORD
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
`.trim().split('\n').map(x => x.trim())

const getAudioGoogleUrl = text => `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&total=1&idx=0&client=tw-ob&prev=input&ttsspeed=0.75`

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

function findEtymology(etimologias_with_ru_cache, spanishWord, etimology_link) {
  const normalize = x => {
    [
      [ 'áàãâ', 'a' ],
      [ 'éèê',  'e' ],
      [ 'íìî',  'i' ],
      [ 'õóòô', 'o' ],
      [ 'úùû',  'u' ],
    ].forEach(([from, toChar]) => {
      from.split('').forEach(fromChar => {
        x.replace(new RegExp(fromChar, "g"), toChar)
      })
    })
    return x
  }

  const spanishWord_ = spanishWord.toLowerCase()
  const normalizedSpanishWord = normalize(spanishWord_)

  const etimologias_with_ru_cacheElement = etimologias_with_ru_cache.find(x => x.allKeys.includes(etimology_link) || x.allKeys.includes(spanishWord_) || x.allKeys.includes(normalizedSpanishWord))

  return etimologias_with_ru_cacheElement
}

window.renderInContainer = function(spanishWord, etimology_link) {
  getElementByIdRequired("word-dictionaries-container--etimologias-es").innerHTML = ''
  getElementByIdRequired("word-dictionaries-container--etimologias-ru").innerHTML = ''

  const linksHtml = userDictionaryFromLanguageReactor.map(({ url, name }) => {
    return `<a target="_blank" href="${url.replace('WORD', encodeURIComponent(spanishWord))}">${name}</a>`
  })

  const etimologiasLinkHtml = etimology_link
    ? `<a target="_blank" href="https://etimologias.dechile.net/?${encodeURIComponent(etimology_link)}">etimology ${etimology_link}</a>`
    : `<a target="_blank" href="https://etimologias.dechile.net/?${encodeURIComponent(spanishWord)}">etimology</a>`

  // console.log(etimologias_with_ru_cache)

  getElementByIdRequired("word-dictionaries-container--current-word").textContent = spanishWord
  getElementByIdRequired("word-dictionaries-container--link").innerHTML = [...linksHtml, etimologiasLinkHtml].join(', ')

  if (etimologias_with_ru_cache) {
    const etimologias_with_ru_cacheElement = findEtymology(etimologias_with_ru_cache, spanishWord, etimology_link)
    if (etimologias_with_ru_cacheElement) {
      getElementByIdRequired("word-dictionaries-container--etimologias-es").innerHTML = etimologias_with_ru_cacheElement.value
      getElementByIdRequired("word-dictionaries-container--etimologias-ru").innerHTML = etimologias_with_ru_cacheElement.ruText
    }
  }
}

function addLinks(text) {
  getElementByIdRequired("word-dictionaries-container--etimologias-es").innerHTML = ''
  getElementByIdRequired("word-dictionaries-container--etimologias-ru").innerHTML = ''

  const regex = /[áàãâéèêíìîõóòôúùûñ\w]+/gi
  console.log(etimologias_cache__urls__without_nulls)
  const htmlText = text.replace(regex, word => {
    const etimology_link = etimologias_cache__urls__without_nulls[word.toLowerCase()]
    return `<span ${etimology_link ? `class="has-etimology"` : ''} onclick="window.renderInContainer('${word}', ${etimology_link ? `'${etimology_link}'` : `null`})">${word}</span>`
  })

  const firstWord = text.match(regex)[0]

  if (firstWord) window.renderInContainer(firstWord)

  return htmlText
}

function findFirstNonSiblingSentenceElement(root) {
  const nodeIterator = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    (node) => node.nodeName.toLowerCase() === 'sentence' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  )
  return nodeIterator.nextNode()
}

document.addEventListener("DOMContentLoaded", async function(){
  const params = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop) })
  const bookName = decodeURIComponent(params.name)
  const bookData = await (fetch(`./${bookName}.json`).then(x => x.json()))

  if (params.disableAudio) {
    document.getElementById('tts-audio').remove()
    // document.getElementById('prev-button').remove()
    // document.getElementById('next-button').remove()
  }

  document.title = bookData.title

  bookData.css.map(x => `${bookName}/${x}`).forEach(loadStyle)

  getElementByIdRequired('body').innerHTML = `<div><ul>${bookData.toc.map(x => wrapNode('sentence', x)).map(x => wrapNode('li', x)).join('\n')}</ul></div>
  ${bookData.htmlContent.replace(/IMAGES/g, `${bookName}/images`)}`

  ///////////////////////////

  let currentlySelectedElement = null

  function selectElement(element) {
    const googleAudioEl = params.disableAudio ? document.getElementById('tts-audio') : null

    if (element === currentlySelectedElement) {
      if (googleAudioEl) { googleAudioEl.play() }
      return
    }

    currentlySelectedElement = element

    const text = currentlySelectedElement.textContent

    document.getElementById('currentSentence').innerHTML = addLinks(text)
    document.getElementById('currentSentence--google-link').href = `https://translate.google.com/?sl=es&tl=ru&text=${encodeURIComponent(text)}&op=translate`

    if (googleAudioEl) {
      googleAudioEl.src = getAudioGoogleUrl(text)
      googleAudioEl.load()
      googleAudioEl.play()
    }
  }

  getElementByIdRequired("body").addEventListener('click', function(event) {
    event.preventDefault()
    const element = goUpUntilFind(event.target, element => {
      console.log('goUpUntilFind: ', element.tagName)
      return element.tagName === 'SENTENCE'
    }, 4)
    if (!element) { throw new Error('goUpUntilFind: no element') }
    selectElement(element)
  }, false)

  const onNextPrevButtonClick = prevOrNext => event => {
    event.preventDefault()

    const elements = Array.from(document.querySelectorAll('sentence'))
    let nextSentenceElement

    if (!currentlySelectedElement) {
      nextSentenceElement = elements[0]
    } else {
      const currentlySelectedElementIndex = elements.findIndex(x => x === currentlySelectedElement)
      const requiredElementIndex = prevOrNext === "prev" ? currentlySelectedElementIndex - 1 : currentlySelectedElementIndex + 1
      nextSentenceElement = elements[requiredElementIndex]
    }

    if (!nextSentenceElement) { return }

    selectElement(nextSentenceElement)
  }

  getElementByIdRequired("prev-button").addEventListener('click', onNextPrevButtonClick("prev"), false)
  getElementByIdRequired("next-button").addEventListener('click', onNextPrevButtonClick("next"), false)
})
