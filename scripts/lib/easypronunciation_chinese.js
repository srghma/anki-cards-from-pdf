const nodeFetch = require('node-fetch')
const tough = require('tough-cookie')

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

// ... -> Array String
async function easypronunciation_chinese(dom, str) {
  const easypronunciation_chinese_cookie_jar = new tough.CookieJar()
  const fetch = require('fetch-cookie')(nodeFetch, easypronunciation_chinese_cookie_jar)

  await fetch("https://easypronunciation.com/en/chinese-pinyin-phonetic-transcription-converter", { "headers": { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "accept-language": "en-US,en;q=0.9", "cache-control": "no-cache", "pragma": "no-cache", "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"", "sec-ch-ua-mobile": "?0", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "none", "sec-fetch-user": "?1", "upgrade-insecure-requests": "1" }, "referrerPolicy": "strict-origin-when-cross-origin", "body": null, "method": "GET", "mode": "cors" });

  console.log(easypronunciation_chinese_cookie_jar)

  postResp = await fetch("https://easypronunciation.com/en/chinese-pinyin-phonetic-transcription-converter", { "headers": { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5", "cache-control": "no-cache", "content-type": "application/x-www-form-urlencoded", "pragma": "no-cache", "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"", "sec-ch-ua-mobile": "?0", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "same-origin", "sec-fetch-user": "?1", "upgrade-insecure-requests": "1" }, "referrer": "https://easypronunciation.com/en/chinese-pinyin-phonetic-transcription-converter", "referrerPolicy": "strict-origin-when-cross-origin", "body": `initial_text=${encodeURIComponent(str)}&submit=&Convert_to_chinese=IPA_tone_marks&translation_language=ar&tts_chinese=amazon_Zhiyu&speech_rate=1&frequency_rating_chinese=no&Display_chinese=above_each_word&line_break=p_tag&tone_corrections=on&spell_chinese_numbers=none&spell_latin_letters=on&click_the_word_audio_video=on&click_the_word_tts=on&MM_update2=form2`, "method": "POST", "mode": "cors" })

  console.log({ postResp: postResp.headers, easypronunciation_chinese_cookie_jar })

  getResp = await fetch("https://easypronunciation.com/en/chinese-pinyin-phonetic-transcription-converter", { "headers": { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5", "cache-control": "no-cache", "pragma": "no-cache", "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"", "sec-ch-ua-mobile": "?0", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "same-origin", "sec-fetch-user": "?1", "upgrade-insecure-requests": "1" }, "referrer": "https://easypronunciation.com/en/chinese-pinyin-phonetic-transcription-converter", "referrerPolicy": "strict-origin-when-cross-origin", "body": null, "method": "GET", "mode": "cors" });

  console.log({ getResp: getResp.headers, easypronunciation_chinese_cookie_jar })

  // '<div class="big-hanzi">\n' +
  // '<p><span class="tooltips-bottom"><ruby><a href="chinese-dictionary-lookup.php?word=%E5%AF%B9%E4%B8%8D%E8%B5%B7&site_language=english&converter_language=chinese&encoding=word_simplified&transcription=pinyin&word_transcription=t%CA%B7%C9%99%CC%80ip%CA%B7ut%C9%95%CA%B0i%CC%8C%CB%90&word_transcription_numbers=dui4%20bu5%20qi3" class="ajax_link hsk-white vocabulary-not-candidate" id="chinese_1">对不起</a><rp>(</rp><rt>tʷə̀ipʷutɕʰǐː<span class="play-video-icon"><i class="fa fa-volume-up"></i></span></rt><rp>)</rp></ruby><span id="tip-for-the-first-word" style="font-size: 60%; margin-top: 10px;"><i class="fa fa-arrow-up"></i> Click the word to see more options!</span></span> </p>\n' +

  getRespText = await getResp.text()

  dom.window.document.body.innerHTML = getRespText

  // alert "You have reached your limit! Please wait for one hour! If you bought the subscription, but still see this message, please check our FAQ"

  let nobrMultipleElems = dom.window.document.querySelectorAll('div.big-hanzi span.tooltips-bottom ruby .chineseHomographsList nobr')
  const output = []

  if (nobrMultipleElems.length > 0) {
    nobrMultipleElems.forEach(e => { output.push(e.textContent.trim()) })
  } else {
    const elem = dom.window.document.querySelector('div.big-hanzi span.tooltips-bottom ruby rt')
    if (elem) { output.push(elem.textContent.trim()) }
  }

  return output
}

exports.easypronunciation_chinese = easypronunciation_chinese
