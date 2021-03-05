const fetch = require('node-fetch')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const easypronunciation_chinese = require('./scripts/lib/easypronunciation_chinese').easypronunciation_chinese
const processPurpleculture = require('./scripts/lib/processPurpleculture').processPurpleculture

links = [
  "https://resources.allsetlearning.com/chinese/grammar/A1_grammar_points",
  "https://resources.allsetlearning.com/chinese/grammar/A2_grammar_points",
  "https://resources.allsetlearning.com/chinese/grammar/B1_grammar_points",
  "https://resources.allsetlearning.com/chinese/grammar/B2_grammar_points",
  "https://resources.allsetlearning.com/chinese/grammar/C1_grammar_points",
]

output = links.map(async (link) => {
  request = await fetch(link, { "headers": { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5", "cache-control": "no-cache", "pragma": "no-cache", "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"", "sec-ch-ua-mobile": "?0", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "same-origin", "sec-fetch-user": "?1", "upgrade-insecure-requests": "1", "cookie": "gramwiki_session=21mn10is35p8m048eg8t2s4o9oe3i49u" }, "referrerPolicy": "strict-origin-when-cross-origin", "body": null, "method": "GET", "mode": "cors" });

  body = await request.text()

  return body
})

output = await Promise.all(output)

output = output.map(body => {
  dom.window.document.body.innerHTML = body

  dom.window.document.querySelector('#mw-content-text #toc').remove()

  return {
    header: dom.window.document.querySelector('h1').textContent.trim(),
    body: dom.window.document.querySelector('#mw-content-text').innerHTML,
  }
})

function mapWithForEachToArray(xs, fn) {
  const output = []
  xs.forEach(x => output.push(fn(x)))
  return output
}

output.map(({ header, body }) => {
  dom.window.document.body.innerHTML = body

  return mapWithForEachToArray(
    dom.window.document.querySelectorAll('.wikitable'),
    tableEl => {
      const subtitle = tableEl.previousSibling.previousSibling.textContent.trim()

      return mapWithForEachToArray(
        tableEl.querySelectorAll('tr'),
        trEl => {
          const tdEls = trEl.querySelectorAll('td')
          if (tdEls.length < 3) { return }
          return {
            linkHref:  tdEls[0].querySelector('a').href,
            linkEn:    tdEls[0].textContent.trim(),
            structure: tdEls[1].textContent.trim(),
            example:   tdEls[2].textContent.trim(),
            header,
            subtitle,
          }
        }
      ).filter(R.identity)
    }
  )
}).flat().flat()

output_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Allsetlearning</title>
  <base target="_blank" href="https://resources.allsetlearning.com">

  <style>
.liju em {
  background-color: #FFFFAA;
  font-style: normal;
}

.table {
   margin: 1.5em 0;
}

table.wikitable { /* Modifying the Vector skin's original .wikitable class to better suit the Chinese Grammar Wiki's needs */
  text-align: center;
  margin: 20px 30px !important;
}

table.wikitable caption {
  font-weight: normal;
  font-size: 120%;
  text-align: left;
  padding-bottom: 6px;
}

table.wikitable td {
  padding: 0.6em;
}

table.wikitable tr th {
  font-size: 100%;
}

table th {
   font-weight: bold;
}

table td.cell-large, table td.cell-large {
   font-size: 120%;
}

.wikitable {
    background-color: #f8f9fa;
    color: #222;
    margin: 1em 0;
    border: 1px solid #a2a9b1;
    border-collapse: collapse
}

.wikitable > tr > th,.wikitable > tr > td,.wikitable > * > tr > th,.wikitable > * > tr > td {
    border: 1px solid #a2a9b1;
    padding: 0.2em 0.4em
}

.wikitable > tr > th,.wikitable > * > tr > th {
    background-color: #eaecf0;
    text-align: center
}

.wikitable > caption {
    font-weight: bold
}

  body.hide-examples .wikitable tr > td:nth-child(3) {
    display: none;
  }

  #hide-examples-button {
    position: sticky;
    top: 10px;
    left: 10px;
  }
  </style>

  <script>
    function toggleClass(element, myclass) {
      if (element.classList) {
        element.classList.toggle(myclass);
      } else {
        // For IE9
        var classes = element.className.split(" ");
        var i = classes.indexOf(myclass);

        if (i >= 0)
          classes.splice(i, 1);
        else
          classes.push(myclass);
          element.className = classes.join(" ");
      }
    }

    window.hideExamples = function() {
      toggleClass(document.querySelector('body'), "hide-examples")
    }
  </script>
 </head>
 <body>
  <button id="hide-examples-button" onclick="hideExamples()">HIDE<br>EXAMPLES</button>
  ${output.map(x => `<h1>${x.header}</h1>\n${x.body}`).join('\n')}
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/all-set-learning-points.html', output_)
