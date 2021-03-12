const RA = require('ramda-adjunct')

function removeHTML(dom, text) {
  if (!RA.isNonEmptyString(text)) { throw new Error('empty text') }
  dom.window.document.body.innerHTML = text
  return dom.window.document.body.textContent.trim()
}

exports.removeHTML = removeHTML
