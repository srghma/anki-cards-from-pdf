input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Hua Ma.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

output_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Hua ma</title>
  <base target="_blank" href="https://resources.allsetlearning.com">
  <style>
  .trainchinese-pinyin { color: #ff0000 }
  .trainchinese-type { color: #ff9e9e }
  .trainchinese-transl { color: #ffebeb }
  #ruby .singlebk {
      display: inline-block;
      height: auto;
      text-align: center;
      padding: 0 9px;
      margin: 0;
      border: 0;
      line-height: 1;
  }
  #ruby .tone1 {color: #9d9dff}
  #ruby .tone2 {color: #b1ffb1}
  #ruby .tone3 {color: #fed3ff}
  #ruby .tone4 {color: #ff8989}
  #ruby .tone5 {color: #cecece}
  #ruby .pinyin { display: flex; flex-direction: column; }
  #ruby .pyd { display: flex; flex-direction: row; text-align: center; justify-content: center; font: bold large serif; font-size: 16px; }
  #ruby .pinyin-marked { font-size: 25px; }
  #ruby .pinyin-numbered { display: none; }
  #ruby .pinyin-bopomofo { display: none; }
  #ruby .pinyin-vowel { display: none; }
  #ruby .pinyin-consonant { display: none; }
  #ruby .tooltips-ipa { font-size: 20px; }
  @font-face {
    font-family: 'CNstrokeorder';
    src: url('file:///home/srghma/projects/anki-cards-from-pdf/CNstrokeorder.ttf');
  }
  @font-face {
    font-family: 'KanjiStrokeOrders';
    src: url('file:///home/srghma/projects/anki-cards-from-pdf/KanjiStrokeOrders.ttf');
  }
  .tooltips { font-size: 100px; font-family: "KanjiStrokeOrders", "CNstrokeorder"; }
  .strokeorderkanjiorhanzi {
    font-family: "KanjiStrokeOrders", "CNstrokeorder";
    line-height: 1;
  }
  body {
    text-align: center;
    font-family: sans-serif;
    font-size: 16px; /* line height is based on this size in Anki for some reason, so start with the smallest size used */
  }
  .tiny {font-size: 24px;}
  .small {font-size: 28px;}
  .medium {font-size: 32px;}
  .large {font-size: 96px;}
  .verylarge {font-size: 140px;}
  .italic {font-style: italic;}
  .win .japanese {font-family: "Meiryo", "MS Mincho";}
  .mac .japanese {font-family: "Hiragino Mincho Pro";}
  .linux .japanese {font-family: "Kochi Mincho";}
  .mobile .japanese {font-family: "Motoya L Cedar", "Motoya L Maru", "DroidSansJapanese", "Hiragino Mincho ProN";}
  .hiragana {
    font-family: "Hiragino Kaku Gothic Pro W3";
   font-size: 25 px;
  }
  .text {
    font-family: "Ubuntu Light", "HelveticaNeueLT Std Lt";
   font-style: "italics";
  }
  .kanji {
    font-family: "Hiragino Kaku Gothic Pro W3";
    font-size:180px;
    color: white;
    background-color:#e20096;
  }
  .rustl:first-of-type { color: lightgreen; } /* перенос */
  .notes { font-size:100%; text-align:justify; }
  .tags { font-size:100%; text-align:center; }
  .small { font-size:100%; }
  </style>
 </head>
 <body id="ruby">
  ${input.map(x => x._4).join('\n<br><br>\n')}
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/huama.html', output_)
