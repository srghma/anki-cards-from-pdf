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

  (function() {
    const canvas = document.getElementById('canvas-canvas')

    const colorPicker = document.getElementById('canvas-color-picker');
    colorPicker.addEventListener('change', event => {
      ctx.strokeStyle = event.target.value;
    })

    // Set up the canvas
    const ctx = canvas.getContext("2d");
    ctx.lineCap = 'round';
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWith = 2;
    canvas.width = window.innerWidth;

    // Get a regular interval for drawing to the screen
    window.requestAnimFrame = (function (callback) {
      return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimaitonFrame ||
            function (callback) {
              window.setTimeout(callback, 1000/60);
            };
    })();

    // Set up the UI
    const clearBtn = document.getElementById("canvas-clear");
    clearBtn.addEventListener("click", function (e) {
      clearCanvas();
    }, false);

    // Set up mouse events for drawing
    let drawing = false;
    let mousePos = { x:0, y:0 };
    let lastPos = mousePos;
    canvas.addEventListener("mousedown", function (e) {
      e.preventDefault()
      drawing = true;
      lastPos = getMousePos(canvas, e);
    }, false);
    canvas.addEventListener("mouseup", function (e) {
      e.preventDefault()
      drawing = false;
    }, false);
    canvas.addEventListener("mousemove", function (e) {
      e.preventDefault()
      mousePos = getMousePos(canvas, e);
    }, false);

    // Set up touch events for mobile, etc
    canvas.addEventListener("touchstart", function (e) {
      e.preventDefault()
      mousePos = getTouchPos(canvas, e);
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, false);
    canvas.addEventListener("touchend", function (e) {
      e.preventDefault()
      const mouseEvent = new MouseEvent("mouseup", {});
      canvas.dispatchEvent(mouseEvent);
    }, false);
    canvas.addEventListener("touchmove", function (e) {
      e.preventDefault()
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, false);

    // Prevent scrolling when touching the canvas
    document.body.addEventListener("touchstart", function (e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);
    document.body.addEventListener("touchend", function (e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);
    document.body.addEventListener("touchmove", function (e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);

    // Get the position of the mouse relative to the canvas
    function getMousePos(canvasDom, mouseEvent) {
      const rect = canvasDom.getBoundingClientRect();
      return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
      };
    }

    // Get the position of a touch relative to the canvas
    function getTouchPos(canvasDom, touchEvent) {
      const rect = canvasDom.getBoundingClientRect();
      return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
      };
    }

    // Draw to the canvas
    function renderCanvas() {
      if (drawing) {
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        lastPos = mousePos;
      }
    }

    // Clear the canvas
    function clearCanvas() {
      canvas.width = window.innerWidth;
      // paintCanvas.width = window.innerWidth
      // // context.fillStyle = 'rgb(255,255,255)';
      // context.fillStyle = 'rgb(0,0,0)';
      // context.fillRect(0,0,paintCanvas.width,paintCanvas.height);
      // context.strokeStyle = colorPicker.value;
      // console.log(context.strokeStyle)
    }

    // Allow for animation
    (function drawLoop () {
      requestAnimFrame(drawLoop);
      renderCanvas();
    })();

  })();
});
