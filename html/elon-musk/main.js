const googleTTS = require('google-tts-api')

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
}


////////////

document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("body").addEventListener('click', function(event) {
    event.preventDefault()

    const element = event.target

    if (element.tagName !== 'SENTENCE') { return }

    function addLinks(text) {
      const colorizer = (ch, colorIndex) => `<a target="_blank" href="../h.html#${ch}">${ch}</a>`
      return [...text].map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')
    }

    document.getElementById('currentSentence').innerHTML = addLinks(element.getAttribute("data-simplified"))
    document.getElementById('currentSentenceTraditional').innerHTML = addLinks(element.getAttribute("data-traditional"))

    setAudio(element.textContent)
  }, false);

  document.getElementById('pleco').addEventListener('click', function(event) {
    event.preventDefault()

    window.open(`plecoapi://x-callback-url/s?q=${encodeURIComponent(getCurrentSentenceTextContent())}`, '_blank')
  }, false);

  //////////////

  const paintCanvas = document.getElementById('canvas-canvas')
  const context = paintCanvas.getContext('2d')
  context.lineCap = 'round';

  const colorPicker = document.getElementById('canvas-color-picker');

  colorPicker.addEventListener('change', event => {
    context.strokeStyle = event.target.value;
  })

  const lineWidthRange = document.getElementById('canvas-line-range')
  const lineWidthLabel = document.getElementById('canvas-range-value')

  lineWidthRange.addEventListener('input', event => {
      const width = event.target.value;
      lineWidthLabel.innerHTML = width;
      context.lineWidth = width;
  })

  let x = 0, y = 0;
  let isMouseDown = false;

  const stopDrawing = () => { isMouseDown = false; }
  const startDrawing = event => {
    isMouseDown = true;
    [x, y] = [event.offsetX, event.offsetY];
  }
  const drawLine = event => {
    if (isMouseDown) {
      const newX = event.offsetX;
      const newY = event.offsetY;
      context.beginPath();
      context.moveTo(x, y)
      context.lineTo(newX, newY)
      context.stroke();
      //[x, y] = [newX, newY];
      x = newX;
      y = newY;
    }
  }

  const resetCanvas = () => {
    paintCanvas.width = window.innerWidth
    // context.fillStyle = 'rgb(255,255,255)';
    context.fillStyle = 'rgb(0,0,0)';
    context.fillRect(0,0,paintCanvas.width,paintCanvas.height);
    context.strokeStyle = colorPicker.value;
    console.log(context.strokeStyle)
  }

  resetCanvas()

  paintCanvas.addEventListener('mousedown', startDrawing)
  paintCanvas.addEventListener('mousemove', drawLine)
  paintCanvas.addEventListener('mouseup', stopDrawing)
  paintCanvas.addEventListener('mouseout', stopDrawing)
  document.getElementById('canvas-clear').addEventListener('click', event => {
    event.preventDefault()
    resetCanvas()
  })
});
