const getAudioGoogleUrl = text => {
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh&total=1&idx=0&textlen=${text.length}&client=tw-ob&prev=input&ttsspeed=0.24`
};

const getAudioBaiduUrl = text => {
  // return `https://tts.baidu.com/text2audio?cuid=baike&lan=ZH&ctp=1&pdt=301&vol=9&rate=32&per=4&tex=${encodeURIComponent(text)}`
  return `https://fanyi.baidu.com/gettts?lan=zh&text=${encodeURIComponent(text)}&spd=2&source=web`
};

const TongWen = require('../scripts/lib/TongWen').TongWen

function isHanzi(ch) {
  const REGEX_JAPANESE = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
  const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

  const isSpecialChar = "。？！".includes(ch)
  const isJapanese = REGEX_JAPANESE.test(ch)
  const isChinese = REGEX_CHINESE.test(ch)
  const isHanzi = !isSpecialChar && (isJapanese || isChinese)

  return isHanzi
}

const getCurrentSentenceTextContent = () => document.getElementById('currentSentence').textContent

////////////

document.addEventListener("DOMContentLoaded", function(){
  const board = new Board({id: "app", background: '#000'})
  board.setSize(2)
  board.setColor('#fff')

  let currentlySelectedElement = null
  const googleAudioEl = document.getElementById('google-tts-audio')
  const baiduAudioEl = document.getElementById('baidu-tts-audio')

  document.getElementById("body").addEventListener('click', function(event) {
    event.preventDefault()

    let element = event.target
    // console.log(element)

    if (element.tagName !== 'SENTENCE') {
      const parent = element.parentElement
      if (parent.tagName === 'SENTENCE') {
        element = parent
      } else {
        return
      }
    }

    if (element === currentlySelectedElement) {
      baiduAudioEl.play()
      return
    }

    currentlySelectedElement = element

    const text = currentlySelectedElement.textContent
    const simplifiedText = [...text].map(x => TongWen.t_2_s[x] || x).join('')
    const traditionalText = [...text].map(x => TongWen.s_2_t[x] || x).join('')

    ;(async function() {
      const respose = await fetch('/list-of-known-hanzi')
      const array = await respose.json()
      const setOfKnownHanzi = new Set(array)

      function addLinks(text) {
        const colorizer = ch => {
          const isKnown = setOfKnownHanzi.has(ch)
          const linkclass = isKnown ? ` class="known-hanzi"` : ''
          return `<a target="_blank" href="../h.html#${ch}"${linkclass}>${ch}</a>`
        }
        return [...text].map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')
      }

      document.getElementById('currentSentence').innerHTML = addLinks(simplifiedText)
      document.getElementById('currentSentenceTraditional').innerHTML = addLinks(traditionalText)
    })();

    googleAudioEl.src = getAudioGoogleUrl(text)
    googleAudioEl.load()

    baiduAudioEl.src = getAudioBaiduUrl(text)
    baiduAudioEl.load()
    baiduAudioEl.play()

    baiduAudioEl.addEventListener('ended', (event) => {
      googleAudioEl.play()
    }, { once: true })
  }, false);

  document.getElementById('pleco').addEventListener('click', function(event) {
    event.preventDefault()
    window.open(`plecoapi://x-callback-url/s?q=${encodeURIComponent(getCurrentSentenceTextContent())}`, '_blank')
  }, false);

  document.getElementById('clear-canvas').addEventListener('click', function(event) {
    event.preventDefault()
    board.clear()
  }, false);
});
