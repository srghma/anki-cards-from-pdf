const containerId = 'kanjiIframeContainer'

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
        console.log(el)
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
      console.log(element, text)
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
