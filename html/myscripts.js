// https://github.com/jackmoore/autosize/blob/master/dist/autosize.min.js
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e||self).autosize=t()}(this,function(){var e,t,n="function"==typeof Map?new Map:(e=[],t=[],{has:function(t){return e.indexOf(t)>-1},get:function(n){return t[e.indexOf(n)]},set:function(n,o){-1===e.indexOf(n)&&(e.push(n),t.push(o))},delete:function(n){var o=e.indexOf(n);o>-1&&(e.splice(o,1),t.splice(o,1))}}),o=function(e){return new Event(e,{bubbles:!0})};try{new Event("test")}catch(e){o=function(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!1),t}}function r(e){var t=n.get(e);t&&t.destroy()}function i(e){var t=n.get(e);t&&t.update()}var l=null;return"undefined"==typeof window||"function"!=typeof window.getComputedStyle?((l=function(e){return e}).destroy=function(e){return e},l.update=function(e){return e}):((l=function(e,t){return e&&Array.prototype.forEach.call(e.length?e:[e],function(e){return function(e){if(e&&e.nodeName&&"TEXTAREA"===e.nodeName&&!n.has(e)){var t,r=null,i=null,l=null,d=function(){e.clientWidth!==i&&c()},u=function(t){window.removeEventListener("resize",d,!1),e.removeEventListener("input",c,!1),e.removeEventListener("keyup",c,!1),e.removeEventListener("autosize:destroy",u,!1),e.removeEventListener("autosize:update",c,!1),Object.keys(t).forEach(function(n){e.style[n]=t[n]}),n.delete(e)}.bind(e,{height:e.style.height,resize:e.style.resize,overflowY:e.style.overflowY,overflowX:e.style.overflowX,wordWrap:e.style.wordWrap});e.addEventListener("autosize:destroy",u,!1),"onpropertychange"in e&&"oninput"in e&&e.addEventListener("keyup",c,!1),window.addEventListener("resize",d,!1),e.addEventListener("input",c,!1),e.addEventListener("autosize:update",c,!1),e.style.overflowX="hidden",e.style.wordWrap="break-word",n.set(e,{destroy:u,update:c}),"vertical"===(t=window.getComputedStyle(e,null)).resize?e.style.resize="none":"both"===t.resize&&(e.style.resize="horizontal"),r="content-box"===t.boxSizing?-(parseFloat(t.paddingTop)+parseFloat(t.paddingBottom)):parseFloat(t.borderTopWidth)+parseFloat(t.borderBottomWidth),isNaN(r)&&(r=0),c()}function a(t){var n=e.style.width;e.style.width="0px",e.style.width=n,e.style.overflowY=t}function s(){if(0!==e.scrollHeight){var t=function(e){for(var t=[];e&&e.parentNode&&e.parentNode instanceof Element;)e.parentNode.scrollTop&&t.push({node:e.parentNode,scrollTop:e.parentNode.scrollTop}),e=e.parentNode;return t}(e),n=document.documentElement&&document.documentElement.scrollTop;e.style.height="",e.style.height=e.scrollHeight+r+"px",i=e.clientWidth,t.forEach(function(e){e.node.scrollTop=e.scrollTop}),n&&(document.documentElement.scrollTop=n)}}function c(){s();var t=Math.round(parseFloat(e.style.height)),n=window.getComputedStyle(e,null),r="content-box"===n.boxSizing?Math.round(parseFloat(n.height)):e.offsetHeight;if(r<t?"hidden"===n.overflowY&&(a("scroll"),s(),r="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight):"hidden"!==n.overflowY&&(a("hidden"),s(),r="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight),l!==r){l=r;var i=o("autosize:resized");try{e.dispatchEvent(i)}catch(e){}}}}(e)}),e}).destroy=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],r),e},l.update=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],i),e}),l});

const containerId = 'kanjiIframeContainer'

function waitForElementToAppear(get) {
  return new Promise(function (resolve, reject) {
      (function doWait(){
        const element = get()
        if (element) return resolve(element)
        setTimeout(doWait, 0)
      })();
  });
}

const unique = x => [...new Set(x)]

window.copyToClipboard = (
  value,
  successfully = () => null,
  failure = () => null
) => {
  const clipboard = navigator.clipboard;
  if (clipboard !== undefined && clipboard !== "undefined") {
    navigator.clipboard.writeText(value).then(successfully, failure);
  } else {
    if (document.execCommand) {
      const el = document.createElement("input");
      el.value = value;
      document.body.append(el);

      el.select();
      el.setSelectionRange(0, value.length);

      if (document.execCommand("copy")) {
        successfully();
      }

      el.remove();
    } else {
      failure();
    }
  }
};

function isHanzi(ch) {
  const REGEX_JAPANESE = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
  const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

  const isSpecialChar = "。？！".includes(ch)
  const isJapanese = REGEX_JAPANESE.test(ch)
  const isChinese = REGEX_CHINESE.test(ch)
  const isHanzi = !isSpecialChar && (isJapanese || isChinese)

  return isHanzi
}

;(function() {
  function reset() {
    const removeClassFromAllElements = kl => {
      // console.log(kl)
      Array.from(document.querySelectorAll('.' + kl)).forEach(el => {
        // console.log(el)
        el.classList.remove(kl)
      })
    }
    [ "my-pinyin-translation-container--force-show", "my-pinyin-hanzi--force-show", "pinyin__root_container--show" ].forEach(removeClassFromAllElements)

    if (window.location.pathname === "/h.html") {
      document.getElementById(containerId).innerHTML = ''
    }
  }

  window.showRootContainer = function(pinyin) {
    reset()
    document.getElementById(`pinyin__root_container__${pinyin}`).classList.add('pinyin__root_container--show')
  }

  if (window.location.pathname !== "/h.html") {
    if(window.location.hash) {
      try {
        const tablePinyin = window.location.hash.slice(1)
        window.showRootContainer(tablePinyin)
        document.title = tablePinyin
        // el.scrollIntoView({
        //   behavior: 'smooth', // smooth scroll
        //   block: 'start' // the upper border of the element will be aligned at the top of the visible part of the window of the scrollable area.
        // })
      } catch (e) {
        console.error(e)
      }
    }
  }
})();

;(function() {
  function displayKanji({ kanji, value }) {
    const parentElem = document.getElementById(containerId)
    parentElem.innerHTML = value

    document.title = kanji

    function enhanceWithLinkToH(containerElement) {
      // const colorizer = (ch, colorIndex) => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${ch}</a>`
      const colorizer = (ch, colorIndex) => `<a target="_blank" href="h.html#${ch}">${ch}</a>`
      // const colorizer = (ch, colorIndex) => `<div onclick="window.copyToClipboard('${ch}')">${ch}</div>`
      const ruby_chars = [...containerElement.innerHTML]
      containerElement.innerHTML = ruby_chars.map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')
    }

    Array.from(document.querySelectorAll('[data-enhance-with-pleco]')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#chinese_opposite')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#ch_with_same_pronounciation')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#Ru_trainchinese')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#origin_of_ch_char_book')).forEach(enhanceWithLinkToH)
    // Array.from(document.querySelectorAll('#rtega_mnemonic')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#purpleculture_info')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#purpleculture_tree')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#purpleculture_examples')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#myStory')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#heisig_constituent')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#humanum_small_description')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#humanum_small_description_en')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#humanum_full_description')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#humanum_full_description_en')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#baidu_chinese')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#baidu_chinese_en')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#hanziyuan')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#yw11')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#yw11_en_transl')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#yw11_image_chinese')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#yw11_image_ru_transl')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#bkrs_pinyin')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('#bkrs_transl')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('.my-pinyin-english')).forEach(enhanceWithLinkToH)
    Array.from(document.querySelectorAll('.my-pinyin-ru')).forEach(enhanceWithLinkToH)
    // Array.from(document.querySelectorAll('.dictips')).forEach(enhanceWithLinkToH)
    // Array.from(document.querySelectorAll('.yw11_image__container')).forEach(enhanceWithLinkToH)
    // Array.from(document.querySelectorAll('.trainchinese-transl')).forEach(enhanceWithLinkToH)

    ///////////////////////////////////

    const elementsToAddTranslLinks = [
      document.getElementById("yw11"),
      document.getElementById("yw11_image_chinese"),
      document.getElementById("baidu_chinese"),
      document.getElementById("humanum_full_description"),
      document.getElementById("humanum_small_description"),
    ]

    // console.log('doing', elementsToAddTranslLinks)

    elementsToAddTranslLinks.filter(x => x).forEach(element => {
      const text = element.innerText.replace(/\n\n+/g, '\n\n').trim()
      // console.log(element, text)
      if (!text) { return }
      const encoded = encodeURIComponent(text)
      const baidu_url = `https://fanyi.baidu.com/#zh/en/` + encoded
      const deepl_url = `https://www.deepl.com/translator#zh/ru/` + encoded

      const link = (text, url) => `<a href="${url}" target="_blank">${text}</a>`
      const linksElement = document.createElement('div')
      linksElement.innerHTML = `${link('baidu', baidu_url)}, ${link('deepl', deepl_url)}`

      element.appendChild(linksElement)
    })

    ///////////////////////////////////

    // function closeModal() {
    //   const parentElem = document.getElementById(containerId)
    //   parentElem.innerHTML = ""
    // }

    // function closeModalAndEvent(event) {
    //   event.preventDefault()
    //   closeModal()
    // }

    // document.getElementById('modal__close-btn').addEventListener('click', closeModalAndEvent)
    // document.getElementById('modal__overlay').addEventListener('click', closeModalAndEvent)

    // parentElem.scrollIntoView({
    //   behavior: 'smooth', // smooth scroll
    //   block: 'start' // the upper border of the element will be aligned at the top of the visible part of the window of the scrollable area.
    // })
  }

  const kanjiProcessed = window.kanjicache || []

  window.kanjicache = {
    push: function(kanjiData) {
      kanjiProcessed.push(kanjiData)
      displayKanji(kanjiData)
    }
  }

  window.showKanjiIframe = function(kanji) {
    if (window.location.pathname !== "/h.html") {
      window.open(`h.html#${kanji}`, '_blank').focus()
      // window.copyToClipboard(kanji)
      return
    }

    const alreadyAddedKanjiData = kanjiProcessed[kanji]
    if (alreadyAddedKanjiData) {
      displayKanji(alreadyAddedKanjiData)
      return
    }
    const script = document.createElement('script')
    script.setAttribute('src', 'anki-addon-glossary/' + kanji + '.js')
    document.body.appendChild(script)
  }
})();

;(function() {
  if (window.location.pathname !== "/h.html") {
    function enhanceWithLinkToH(containerElement) {
      // onmouseover="window.copyToClipboard('${ch} ')"
      const colorizer = (ch, colorIndex) => `<span onclick="window.showKanjiIframe('${ch}')">${ch}</span>`
      const ruby_chars = [...containerElement.innerHTML]
      containerElement.innerHTML = ruby_chars.map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')
    }

    Array.from(document.querySelectorAll('.my-pinyin-hanzi')).forEach(enhanceWithLinkToH)
  }
})();

;(async function() {
  if (window.location.pathname === "/h.html" && window.location.hash) {
    let kanjiEncoded = window.location.hash.slice(1)
    window.showKanjiIframe(kanjiEncoded)

    try {
      const hanzi = decodeURIComponent(kanjiEncoded)
      if (!hanzi) { return }

      // play audio
      ;(async function() {
        try {
          await waitForElementToAppear(() => document.getElementById('hanziyuan'))

          const firstAudio = Array.from(document.querySelectorAll('.my-pinyin-tone a')).map(x => x.href).filter(x => x.endsWith('.mp3'))[0]

          if (!firstAudio) { return }

          const audioEl = document.createElement('audio');
          audioEl.style.cssText = 'display: none;';
          audioEl.src = firstAudio
          audioEl.load()
          audioEl.autoplay = true;

          document.body.addEventListener('click', () => {
            audioEl.play().catch(e => {
              console.log(e)
              // document.body.innerHTML = e.toString()
            })
          }, { once: true });

          // await audioEl.play()
          document.body.appendChild(audioEl)
        } catch (e) {
          document.body.innerHTML = e.toString()
        }
      })();
      //////

      const respose = await fetch(`/hanzi-info?hanzi=${kanjiEncoded}`)
      let oldText = await respose.text()
      oldText = oldText.trim()

      // function resizeIt( id, maxHeight, minHeight ) {
      //   var str = textareaElement.value;
      //   var cols = textareaElement.cols;
      //   var linecount = 0;
      //   var arStr = str.split("\n");
      //   arStr.forEach(function(s) {
      //     linecount = linecount + 1 + Math.floor(arStr[s].length / cols); // take into account long lines
      //   });
      //   linecount++;
      //   linecount = Math.max(minHeight, linecount);
      //   linecount = Math.min(maxHeight, linecount);
      //   textareaElement.rows = linecount;
      // };

      const textareaElement = document.createElement('textarea');
      textareaElement.style.cssText = 'width:100%;resize: none;overflow: hidden;background:rgb(192,192,192); text-align: start; color: black;';
      textareaElement.value = oldText
      window.document.body.insertBefore(textareaElement, window.document.body.firstChild);
      autosize(textareaElement)

      const submitButton = document.createElement('button')
      submitButton.innerHTML = 'Submit'
      submitButton.style.cssText = 'width:30%;';
      textareaElement.after(submitButton)

      const alertDiv = document.createElement('pre')
      alertDiv.style.cssText = 'width:100%; text-align: start;';
      alertDiv.textContent = oldText === '' ? 'Nothing found' : ''
      textareaElement.before(alertDiv)

      ;(async function() {
        const element = await waitForElementToAppear(() => document.getElementById('hanziyuan'))
        const hanziyuan = element.innerHTML

        // ... -> Array String
        function matchAllFirstMatch(input, regex) {
          return Array.from(input.matchAll(regex)).map(x => x[1])
        }

        let older = [
          matchAllFirstMatch(hanziyuan, /Traditional in your browser[^:]+:<\/b><span class="text-lg">(.+?)<\/span>/g),
          matchAllFirstMatch(hanziyuan, /Older traditional characters[^:]+:<\/b><span class="text-lg">(.+?)<\/span>/g),
          matchAllFirstMatch(hanziyuan, /Variant rule[^:]+:(.+?)<\/p>/g),
        ].flat().join('')

        const possibleHanzi = unique([hanzi, ...older].filter(isHanzi))

        if (!textareaElement.value) { textareaElement.value = possibleHanzi.map(x => x + ' ').join('\n') + '\n\n'; autosize() }

        // console.log(older)
        // older = await fetch(`/trainchinese =${encodeURIComponent(str)}&tcLanguage=ru`, { "mode": "cors" })))
        // console.log(older)
      })();

      const submitFn = (function () {
        let textareaSubmitMutex = false
        return function() {
          console.log({ textareaSubmitMutex })
          if (textareaSubmitMutex) { return }

          const newText = textareaElement.value.trim()

          if (oldText === newText) {
            alertDiv.textContent = 'Nothing to do'
            return
          }

          ;(async function() {
            textareaSubmitMutex = true

            alertDiv.textContent = 'Loading...'

            try {
              const response = await fetch(`/hanzi-info`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oldText, newText })
              })

              if (response.status >= 500) {
                const error = await response.text()
                alertDiv.textContent = error
                alertDiv.style.color = 'red'
                return
              }

              const responseJson = await response.json()

              if (responseJson.error) {
                alertDiv.textContent = responseJson.error
                alertDiv.style.color = 'red'
                return
              }

              alertDiv.textContent = responseJson.message
              alertDiv.style.color = 'white'
              oldText = newText
            } catch(error) {
              console.error(error)
            } finally {
              textareaSubmitMutex = false
            }
          })();
        }
      })();

      submitButton.addEventListener('click', function(event) {
        event.preventDefault()
        submitFn()
      }, false)

      function debounce(func, wait, immediate){
        var timeout, args, context, timestamp, result;
        if (null == wait) wait = 100;

        function later() {
          var last = Date.now() - timestamp;

          if (last < wait && last >= 0) {
            timeout = setTimeout(later, wait - last);
          } else {
            timeout = null;
            if (!immediate) {
              result = func.apply(context, args);
              context = args = null;
            }
          }
        };

        var debounced = function(){
          context = this;
          args = arguments;
          timestamp = Date.now();
          var callNow = immediate && !timeout;
          if (!timeout) timeout = setTimeout(later, wait);
          if (callNow) {
            result = func.apply(context, args);
            context = args = null;
          }

          return result;
        };

        debounced.clear = function() {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
        };

        debounced.flush = function() {
          if (timeout) {
            result = func.apply(context, args);
            context = args = null;

            clearTimeout(timeout);
            timeout = null;
          }
        };

        return debounced;
      };

      const debouncedSubmit = debounce(submitFn, 500)

      textareaElement.addEventListener('keydown', function (event) {
        // if (event.keyCode == 13 && event.ctrlKey) {
        //   event.preventDefault()
        //   submitFn()
        //   return
        // }
        debouncedSubmit()
      })

      window.addEventListener("beforeunload", function (event) {
        const newText = textareaElement.value.trim()

        if (oldText === newText) {
          event.preventDefault();
          const confirmationMessage = "\o/";
          return confirmationMessage;
        }
      })


      // document.body.appendChild(textareaElement); // appends last of that element
    } catch (e) {
      console.error(e)
    }
  }
})();

////////////

;(function() {
function hideByDefaultAndShowOnClick(elements, classToAddToShow) {
  Array.from(document.getElementsByClassName(elements)).forEach((element) => {
    element.classList.add(classToAddToShow);

    // function eventListener(event) {
    //   event.preventDefault();
    //   element.classList.add(classToAddToShow);
    //   // element.removeEventListener('click', eventListener);
    // }
    // element.addEventListener('click', eventListener);
  });
}
hideByDefaultAndShowOnClick("my-pinyin-translation-container", "my-pinyin-translation-container--force-show")
hideByDefaultAndShowOnClick("my-pinyin-hanzi", "my-pinyin-hanzi--force-show")
})();

;(function() {
  function show(parentElement, elementsToFindClass, classToAddToShow) {
    Array.from(parentElement.getElementsByClassName(elementsToFindClass)).forEach((element) => {
      element.classList.add(classToAddToShow)
    })
  }
  function eventListener(event) {
    event.preventDefault();
    const parentElement = event.target.parentElement
    show(parentElement, "my-pinyin-translation-container", "my-pinyin-translation-container--force-show")
    show(parentElement, "my-pinyin-hanzi", "my-pinyin-hanzi--force-show")
  }
  Array.from(document.querySelectorAll("h1")).forEach((clickTarget) => {
    show(parentElement, "my-pinyin-translation-container", "my-pinyin-translation-container--force-show")
    show(parentElement, "my-pinyin-hanzi", "my-pinyin-hanzi--force-show")

    // clickTarget.addEventListener('click', eventListener)
  })
})();

;(function() {
  const table = document.querySelector('table')
  if (table && document.body.offsetWidth < table.offsetWidth) {
    document.body.style.width = `${table.offsetWidth}px`
  }
})();
