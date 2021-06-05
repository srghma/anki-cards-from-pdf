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
