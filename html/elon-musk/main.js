const googleTTS = require('google-tts-api')
const TongWen = require('../../scripts/lib/TongWen').TongWen

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

const playTTS = (url) => {
   // audioEl.play();
};

const setAudio = text => {
  const url = googleTTS.getAudioUrl(text, {
    lang: 'zh',
    slow: true,
  });

  const audioEl = document.getElementById('tts-audio')
  if (audioEl.src !== url) {
    audioEl.src = url
    audioEl.load()
  }
  audioEl.play()
}


////////////

document.addEventListener("DOMContentLoaded", function(){
  const board = new Board({id: "app", background: '#000'})
  board.setSize(2)
  board.setColor('#fff')

  document.getElementById("body").addEventListener('click', function(event) {
    event.preventDefault()

    const element = event.target

    if (element.tagName !== 'SENTENCE') { return }

    function addLinks(text) {
      const colorizer = (ch, colorIndex) => `<a target="_blank" href="../h.html#${ch}">${ch}</a>`
      return [...text].map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')
    }

    const text = element.textContent
    const simplified = [...text].map(x => TongWen.t_2_s[x] || x).join('')
    const traditional = [...text].map(x => TongWen.s_2_t[x] || x).join('')

    document.getElementById('currentSentence').innerHTML = addLinks(simplified)
    document.getElementById('currentSentenceTraditional').innerHTML = addLinks(traditional)

    board.clear()
    setAudio(element.textContent)
  }, false);

  document.getElementById('pleco').addEventListener('click', function(event) {
    event.preventDefault()

    window.open(`plecoapi://x-callback-url/s?q=${encodeURIComponent(getCurrentSentenceTextContent())}`, '_blank')
  }, false);

  //////////////
});
