#!/usr/bin/env node
'use strict';

var express = require('express')
var path = require('path')
var serveStatic = require('serve-static')

var app = express()

app.use(serveStatic(path.join(__dirname)))
app.use(serveStatic(path.join(__dirname, '..', 'fonts')))
app.use(serveStatic('/home/srghma/.local/share/Anki2/User 1/collection.media'))
app.listen(34567)

// html_ = `
// <!DOCTYPE HTML>
// <html>
//  <head>
//   <meta charset="utf-8">
//   <title>${epub.metadata.title}</title>
//   <meta name="referrer" content="no-referrer">
//   ${css.map(x => `<link rel="stylesheet" href="${x}">`).join('\n')}
//   <link rel="stylesheet" href="style.css">
//   <script src="https://cdn.jsdelivr.net/npm/canvas-drawing-board@latest/dist/canvas-drawing-board.js"></script>
//   <script defer src="bundle.js"></script>
//  </head>
//  <body>
//   <div id="container">
//     <div id="body">
//       <div>${toc}</div>
//       ${htmlContent}
//     </div>
//     <footer>
//       <div id="app" style="position: relative; width: 100%; height: 600px"></div>
//       <div id="currentSentence"></div>
//       <div id="currentSentenceTraditional"></div>
//       <div class="controllers">
//         <audio controls id="tts-audio" />
//         <div class="buttons">
//           <button id="pleco">Pleco</button>
//         </div>
//       </div>
//     </footer>
//   </div>
//  </body>
// </html>
// `
