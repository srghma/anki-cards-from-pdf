'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sd2json = sd2json;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _lodash = _interopRequireDefault(require("lodash"));

var path = require('path');

var fse = require('fs-extra');

var log = console.log;

var util = require('util');

var pako = require('pako');

var decoder = new util.TextDecoder('utf-8');

var sanitizeHtml = require('sanitize-html');

function sd2json(_x) {
  return _sd2json.apply(this, arguments);
} // rdoc - {dict, trns}


function _sd2json() {
  _sd2json = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(dictpath) {
    var fns, descr, indexData, unzipped, phrases, docs;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return checkDir(dictpath);

          case 3:
            fns = _context.sent;
            _context.next = 6;
            return parseDescr(fns);

          case 6:
            descr = _context.sent;
            _context.next = 9;
            return parseIndex(fns);

          case 9:
            indexData = _context.sent;
            _context.next = 12;
            return parseDict(fns);

          case 12:
            unzipped = _context.sent;
            phrases = genDocs(indexData, unzipped);
            docs = uniqDocs(phrases);
            descr.size = docs.length;
            return _context.abrupt("return", {
              descr: descr,
              docs: docs
            });

          case 19:
            _context.prev = 19;
            _context.t0 = _context["catch"](0);
            console.log('STARDICT ERR:', _context.t0);

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 19]]);
  }));
  return _sd2json.apply(this, arguments);
}

function uniqDocs(rdocs) {
  var hdocs = Object.create(null);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = rdocs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var rdoc = _step.value;
      var dict = rdoc.dict.replace(/^_/, ''); // Couch/Pouch restriction

      var hdoc = {
        _id: dict,
        trns: rdoc.trns
      };
      if (!hdocs[dict]) hdocs[dict] = hdoc;else if (hdocs[dict] && !hdocs[dict].trns) hdocs[dict].trns = [rdoc.trns];else hdocs[dict].trns.push(rdoc.trns);

      if (dict.split(' ').length > 1) {
        var phrasedocs = parsePhrase(dict);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = phrasedocs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var phdoc = _step2.value;
            if (!hdocs[phdoc._id]) hdocs[phdoc._id] = phdoc;else if (hdocs[phdoc._id] && !hdocs[phdoc._id].refs) hdocs[phdoc._id].refs = [dict];else hdocs[phdoc._id].refs.push(dict);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }

      if (hdocs[dict].refs) hdocs[dict].refs = _lodash["default"].uniq(hdocs[dict].refs);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var docs = Object.values(hdocs);
  return docs;
} // == здесь doc = {_id, docs}, docs=> {doc, trns}


function uniqDocs_old(rdocs) {
  var hdocs = Object.create(null);
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = rdocs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var rdoc = _step3.value;
      var dict = rdoc.dict.replace(/^_/, ''); // Couch/Pouch restriction

      var doc = {
        trns: rdoc.trns
      };
      var hdoc = {
        _id: dict,
        docs: [doc]
      };
      if (!hdocs[dict]) hdocs[dict] = hdoc;else if (hdocs[dict] && !hdocs[dict].docs) hdocs[dict].docs = [doc];else hdocs[dict].docs.push(doc);

      if (dict.split(' ').length > 1) {
        var phrasedocs = parsePhrase(dict);
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = phrasedocs[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var phdoc = _step4.value;
            if (!hdocs[phdoc._id]) hdocs[phdoc._id] = phdoc;else if (hdocs[phdoc._id] && !hdocs[phdoc._id].refs) hdocs[phdoc._id].refs = [dict];else hdocs[phdoc._id].refs.push(dict);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
              _iterator4["return"]();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }

      if (hdocs[dict].refs && hdocs[dict].refs.length) hdocs[dict].refs = _lodash["default"].uniq(hdocs[dict].refs);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
        _iterator3["return"]();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var docs = Object.values(hdocs);
  return docs;
}

function parsePhrase(dict) {
  var phdocs = [];
  var wfs = dict.split(/(?:[ -#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDFFF]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F])+/g).filter(Boolean);
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = wfs[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var wf = _step5.value;
      if (wf.length < 3) continue;
      var phdoc = {
        _id: wf,
        refs: [dict]
      };
      phdocs.push(phdoc);
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
        _iterator5["return"]();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  return phdocs;
} // todo: EOL


function genDocs(indexData, unzipped) {
  var re = /[;\n]/;
  var docs = [];
  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = indexData[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var arr = _step6.value;
      var offset = arr[1],
          size = arr[2];
      var unchunk = unzipped.slice(offset, offset + size);
      var decoded = decoder.decode(unchunk); // decoded = decoded.split('\n').slice(1).join('; ').trim()

      var clean = decoded
      // //////////////////////////////////////////////
      // THIS IS WHAT I CHANGED
      // //////////////////////////////////////////////
      // console.log(clean)

      // var clean = sanitizeHtml(decoded, {
      //   allowedTags: ['b', 'em', 'strong', 'a', 'abr', 'i', 'font'],
      //   // , 'dtrn'
      //   allowedAttributes: {
      //     'a': ['href']
      //   }
      // });

      var trns = _lodash["default"].compact(_lodash["default"].flatten(clean.split(re).map(function (trn) {
        return trn.trim();
      })));

      // trns = trns.map(function (trn) {
      //   return trn.replace(/\[[^)]*\]/g, '');
      // });

      // var trns = decoded
      // //////////////////////////////////////////////
      // THIS IS WHAT I CHANGED (END)
      // //////////////////////////////////////////////

      if (trns.length) {
        var dict = arr[0];
        if (/^\d/.test(dict)) continue;
        var doc = {
          dict: dict,
          trns: trns
        };
        docs.push(doc);
      }
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
        _iterator6["return"]();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }

  return docs;
}

function parseDict(fns) {
  var dictpath = path.resolve(fns.dirpath, fns.dict);
  return fse.readFile(dictpath).then(function (gzbuf) {
    var rawdata = new Uint8Array(gzbuf);
    var unzipped = pako.inflate(rawdata);
    return unzipped;
  });
}

function checkDir(dictpath) {
  var dirpath = path.dirname(dictpath);
  var filename = path.basename(dictpath);
  filename = path.parse(filename).name;
  var refn = new RegExp(filename);
  fse.readdir(dirpath)
  return fse.readdir(dirpath).then(function (fns) {
    var fn = {
      dirpath: dirpath
    };

    var ifoname = _lodash["default"].find(fns, function (fn) {
      return refn.test(fn) && /ifo/.test(fn);
    });

    if (!ifoname) throw new Error('Not a stardict archive - no .ifo');
    fn.ifo = ifoname;

    var idxname = _lodash["default"].find(fns, function (fn) {
      return refn.test(fn) && /idx/i.test(fn);
    });

    if (!idxname) throw new Error('Not a stardict archive - no .idx');
    fn.idx = idxname;

    var dictname = _lodash["default"].find(fns, function (fn) {
      return refn.test(fn) && /\.dz/i.test(fn);
    });

    if (!dictname) throw new Error('Not a stardict archive - no .dz');
    fn.dict = dictname;
    return fn;
  });
}

function parseDescr(fn) {
  var ifopath = path.resolve(fn.dirpath, fn.ifo);
  return fse.readFile(ifopath).then(function (ifobuf) {
    var ifo = ifobuf.toString().split('\n').slice(0, 7);

    var namestr = _lodash["default"].find(ifo, function (str) {
      return /bookname/.test(str);
    });

    var name = namestr.replace('bookname=', '');

    var totalstr = _lodash["default"].find(ifo, function (str) {
      return /wordcount/.test(str);
    });

    var total = totalstr.replace('wordcount=', '') * 1 || 10000;
    var descr = {
      type: 'sd',
      name: name,
      size: total,
      descr: ifo
    };
    return descr;
  });
} // todo .gz - наружу


function parseIndex(fn) {
  var idxpath = path.resolve(fn.dirpath, fn.idx);
  return fse.readFile(idxpath).then(function (buf) {
    if (/gz/.test(idxpath)) {
      // console.time('BUFFER-UNGZIP')
      var rawdata = new Uint8Array(buf);
      var uint8Array = pako.inflate(rawdata);
      buf = Buffer.from(uint8Array); // console.timeEnd('BUFFER-UNGZIP')
    }

    var indexData = [];
    var i = 0;
    var index = 0;

    while (i < buf.length) {
      var beg = i;
      i = buf.indexOf('\x00', beg);
      var word = buf.toString('utf-8', beg, i);
      i++;
      var offset = buf.readUInt32BE(i);
      i += 4;
      var size = buf.readUInt32BE(i);
      i += 4;
      indexData.push([word, offset, size]);
      index++;
    }

    return indexData;
  })["catch"](function (err) {
    log('__ IDX ERR:', err);
  });
}
