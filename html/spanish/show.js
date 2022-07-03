function removeSpans() {
  event.preventDefault()
  document.querySelector('.conjugations').innerHTML = document.querySelector('.conjugations').innerHTML.replace(/<span[^>]+>([^<]+)<\/span>/g, '$1')
}

function translateEtimologias(event) {
  event.preventDefault()
  const text = document.querySelector('.etimologias').textContent
  window.open(`https://translate.google.com/?hl=ru&sl=es&tl=ru&text=${encodeURIComponent(text)}&op=translate`)
}

function openEtimologias(event) {
  event.preventDefault()
  const text = document.querySelector('.es').textContent
  window.open(`https://cse.google.com/cse?cx=partner-pub-5576230436650581%3A5670846563&ie=ISO-8859-1&q=${encodeURIComponent(text)}&sa=Buscar&siteurl=etimologias.dechile.net`)
}

;(async function(){
  // var info = JSON.parse(document.getElementById('info').textContent)

  const word = decodeURIComponent(window.location.hash.slice(1))
  document.title = word

  bucketIds = {
    w1: 'bergantin',
    w2: 'cortaforrajes',
    w3: 'escuatina',
    w4: 'jaretera',
    w5: 'patraquear',
    w6: 'sedente'
  }

  const is1     = x => x <= bucketIds.w1
  const is2     = x => x > bucketIds.w1 && x <= bucketIds.w2
  const is3     = x => x > bucketIds.w2 && x <= bucketIds.w3
  const is4     = x => x > bucketIds.w3 && x <= bucketIds.w4
  const is5     = x => x > bucketIds.w4 && x <= bucketIds.w5
  const is6     = x => x > bucketIds.w5 && x <= bucketIds.w6
  const isOther = x => x > bucketIds.w6

  const infoId = [
    is1(word)     ? '1' : null,
    is2(word)     ? '2' : null,
    is3(word)     ? '3' : null,
    is4(word)     ? '4' : null,
    is5(word)     ? '5' : null,
    is6(word)     ? '6' : null,
    isOther(word) ? 'other' : null,
  ].filter(x => x)[0]

  const info = await fetch(`./info-${infoId}.json`).then(x => x.json())

  const data = info[word]
  console.log(data)

  document.querySelector('.es').textContent = word
  document.querySelector('.googleRu').textContent = data.googleRu
  document.querySelector('.ru').innerHTML = data.ru || ""
  document.querySelector('.conjugations').innerHTML = data.conjugations || ""
  document.querySelector('.etimologias').innerHTML = data.etimologyEs || ""
  document.querySelector('.etimologias-ru').innerHTML = data.etimologyRu.split('\n').join('<br>') || ""
})();
