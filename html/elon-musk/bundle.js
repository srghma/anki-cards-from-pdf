(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const googleTTS = require('google-tts-api')
const TongWen = require('../../scripts/lib/TongWen').TongWen

function isHanzi(ch) {
  const REGEX_JAPANESE = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
  const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

  const isSpecialChar = "。？！".includes(ch)
  const isJapanese = REGEX_JAPANESE.test(ch)
  const isChinese = REGEX_CHINESE.test(ch)
  const isHanzi = !isSpecialChar && (isJapanese || isChinese)

  return isHanzi
}

const getCurrentSentenceTextContent = () => document.getElementById('currentSentence').textContent

const playTTS = (url) => {
   // audioEl.play();
};

const setAudio = text => {
  const url = googleTTS.getAudioUrl(text, {
    lang: 'zh',
    slow: true,
  });

  const audioEl = document.getElementById('tts-audio')
  if (audioEl.src !== url) {
    audioEl.src = url
    audioEl.load()
  }
  audioEl.play()
}


////////////

document.addEventListener("DOMContentLoaded", function(){
  const board = new Board({id: "app", background: '#000'})
  board.setSize(2)
  board.setColor('#fff')

  document.getElementById("body").addEventListener('click', function(event) {
    event.preventDefault()

    const element = event.target

    if (element.tagName !== 'SENTENCE') { return }

    function addLinks(text) {
      const colorizer = (ch, colorIndex) => `<a target="_blank" href="../h.html#${ch}">${ch}</a>`
      return [...text].map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')
    }

    const text = element.textContent
    const simplified = [...text].map(x => TongWen.t_2_s[x] || x).join('')
    const traditional = [...text].map(x => TongWen.s_2_t[x] || x).join('')

    document.getElementById('currentSentence').innerHTML = addLinks(simplified)
    document.getElementById('currentSentenceTraditional').innerHTML = addLinks(traditional)

    board.clear()
    setAudio(element.textContent)
  }, false);

  document.getElementById('pleco').addEventListener('click', function(event) {
    event.preventDefault()

    window.open(`plecoapi://x-callback-url/s?q=${encodeURIComponent(getCurrentSentenceTextContent())}`, '_blank')
  }, false);

  //////////////
});

},{"../../scripts/lib/TongWen":43,"google-tts-api":35}],2:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":4}],3:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(
        timeoutErrorMessage,
        config,
        config.transitional && config.transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

},{"../core/buildFullPath":10,"../core/createError":11,"./../core/settle":15,"./../helpers/buildURL":19,"./../helpers/cookies":21,"./../helpers/isURLSameOrigin":24,"./../helpers/parseHeaders":26,"./../utils":29}],4:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"./cancel/Cancel":5,"./cancel/CancelToken":6,"./cancel/isCancel":7,"./core/Axios":8,"./core/mergeConfig":14,"./defaults":17,"./helpers/bind":18,"./helpers/isAxiosError":23,"./helpers/spread":27,"./utils":29}],5:[function(require,module,exports){
'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;

},{}],6:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":5}],7:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],8:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var validator = require('../helpers/validator');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean, '1.0.0'),
      forcedJSONParsing: validators.transitional(validators.boolean, '1.0.0'),
      clarifyTimeoutError: validators.transitional(validators.boolean, '1.0.0')
    }, false);
  }

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

},{"../helpers/buildURL":19,"../helpers/validator":28,"./../utils":29,"./InterceptorManager":9,"./dispatchRequest":12,"./mergeConfig":14}],9:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":29}],10:[function(require,module,exports){
'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

},{"../helpers/combineURLs":20,"../helpers/isAbsoluteURL":22}],11:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":13}],12:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/isCancel":7,"../defaults":17,"./../utils":29,"./transformData":16}],13:[function(require,module,exports){
'use strict';

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};

},{}],14:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  var valueFromConfig2Keys = ['url', 'method', 'data'];
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
  var defaultToConfig2Keys = [
    'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
    'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
    'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
  ];
  var directMergeKeys = ['validateStatus'];

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  }

  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    }
  });

  utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  utils.forEach(directMergeKeys, function merge(prop) {
    if (prop in config2) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys)
    .concat(directMergeKeys);

  var otherKeys = Object
    .keys(config1)
    .concat(Object.keys(config2))
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });

  utils.forEach(otherKeys, mergeDeepProperties);

  return config;
};

},{"../utils":29}],15:[function(require,module,exports){
'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

},{"./createError":11}],16:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var defaults = require('./../defaults');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });

  return data;
};

},{"./../defaults":17,"./../utils":29}],17:[function(require,module,exports){
(function (process){(function (){
'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');
var enhanceError = require('./core/enhanceError');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

var defaults = {

  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  },

  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data) || (headers && headers['Content-Type'] === 'application/json')) {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional;
    var silentJSONParsing = transitional && transitional.silentJSONParsing;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

    if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw enhanceError(e, this, 'E_JSON_PARSE');
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this)}).call(this,require('_process'))
},{"./adapters/http":3,"./adapters/xhr":3,"./core/enhanceError":13,"./helpers/normalizeHeaderName":25,"./utils":29,"_process":37}],18:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],19:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":29}],20:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],21:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":29}],22:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

},{}],23:[function(require,module,exports){
'use strict';

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return (typeof payload === 'object') && (payload.isAxiosError === true);
};

},{}],24:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":29}],25:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":29}],26:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":29}],27:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],28:[function(require,module,exports){
'use strict';

var pkg = require('./../../package.json');

var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

var deprecatedWarnings = {};
var currentVerArr = pkg.version.split('.');

/**
 * Compare package versions
 * @param {string} version
 * @param {string?} thanVersion
 * @returns {boolean}
 */
function isOlderVersion(version, thanVersion) {
  var pkgVersionArr = thanVersion ? thanVersion.split('.') : currentVerArr;
  var destVer = version.split('.');
  for (var i = 0; i < 3; i++) {
    if (pkgVersionArr[i] > destVer[i]) {
      return true;
    } else if (pkgVersionArr[i] < destVer[i]) {
      return false;
    }
  }
  return false;
}

/**
 * Transitional option validator
 * @param {function|boolean?} validator
 * @param {string?} version
 * @param {string} message
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  var isDeprecated = version && isOlderVersion(version);

  function formatMessage(opt, desc) {
    return '[Axios v' + pkg.version + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function(value, opt, opts) {
    if (validator === false) {
      throw new Error(formatMessage(opt, ' has been removed in ' + version));
    }

    if (isDeprecated && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new TypeError('option ' + opt + ' must be ' + result);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw Error('Unknown option ' + opt);
    }
  }
}

module.exports = {
  isOlderVersion: isOlderVersion,
  assertOptions: assertOptions,
  validators: validators
};

},{"./../../package.json":30}],29:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (toString.call(val) !== '[object Object]') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM
};

},{"./helpers/bind":18}],30:[function(require,module,exports){
module.exports={
  "name": "axios",
  "version": "0.21.4",
  "description": "Promise based HTTP client for the browser and node.js",
  "main": "index.js",
  "scripts": {
    "test": "grunt test",
    "start": "node ./sandbox/server.js",
    "build": "NODE_ENV=production grunt build",
    "preversion": "npm test",
    "version": "npm run build && grunt version && git add -A dist && git add CHANGELOG.md bower.json package.json",
    "postversion": "git push && git push --tags",
    "examples": "node ./examples/server.js",
    "coveralls": "cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js",
    "fix": "eslint --fix lib/**/*.js"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/axios/axios.git"
  },
  "keywords": [
    "xhr",
    "http",
    "ajax",
    "promise",
    "node"
  ],
  "author": "Matt Zabriskie",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/axios/axios/issues"
  },
  "homepage": "https://axios-http.com",
  "devDependencies": {
    "coveralls": "^3.0.0",
    "es6-promise": "^4.2.4",
    "grunt": "^1.3.0",
    "grunt-banner": "^0.6.0",
    "grunt-cli": "^1.2.0",
    "grunt-contrib-clean": "^1.1.0",
    "grunt-contrib-watch": "^1.0.0",
    "grunt-eslint": "^23.0.0",
    "grunt-karma": "^4.0.0",
    "grunt-mocha-test": "^0.13.3",
    "grunt-ts": "^6.0.0-beta.19",
    "grunt-webpack": "^4.0.2",
    "istanbul-instrumenter-loader": "^1.0.0",
    "jasmine-core": "^2.4.1",
    "karma": "^6.3.2",
    "karma-chrome-launcher": "^3.1.0",
    "karma-firefox-launcher": "^2.1.0",
    "karma-jasmine": "^1.1.1",
    "karma-jasmine-ajax": "^0.1.13",
    "karma-safari-launcher": "^1.0.0",
    "karma-sauce-launcher": "^4.3.6",
    "karma-sinon": "^1.0.5",
    "karma-sourcemap-loader": "^0.3.8",
    "karma-webpack": "^4.0.2",
    "load-grunt-tasks": "^3.5.2",
    "minimist": "^1.2.0",
    "mocha": "^8.2.1",
    "sinon": "^4.5.0",
    "terser-webpack-plugin": "^4.2.3",
    "typescript": "^4.0.5",
    "url-search-params": "^0.10.0",
    "webpack": "^4.44.2",
    "webpack-dev-server": "^3.11.0"
  },
  "browser": {
    "./lib/adapters/http.js": "./lib/adapters/xhr.js"
  },
  "jsdelivr": "dist/axios.min.js",
  "unpkg": "dist/axios.min.js",
  "typings": "./index.d.ts",
  "dependencies": {
    "follow-redirects": "^1.14.0"
  },
  "bundlesize": [
    {
      "path": "./dist/axios.min.js",
      "threshold": "5kB"
    }
  ]
}

},{}],31:[function(require,module,exports){
(function (global){(function (){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assertInputTypes = function (text, lang, slow, host) {
    if (typeof text !== 'string' || text.length === 0) {
        throw new TypeError('text should be a string');
    }
    if (typeof lang !== 'string' || lang.length === 0) {
        throw new TypeError('lang should be a string');
    }
    if (typeof slow !== 'boolean') {
        throw new TypeError('slow should be a boolean');
    }
    if (typeof host !== 'string' || host.length === 0) {
        throw new TypeError('host should be a string');
    }
};
exports.default = assertInputTypes;

},{}],33:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAudioBase64 = exports.getAudioBase64 = void 0;
var assertInputTypes_1 = __importDefault(require("./assertInputTypes"));
var axios_1 = __importDefault(require("axios"));
var splitLongText_1 = __importDefault(require("./splitLongText"));
/**
 * Get "Google TTS" audio base64 text
 *
 * @param {string}   text           length should be less than 200 characters
 * @param {object?}  option
 * @param {string?}  option.lang    default is "en"
 * @param {boolean?} option.slow    default is false
 * @param {string?}  option.host    default is "https://translate.google.com"
 * @param {number?}  option.timeout default is 10000 (ms)
 * @returns {Promise<string>} url
 */
var getAudioBase64 = function (text, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.lang, lang = _c === void 0 ? 'en' : _c, _d = _b.slow, slow = _d === void 0 ? false : _d, _e = _b.host, host = _e === void 0 ? 'https://translate.google.com' : _e, _f = _b.timeout, timeout = _f === void 0 ? 10000 : _f;
    return __awaiter(void 0, void 0, void 0, function () {
        var res, result;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    assertInputTypes_1.default(text, lang, slow, host);
                    if (typeof timeout !== 'number' || timeout <= 0) {
                        throw new TypeError('timeout should be a positive number');
                    }
                    if (text.length > 200) {
                        throw new RangeError("text length (" + text.length + ") should be less than 200 characters. Try \"getAllAudioBase64(text, [option])\" for long text.");
                    }
                    return [4 /*yield*/, axios_1.default({
                            method: 'post',
                            baseURL: host,
                            url: '/_/TranslateWebserverUi/data/batchexecute',
                            timeout: timeout,
                            data: 'f.req=' +
                                encodeURIComponent(JSON.stringify([
                                    [['jQ1olc', JSON.stringify([text, lang, slow ? true : null, 'null']), null, 'generic']],
                                ])),
                        })];
                case 1:
                    res = _g.sent();
                    try {
                        result = eval(res.data.slice(5))[0][2];
                    }
                    catch (e) {
                        throw new Error("parse response failed:\n" + res.data);
                    }
                    // Check the result. The result will be null if given the lang doesn't exist
                    if (!result) {
                        throw new Error("lang \"" + lang + "\" might not exist");
                    }
                    // 2. continue to parse audio base64 string
                    try {
                        result = eval(result)[0];
                    }
                    catch (e) {
                        throw new Error("parse response failed:\n" + res.data);
                    }
                    return [2 /*return*/, result];
            }
        });
    });
};
exports.getAudioBase64 = getAudioBase64;
/**
 * @typedef {object} Result
 * @property {string} shortText
 * @property {string} base64
 */
/**
 * Split the long text into multiple short text and generate audio base64 list
 *
 * @param {string}   text
 * @param {object?}  option
 * @param {string?}  option.lang        default is "en"
 * @param {boolean?} option.slow        default is false
 * @param {string?}  option.host        default is "https://translate.google.com"
 * @param {string?}  option.splitPunct  split punctuation
 * @param {number?}  option.timeout     default is 10000 (ms)
 * @return {Result[]} the list with short text and audio base64
 */
var getAllAudioBase64 = function (text, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.lang, lang = _c === void 0 ? 'en' : _c, _d = _b.slow, slow = _d === void 0 ? false : _d, _e = _b.host, host = _e === void 0 ? 'https://translate.google.com' : _e, _f = _b.splitPunct, splitPunct = _f === void 0 ? '' : _f, _g = _b.timeout, timeout = _g === void 0 ? 10000 : _g;
    return __awaiter(void 0, void 0, void 0, function () {
        var shortTextList, base64List, result, i, shortText, base64;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    assertInputTypes_1.default(text, lang, slow, host);
                    if (typeof splitPunct !== 'string') {
                        throw new TypeError('splitPunct should be a string');
                    }
                    if (typeof timeout !== 'number' || timeout <= 0) {
                        throw new TypeError('timeout should be a positive number');
                    }
                    shortTextList = splitLongText_1.default(text, { splitPunct: splitPunct });
                    return [4 /*yield*/, Promise.all(shortTextList.map(function (shortText) { return exports.getAudioBase64(shortText, { lang: lang, slow: slow, host: host, timeout: timeout }); }))];
                case 1:
                    base64List = _h.sent();
                    result = [];
                    for (i = 0; i < shortTextList.length; i++) {
                        shortText = shortTextList[i];
                        base64 = base64List[i];
                        result.push({ shortText: shortText, base64: base64 });
                    }
                    return [2 /*return*/, result];
            }
        });
    });
};
exports.getAllAudioBase64 = getAllAudioBase64;

},{"./assertInputTypes":32,"./splitLongText":36,"axios":2}],34:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAudioUrls = exports.getAudioUrl = void 0;
var assertInputTypes_1 = __importDefault(require("./assertInputTypes"));
var splitLongText_1 = __importDefault(require("./splitLongText"));
var url_1 = __importDefault(require("url"));
/**
 * Generate "Google TTS" audio URL
 *
 * @param {string}   text         length should be less than 200 characters
 * @param {object?}  option
 * @param {string?}  option.lang  default is "en"
 * @param {boolean?} option.slow  default is false
 * @param {string?}  option.host  default is "https://translate.google.com"
 * @return {string} url
 */
var getAudioUrl = function (text, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.lang, lang = _c === void 0 ? 'en' : _c, _d = _b.slow, slow = _d === void 0 ? false : _d, _e = _b.host, host = _e === void 0 ? 'https://translate.google.com' : _e;
    assertInputTypes_1.default(text, lang, slow, host);
    if (text.length > 200) {
        throw new RangeError("text length (" + text.length + ") should be less than 200 characters. Try \"getAllAudioUrls(text, [option])\" for long text.");
    }
    return (host +
        '/translate_tts' +
        url_1.default.format({
            query: {
                ie: 'UTF-8',
                q: text,
                tl: lang,
                total: 1,
                idx: 0,
                textlen: text.length,
                client: 'tw-ob',
                prev: 'input',
                ttsspeed: slow ? 0.24 : 1,
            },
        }));
};
exports.getAudioUrl = getAudioUrl;
/**
 * @typedef {object} Result
 * @property {string} shortText
 * @property {string} url
 */
/**
 * Split the long text into multiple short text and generate audio URL list
 *
 * @param {string}   text
 * @param {object?}  option
 * @param {string?}  option.lang        default is "en"
 * @param {boolean?} option.slow        default is false
 * @param {string?}  option.host        default is "https://translate.google.com"
 * @param {string?}  option.splitPunct  split punctuation
 * @return {Result[]} the list with short text and audio url
 */
var getAllAudioUrls = function (text, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.lang, lang = _c === void 0 ? 'en' : _c, _d = _b.slow, slow = _d === void 0 ? false : _d, _e = _b.host, host = _e === void 0 ? 'https://translate.google.com' : _e, _f = _b.splitPunct, splitPunct = _f === void 0 ? '' : _f;
    assertInputTypes_1.default(text, lang, slow, host);
    if (typeof splitPunct !== 'string') {
        throw new TypeError('splitPunct should be a string');
    }
    return splitLongText_1.default(text, { splitPunct: splitPunct }).map(function (shortText) { return ({
        shortText: shortText,
        url: exports.getAudioUrl(shortText, { lang: lang, slow: slow, host: host }),
    }); });
};
exports.getAllAudioUrls = getAllAudioUrls;

},{"./assertInputTypes":32,"./splitLongText":36,"url":41}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAudioBase64 = exports.getAudioBase64 = exports.getAllAudioUrls = exports.getAudioUrl = void 0;
var getAudioUrl_1 = require("./getAudioUrl");
Object.defineProperty(exports, "getAudioUrl", { enumerable: true, get: function () { return getAudioUrl_1.getAudioUrl; } });
Object.defineProperty(exports, "getAllAudioUrls", { enumerable: true, get: function () { return getAudioUrl_1.getAllAudioUrls; } });
var getAudioBase64_1 = require("./getAudioBase64");
Object.defineProperty(exports, "getAudioBase64", { enumerable: true, get: function () { return getAudioBase64_1.getAudioBase64; } });
Object.defineProperty(exports, "getAllAudioBase64", { enumerable: true, get: function () { return getAudioBase64_1.getAllAudioBase64; } });

},{"./getAudioBase64":33,"./getAudioUrl":34}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
var SPACE_REGEX = '\\s\\uFEFF\\xA0';
// https://remarkablemark.org/blog/2019/09/28/javascript-remove-punctuation/
var DEFAULT_PUNCTUATION_REGEX = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
/**
 * split the long text to short texts
 * Time Complexity: O(n)
 *
 * @param {string}  text
 * @param {object?} option
 * @param {number?} option.maxLength  default is 200
 * @param {string?} option.splitPunct default is ''
 * @returns {string[]} short text list
 */
var splitLongText = function (text, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.maxLength, maxLength = _c === void 0 ? 200 : _c, _d = _b.splitPunct, splitPunct = _d === void 0 ? '' : _d;
    var isSpaceOrPunct = function (s, i) {
        var regex = new RegExp('[' + SPACE_REGEX + DEFAULT_PUNCTUATION_REGEX + splitPunct + ']');
        return regex.test(s.charAt(i));
    };
    var lastIndexOfSpaceOrPunct = function (s, left, right) {
        for (var i = right; i >= left; i--) {
            if (isSpaceOrPunct(s, i))
                return i;
        }
        return -1; // not found
    };
    var result = [];
    var addResult = function (text, start, end) {
        result.push(text.slice(start, end + 1));
    };
    var start = 0;
    for (;;) {
        // check text's length
        if (text.length - start <= maxLength) {
            addResult(text, start, text.length - 1);
            break; // end of text
        }
        // check whether the word is cut in the middle.
        var end = start + maxLength - 1;
        if (isSpaceOrPunct(text, end) || isSpaceOrPunct(text, end + 1)) {
            addResult(text, start, end);
            start = end + 1;
            continue;
        }
        // find last index of space
        end = lastIndexOfSpaceOrPunct(text, start, end);
        if (end === -1) {
            var str = text.slice(start, start + maxLength);
            throw new Error('The word is too long to split into a short text:' +
                ("\n" + str + " ...") +
                '\n\nTry the option "splitPunct" to split the text by punctuation.');
        }
        // add result
        addResult(text, start, end);
        start = end + 1;
    }
    return result;
};
exports.default = splitLongText;

},{}],37:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],38:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],39:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],40:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":38,"./encode":39}],41:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":42,"punycode":31,"querystring":40}],42:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],43:[function(require,module,exports){
var TongWen = {};

TongWen.s_2_t = {
"\u3447":"\u3473",
"\u359e":"\u558e",
"\u360e":"\u361a",
"\u3918":"\u396e",
"\u39cf":"\u6386",
"\u39d0":"\u3a73",
"\u39df":"\u64d3",
"\u3b4e":"\u68e1",
"\u3ce0":"\u6fbe",
"\u4056":"\u779c",
"\u415f":"\u7a47",
"\u4337":"\u7d2c",
"\u43ac":"\u43b1",
"\u43dd":"\u819e",
"\u44d6":"\u85ed",
"\u464c":"\u4661",
"\u4723":"\u8a22",
"\u4729":"\u8b8c",
"\u478d":"\u477c",
"\u497a":"\u91fe",
"\u497d":"\u93fa",
"\u4982":"\u4947",
"\u4983":"\u942f",
"\u4985":"\u9425",
"\u4986":"\u9481",
"\u49b6":"\u499b",
"\u49b7":"\u499f",
"\u4c9f":"\u9ba3",
"\u4ca1":"\u9c0c",
"\u4ca2":"\u9c27",
"\u4ca3":"\u4c77",
"\u4d13":"\u9cfe",
"\u4d14":"\u9d41",
"\u4d15":"\u9d37",
"\u4d16":"\u9d84",
"\u4d17":"\u9daa",
"\u4d18":"\u9dc9",
"\u4d19":"\u9e0a",
"\u4dae":"\u9f91",
"\u4e07":"\u842c",
"\u4e0e":"\u8207",
"\u4e13":"\u5c08",
"\u4e1a":"\u696d",
"\u4e1b":"\u53e2",
"\u4e1c":"\u6771",
"\u4e1d":"\u7d72",
"\u4e22":"\u4e1f",
"\u4e24":"\u5169",
"\u4e25":"\u56b4",
"\u4e27":"\u55aa",
"\u4e2a":"\u500b",
"\u4e30":"\u8c50",
"\u4e34":"\u81e8",
"\u4e3a":"\u70ba",
"\u4e3d":"\u9e97",
"\u4e3e":"\u8209",
"\u4e48":"\u9ebc",
"\u4e49":"\u7fa9",
"\u4e4c":"\u70cf",
"\u4e50":"\u6a02",
"\u4e54":"\u55ac",
"\u4e60":"\u7fd2",
"\u4e61":"\u9109",
"\u4e66":"\u66f8",
"\u4e70":"\u8cb7",
"\u4e71":"\u4e82",
"\u4e89":"\u722d",
"\u4e8e":"\u65bc",
"\u4e8f":"\u8667",
"\u4e91":"\u96f2",
"\u4e98":"\u4e99",
"\u4e9a":"\u4e9e",
"\u4ea7":"\u7522",
"\u4ea9":"\u755d",
"\u4eb2":"\u89aa",
"\u4eb5":"\u893b",
"\u4ebf":"\u5104",
"\u4ec5":"\u50c5",
"\u4ec6":"\u50d5",
"\u4ece":"\u5f9e",
"\u4ed1":"\u4f96",
"\u4ed3":"\u5009",
"\u4eea":"\u5100",
"\u4eec":"\u5011",
"\u4ef7":"\u50f9",
"\u4f17":"\u773e",
"\u4f18":"\u512a",
"\u4f1a":"\u6703",
"\u4f1b":"\u50b4",
"\u4f1e":"\u5098",
"\u4f1f":"\u5049",
"\u4f20":"\u50b3",
"\u4f24":"\u50b7",
"\u4f25":"\u5000",
"\u4f26":"\u502b",
"\u4f27":"\u5096",
"\u4f2a":"\u507d",
"\u4f2b":"\u4f47",
"\u4f32":"\u4f60",
"\u4f53":"\u9ad4",
"\u4f63":"\u50ad",
"\u4f65":"\u50c9",
"\u4fa0":"\u4fe0",
"\u4fa3":"\u4fb6",
"\u4fa5":"\u50e5",
"\u4fa6":"\u5075",
"\u4fa7":"\u5074",
"\u4fa8":"\u50d1",
"\u4fa9":"\u5108",
"\u4faa":"\u5115",
"\u4fac":"\u5102",
"\u4fe3":"\u4fc1",
"\u4fe6":"\u5114",
"\u4fe8":"\u513c",
"\u4fe9":"\u5006",
"\u4fea":"\u5137",
"\u4fed":"\u5109",
"\u502e":"\u88f8",
"\u503a":"\u50b5",
"\u503e":"\u50be",
"\u506c":"\u50af",
"\u507b":"\u50c2",
"\u507e":"\u50e8",
"\u507f":"\u511f",
"\u50a5":"\u513b",
"\u50a7":"\u5110",
"\u50a8":"\u5132",
"\u50a9":"\u513a",
"\u513f":"\u5152",
"\u5151":"\u514c",
"\u5156":"\u5157",
"\u515a":"\u9ee8",
"\u5170":"\u862d",
"\u5173":"\u95dc",
"\u5174":"\u8208",
"\u5179":"\u8332",
"\u517b":"\u990a",
"\u517d":"\u7378",
"\u5181":"\u56c5",
"\u5185":"\u5167",
"\u5188":"\u5ca1",
"\u518c":"\u518a",
"\u5199":"\u5beb",
"\u519b":"\u8ecd",
"\u519c":"\u8fb2",
"\u51af":"\u99ae",
"\u51b2":"\u6c96",
"\u51b3":"\u6c7a",
"\u51b5":"\u6cc1",
"\u51bb":"\u51cd",
"\u51c0":"\u6de8",
"\u51c4":"\u6dd2",
"\u51c7":"\u6dde",
"\u51c9":"\u6dbc",
"\u51cf":"\u6e1b",
"\u51d1":"\u6e4a",
"\u51db":"\u51dc",
"\u51e0":"\u5e7e",
"\u51e4":"\u9cf3",
"\u51e6":"\u8655",
"\u51eb":"\u9ce7",
"\u51ed":"\u6191",
"\u51ef":"\u51f1",
"\u51fb":"\u64ca",
"\u51fc":"\u5e7d",
"\u51ff":"\u947f",
"\u520d":"\u82bb",
"\u5212":"\u5283",
"\u5218":"\u5289",
"\u5219":"\u5247",
"\u521a":"\u525b",
"\u521b":"\u5275",
"\u5220":"\u522a",
"\u522b":"\u5225",
"\u522c":"\u5257",
"\u522d":"\u5244",
"\u5239":"\u524e",
"\u523d":"\u528a",
"\u523f":"\u528c",
"\u5240":"\u5274",
"\u5242":"\u5291",
"\u5250":"\u526e",
"\u5251":"\u528d",
"\u5265":"\u525d",
"\u5267":"\u5287",
"\u5273":"\u5284",
"\u529d":"\u52f8",
"\u529e":"\u8fa6",
"\u52a1":"\u52d9",
"\u52a2":"\u52f1",
"\u52a8":"\u52d5",
"\u52b1":"\u52f5",
"\u52b2":"\u52c1",
"\u52b3":"\u52de",
"\u52bf":"\u52e2",
"\u52cb":"\u52f3",
"\u52da":"\u52e9",
"\u52db":"\u52f3",
"\u52e6":"\u527f",
"\u5300":"\u52fb",
"\u5326":"\u532d",
"\u532e":"\u5331",
"\u533a":"\u5340",
"\u533b":"\u91ab",
"\u534e":"\u83ef",
"\u534f":"\u5354",
"\u5355":"\u55ae",
"\u5356":"\u8ce3",
"\u5360":"\u4f54",
"\u5362":"\u76e7",
"\u5364":"\u9e75",
"\u5367":"\u81e5",
"\u536b":"\u885b",
"\u5374":"\u537b",
"\u537a":"\u5df9",
"\u5382":"\u5ee0",
"\u5385":"\u5ef3",
"\u5386":"\u6b77",
"\u5389":"\u53b2",
"\u538b":"\u58d3",
"\u538c":"\u53ad",
"\u538d":"\u5399",
"\u5395":"\u5ec1",
"\u5398":"\u91d0",
"\u53a2":"\u5ec2",
"\u53a3":"\u53b4",
"\u53a6":"\u5ec8",
"\u53a8":"\u5eda",
"\u53a9":"\u5ec4",
"\u53ae":"\u5edd",
"\u53bf":"\u7e23",
"\u53c1":"\u53c3",
"\u53c2":"\u53c3",
"\u53c6":"\u9749",
"\u53c7":"\u9746",
"\u53cc":"\u96d9",
"\u53d1":"\u767c",
"\u53d8":"\u8b8a",
"\u53d9":"\u6558",
"\u53e0":"\u758a",
"\u53f6":"\u8449",
"\u53f7":"\u865f",
"\u53f9":"\u5606",
"\u53fd":"\u5630",
"\u5401":"\u7c72",
"\u540e":"\u5f8c",
"\u5413":"\u5687",
"\u5415":"\u5442",
"\u5417":"\u55ce",
"\u5428":"\u5678",
"\u542c":"\u807d",
"\u542f":"\u555f",
"\u5434":"\u5433",
"\u5450":"\u5436",
"\u5452":"\u5638",
"\u5453":"\u56c8",
"\u5455":"\u5614",
"\u5456":"\u56a6",
"\u5457":"\u5504",
"\u5458":"\u54e1",
"\u5459":"\u54bc",
"\u545b":"\u55c6",
"\u545c":"\u55da",
"\u548f":"\u8a60",
"\u5499":"\u56a8",
"\u549b":"\u5680",
"\u549d":"\u565d",
"\u54cc":"\u5471",
"\u54cd":"\u97ff",
"\u54d1":"\u555e",
"\u54d2":"\u5660",
"\u54d3":"\u5635",
"\u54d4":"\u55f6",
"\u54d5":"\u5666",
"\u54d7":"\u5629",
"\u54d9":"\u5672",
"\u54dc":"\u568c",
"\u54dd":"\u5665",
"\u54df":"\u55b2",
"\u551b":"\u561c",
"\u551d":"\u55ca",
"\u5520":"\u562e",
"\u5521":"\u5562",
"\u5522":"\u55e9",
"\u5524":"\u559a",
"\u5553":"\u555f",
"\u5567":"\u5616",
"\u556c":"\u55c7",
"\u556d":"\u56c0",
"\u556e":"\u9f67",
"\u5570":"\u56c9",
"\u5578":"\u562f",
"\u55b7":"\u5674",
"\u55bd":"\u560d",
"\u55be":"\u56b3",
"\u55eb":"\u56c1",
"\u55ec":"\u5475",
"\u55f3":"\u566f",
"\u5618":"\u5653",
"\u5624":"\u56b6",
"\u5629":"\u8b41",
"\u5631":"\u56d1",
"\u565c":"\u5695",
"\u56a3":"\u56c2",
"\u56ae":"\u5411",
"\u56e2":"\u5718",
"\u56ed":"\u5712",
"\u56ef":"\u570b",
"\u56f1":"\u56ea",
"\u56f4":"\u570d",
"\u56f5":"\u5707",
"\u56fd":"\u570b",
"\u56fe":"\u5716",
"\u5706":"\u5713",
"\u5723":"\u8056",
"\u5739":"\u58d9",
"\u573a":"\u5834",
"\u5742":"\u962a",
"\u574f":"\u58de",
"\u5757":"\u584a",
"\u575a":"\u5805",
"\u575b":"\u58c7",
"\u575c":"\u58e2",
"\u575d":"\u58e9",
"\u575e":"\u5862",
"\u575f":"\u58b3",
"\u5760":"\u589c",
"\u5784":"\u58df",
"\u5785":"\u58df",
"\u5786":"\u58da",
"\u5792":"\u58d8",
"\u57a6":"\u58be",
"\u57a9":"\u580a",
"\u57ab":"\u588a",
"\u57ad":"\u57e1",
"\u57b2":"\u584f",
"\u57b4":"\u5816",
"\u57d8":"\u5852",
"\u57d9":"\u58ce",
"\u57da":"\u581d",
"\u5811":"\u5879",
"\u5815":"\u58ae",
"\u5892":"\u5891",
"\u5899":"\u7246",
"\u58ee":"\u58ef",
"\u58f0":"\u8072",
"\u58f3":"\u6bbc",
"\u58f6":"\u58fa",
"\u5904":"\u8655",
"\u5907":"\u5099",
"\u590d":"\u5fa9",
"\u591f":"\u5920",
"\u5934":"\u982d",
"\u5938":"\u8a87",
"\u5939":"\u593e",
"\u593a":"\u596a",
"\u5941":"\u5969",
"\u5942":"\u5950",
"\u594b":"\u596e",
"\u5956":"\u734e",
"\u5965":"\u5967",
"\u596c":"\u734e",
"\u5986":"\u599d",
"\u5987":"\u5a66",
"\u5988":"\u5abd",
"\u59a9":"\u5af5",
"\u59aa":"\u5ad7",
"\u59ab":"\u5aaf",
"\u59d7":"\u59cd",
"\u5a04":"\u5a41",
"\u5a05":"\u5a6d",
"\u5a06":"\u5b08",
"\u5a07":"\u5b0c",
"\u5a08":"\u5b4c",
"\u5a31":"\u5a1b",
"\u5a32":"\u5aa7",
"\u5a34":"\u5afb",
"\u5a73":"\u5aff",
"\u5a74":"\u5b30",
"\u5a75":"\u5b0b",
"\u5a76":"\u5b38",
"\u5aaa":"\u5abc",
"\u5ad2":"\u5b21",
"\u5ad4":"\u5b2a",
"\u5af1":"\u5b19",
"\u5b37":"\u5b24",
"\u5b59":"\u5b6b",
"\u5b66":"\u5b78",
"\u5b6a":"\u5b7f",
"\u5b81":"\u5be7",
"\u5b9d":"\u5bf6",
"\u5b9e":"\u5be6",
"\u5ba0":"\u5bf5",
"\u5ba1":"\u5be9",
"\u5baa":"\u61b2",
"\u5bab":"\u5bae",
"\u5bbd":"\u5bec",
"\u5bbe":"\u8cd3",
"\u5bc0":"\u91c7",
"\u5bdd":"\u5be2",
"\u5bf9":"\u5c0d",
"\u5bfb":"\u5c0b",
"\u5bfc":"\u5c0e",
"\u5bff":"\u58fd",
"\u5c06":"\u5c07",
"\u5c14":"\u723e",
"\u5c18":"\u5875",
"\u5c1c":"\u560e",
"\u5c1d":"\u5617",
"\u5c27":"\u582f",
"\u5c34":"\u5c37",
"\u5c38":"\u5c4d",
"\u5c3d":"\u76e1",
"\u5c42":"\u5c64",
"\u5c49":"\u5c5c",
"\u5c4a":"\u5c46",
"\u5c5e":"\u5c6c",
"\u5c61":"\u5c62",
"\u5c66":"\u5c68",
"\u5c7f":"\u5dbc",
"\u5c81":"\u6b72",
"\u5c82":"\u8c48",
"\u5c96":"\u5d87",
"\u5c97":"\u5d17",
"\u5c98":"\u5cf4",
"\u5c9a":"\u5d50",
"\u5c9b":"\u5cf6",
"\u5cad":"\u5dba",
"\u5cbd":"\u5d20",
"\u5cbf":"\u5dcb",
"\u5cc3":"\u5da8",
"\u5cc4":"\u5da7",
"\u5ce1":"\u5cfd",
"\u5ce3":"\u5da2",
"\u5ce4":"\u5da0",
"\u5ce5":"\u5d22",
"\u5ce6":"\u5dd2",
"\u5cef":"\u5cf0",
"\u5d02":"\u5d97",
"\u5d03":"\u5d0d",
"\u5d10":"\u5d11",
"\u5d2d":"\u5d84",
"\u5d58":"\u5db8",
"\u5d5a":"\u5d94",
"\u5d5b":"\u5d33",
"\u5d5d":"\u5d81",
"\u5dc5":"\u5dd4",
"\u5dcc":"\u5dd6",
"\u5de9":"\u978f",
"\u5def":"\u5df0",
"\u5e01":"\u5e63",
"\u5e05":"\u5e25",
"\u5e08":"\u5e2b",
"\u5e0f":"\u5e43",
"\u5e10":"\u5e33",
"\u5e18":"\u7c3e",
"\u5e1c":"\u5e5f",
"\u5e26":"\u5e36",
"\u5e27":"\u5e40",
"\u5e2e":"\u5e6b",
"\u5e31":"\u5e6c",
"\u5e3b":"\u5e58",
"\u5e3c":"\u5e57",
"\u5e42":"\u51aa",
"\u5e75":"\u958b",
"\u5e76":"\u4e26",
"\u5e77":"\u4e26",
"\u5e7f":"\u5ee3",
"\u5e84":"\u838a",
"\u5e86":"\u6176",
"\u5e90":"\u5eec",
"\u5e91":"\u5ee1",
"\u5e93":"\u5eab",
"\u5e94":"\u61c9",
"\u5e99":"\u5edf",
"\u5e9e":"\u9f90",
"\u5e9f":"\u5ee2",
"\u5ebc":"\u5ece",
"\u5eea":"\u5ee9",
"\u5f00":"\u958b",
"\u5f02":"\u7570",
"\u5f03":"\u68c4",
"\u5f11":"\u5f12",
"\u5f20":"\u5f35",
"\u5f25":"\u5f4c",
"\u5f2a":"\u5f33",
"\u5f2f":"\u5f4e",
"\u5f39":"\u5f48",
"\u5f3a":"\u5f37",
"\u5f52":"\u6b78",
"\u5f53":"\u7576",
"\u5f54":"\u5f55",
"\u5f55":"\u9304",
"\u5f5a":"\u5f59",
"\u5f66":"\u5f65",
"\u5f7b":"\u5fb9",
"\u5f84":"\u5f91",
"\u5f95":"\u5fa0",
"\u5fc6":"\u61b6",
"\u5fcf":"\u61fa",
"\u5fe7":"\u6182",
"\u5ffe":"\u613e",
"\u6000":"\u61f7",
"\u6001":"\u614b",
"\u6002":"\u616b",
"\u6003":"\u61ae",
"\u6004":"\u616a",
"\u6005":"\u60b5",
"\u6006":"\u6134",
"\u601c":"\u6190",
"\u603b":"\u7e3d",
"\u603c":"\u61df",
"\u603f":"\u61cc",
"\u604b":"\u6200",
"\u6052":"\u6046",
"\u6073":"\u61c7",
"\u6076":"\u60e1",
"\u6078":"\u615f",
"\u6079":"\u61e8",
"\u607a":"\u6137",
"\u607b":"\u60fb",
"\u607c":"\u60f1",
"\u607d":"\u60f2",
"\u60a6":"\u6085",
"\u60ab":"\u6128",
"\u60ac":"\u61f8",
"\u60ad":"\u6173",
"\u60af":"\u61ab",
"\u60ca":"\u9a5a",
"\u60e7":"\u61fc",
"\u60e8":"\u6158",
"\u60e9":"\u61f2",
"\u60eb":"\u618a",
"\u60ec":"\u611c",
"\u60ed":"\u615a",
"\u60ee":"\u619a",
"\u60ef":"\u6163",
"\u6120":"\u614d",
"\u6124":"\u61a4",
"\u6126":"\u6192",
"\u613f":"\u9858",
"\u6151":"\u61fe",
"\u61d1":"\u61e3",
"\u61d2":"\u61f6",
"\u61d4":"\u61cd",
"\u6206":"\u6207",
"\u620b":"\u6214",
"\u620f":"\u6232",
"\u6217":"\u6227",
"\u6218":"\u6230",
"\u622c":"\u6229",
"\u6237":"\u6236",
"\u6251":"\u64b2",
"\u6267":"\u57f7",
"\u6269":"\u64f4",
"\u626a":"\u636b",
"\u626b":"\u6383",
"\u626c":"\u63da",
"\u6270":"\u64fe",
"\u629a":"\u64ab",
"\u629b":"\u62cb",
"\u629f":"\u6476",
"\u62a0":"\u6473",
"\u62a1":"\u6384",
"\u62a2":"\u6436",
"\u62a4":"\u8b77",
"\u62a5":"\u5831",
"\u62c5":"\u64d4",
"\u62df":"\u64ec",
"\u62e2":"\u650f",
"\u62e3":"\u63c0",
"\u62e5":"\u64c1",
"\u62e6":"\u6514",
"\u62e7":"\u64f0",
"\u62e8":"\u64a5",
"\u62e9":"\u64c7",
"\u6302":"\u639b",
"\u631a":"\u646f",
"\u631b":"\u6523",
"\u631c":"\u6397",
"\u631d":"\u64be",
"\u631e":"\u64bb",
"\u631f":"\u633e",
"\u6320":"\u6493",
"\u6321":"\u64cb",
"\u6322":"\u649f",
"\u6323":"\u6399",
"\u6324":"\u64e0",
"\u6325":"\u63ee",
"\u6326":"\u648f",
"\u635c":"\u641c",
"\u635e":"\u6488",
"\u635f":"\u640d",
"\u6361":"\u64bf",
"\u6362":"\u63db",
"\u6363":"\u6417",
"\u636e":"\u64da",
"\u63b3":"\u64c4",
"\u63b4":"\u6451",
"\u63b7":"\u64f2",
"\u63b8":"\u64a3",
"\u63ba":"\u647b",
"\u63bc":"\u645c",
"\u63fd":"\u652c",
"\u63ff":"\u64b3",
"\u6400":"\u6519",
"\u6401":"\u64f1",
"\u6402":"\u645f",
"\u6405":"\u652a",
"\u643a":"\u651c",
"\u6444":"\u651d",
"\u6445":"\u6504",
"\u6446":"\u64fa",
"\u6447":"\u6416",
"\u6448":"\u64ef",
"\u644a":"\u6524",
"\u6484":"\u6516",
"\u6491":"\u6490",
"\u64b5":"\u6506",
"\u64b7":"\u64f7",
"\u64b8":"\u64fc",
"\u64ba":"\u651b",
"\u64c0":"\u641f",
"\u64de":"\u64fb",
"\u6512":"\u6522",
"\u654c":"\u6575",
"\u655b":"\u6582",
"\u6570":"\u6578",
"\u658b":"\u9f4b",
"\u6593":"\u6595",
"\u65a9":"\u65ac",
"\u65ad":"\u65b7",
"\u65e0":"\u7121",
"\u65e7":"\u820a",
"\u65f6":"\u6642",
"\u65f7":"\u66e0",
"\u65f8":"\u6698",
"\u6619":"\u66c7",
"\u6635":"\u66b1",
"\u663c":"\u665d",
"\u663d":"\u66e8",
"\u663e":"\u986f",
"\u664b":"\u6649",
"\u6652":"\u66ec",
"\u6653":"\u66c9",
"\u6654":"\u66c4",
"\u6655":"\u6688",
"\u6656":"\u6689",
"\u6682":"\u66ab",
"\u66a7":"\u66d6",
"\u66b8":"\u77ad",
"\u672e":"\u8853",
"\u672f":"\u8853",
"\u673a":"\u6a5f",
"\u6740":"\u6bba",
"\u6742":"\u96dc",
"\u6743":"\u6b0a",
"\u6746":"\u687f",
"\u6760":"\u69d3",
"\u6761":"\u689d",
"\u6765":"\u4f86",
"\u6768":"\u694a",
"\u6769":"\u69aa",
"\u6770":"\u5091",
"\u6781":"\u6975",
"\u6784":"\u69cb",
"\u679e":"\u6a05",
"\u67a2":"\u6a1e",
"\u67a3":"\u68d7",
"\u67a5":"\u6aea",
"\u67a7":"\u6898",
"\u67a8":"\u68d6",
"\u67aa":"\u69cd",
"\u67ab":"\u6953",
"\u67ad":"\u689f",
"\u67dc":"\u6ac3",
"\u67e0":"\u6ab8",
"\u67fd":"\u6a89",
"\u6800":"\u6894",
"\u6805":"\u67f5",
"\u6807":"\u6a19",
"\u6808":"\u68e7",
"\u6809":"\u6adb",
"\u680a":"\u6af3",
"\u680b":"\u68df",
"\u680c":"\u6ae8",
"\u680e":"\u6adf",
"\u680f":"\u6b04",
"\u6811":"\u6a39",
"\u6816":"\u68f2",
"\u6837":"\u6a23",
"\u683e":"\u6b12",
"\u6854":"\u6a58",
"\u6860":"\u690f",
"\u6861":"\u6a48",
"\u6862":"\u6968",
"\u6863":"\u6a94",
"\u6864":"\u69bf",
"\u6865":"\u6a4b",
"\u6866":"\u6a3a",
"\u6867":"\u6a9c",
"\u6868":"\u69f3",
"\u6869":"\u6a01",
"\u68a6":"\u5922",
"\u68c0":"\u6aa2",
"\u68c2":"\u6afa",
"\u6901":"\u69e8",
"\u691f":"\u6add",
"\u6920":"\u69e7",
"\u6924":"\u6b0f",
"\u692d":"\u6a62",
"\u697c":"\u6a13",
"\u6984":"\u6b16",
"\u6987":"\u6aec",
"\u6988":"\u6ada",
"\u6989":"\u6af8",
"\u6998":"\u77e9",
"\u69da":"\u6a9f",
"\u69db":"\u6abb",
"\u69df":"\u6ab3",
"\u69e0":"\u6ae7",
"\u69fc":"\u898f",
"\u6a2a":"\u6a6b",
"\u6a2f":"\u6aa3",
"\u6a31":"\u6afb",
"\u6a65":"\u6aeb",
"\u6a71":"\u6ae5",
"\u6a79":"\u6ad3",
"\u6a7c":"\u6ade",
"\u6a90":"\u7c37",
"\u6aa9":"\u6a81",
"\u6b22":"\u6b61",
"\u6b24":"\u6b5f",
"\u6b27":"\u6b50",
"\u6b4e":"\u5606",
"\u6b7c":"\u6bb2",
"\u6b81":"\u6b7f",
"\u6b87":"\u6ba4",
"\u6b8b":"\u6b98",
"\u6b92":"\u6b9e",
"\u6b93":"\u6bae",
"\u6b9a":"\u6bab",
"\u6ba1":"\u6baf",
"\u6bb4":"\u6bc6",
"\u6bc1":"\u6bc0",
"\u6bc2":"\u8f42",
"\u6bd5":"\u7562",
"\u6bd9":"\u6583",
"\u6be1":"\u6c08",
"\u6bf5":"\u6bff",
"\u6c07":"\u6c0c",
"\u6c14":"\u6c23",
"\u6c22":"\u6c2b",
"\u6c29":"\u6c2c",
"\u6c32":"\u6c33",
"\u6c3d":"\u6c46",
"\u6c47":"\u532f",
"\u6c49":"\u6f22",
"\u6c64":"\u6e6f",
"\u6c79":"\u6d36",
"\u6c9f":"\u6e9d",
"\u6ca1":"\u6c92",
"\u6ca3":"\u7043",
"\u6ca4":"\u6f1a",
"\u6ca5":"\u701d",
"\u6ca6":"\u6dea",
"\u6ca7":"\u6ec4",
"\u6ca8":"\u6e22",
"\u6ca9":"\u6e88",
"\u6caa":"\u6eec",
"\u6cb2":"\u6cb1",
"\u6cc4":"\u6d29",
"\u6cde":"\u6fd8",
"\u6cea":"\u6dda",
"\u6cf6":"\u6fa9",
"\u6cf7":"\u7027",
"\u6cf8":"\u7018",
"\u6cfa":"\u6ffc",
"\u6cfb":"\u7009",
"\u6cfc":"\u6f51",
"\u6cfd":"\u6fa4",
"\u6cfe":"\u6d87",
"\u6d01":"\u6f54",
"\u6d12":"\u7051",
"\u6d3c":"\u7aaa",
"\u6d43":"\u6d79",
"\u6d45":"\u6dfa",
"\u6d46":"\u6f3f",
"\u6d47":"\u6f86",
"\u6d48":"\u6e5e",
"\u6d49":"\u6eae",
"\u6d4a":"\u6fc1",
"\u6d4b":"\u6e2c",
"\u6d4d":"\u6fae",
"\u6d4e":"\u6fdf",
"\u6d4f":"\u700f",
"\u6d50":"\u6efb",
"\u6d51":"\u6e3e",
"\u6d52":"\u6ef8",
"\u6d53":"\u6fc3",
"\u6d54":"\u6f6f",
"\u6d55":"\u6fdc",
"\u6d5c":"\u6ff1",
"\u6d8c":"\u6e67",
"\u6d9b":"\u6fe4",
"\u6d9d":"\u6f87",
"\u6d9e":"\u6df6",
"\u6d9f":"\u6f23",
"\u6da0":"\u6f7f",
"\u6da1":"\u6e26",
"\u6da2":"\u6eb3",
"\u6da3":"\u6e19",
"\u6da4":"\u6ecc",
"\u6da6":"\u6f64",
"\u6da7":"\u6f97",
"\u6da8":"\u6f32",
"\u6da9":"\u6f80",
"\u6e0a":"\u6df5",
"\u6e0c":"\u6de5",
"\u6e0d":"\u6f2c",
"\u6e0e":"\u7006",
"\u6e10":"\u6f38",
"\u6e11":"\u6fa0",
"\u6e14":"\u6f01",
"\u6e16":"\u700b",
"\u6e17":"\u6ef2",
"\u6e29":"\u6eab",
"\u6e7e":"\u7063",
"\u6e7f":"\u6fd5",
"\u6e83":"\u6f70",
"\u6e85":"\u6ffa",
"\u6e86":"\u6f35",
"\u6e87":"\u6f0a",
"\u6ebc":"\u6fd5",
"\u6ed7":"\u6f77",
"\u6eda":"\u6efe",
"\u6ede":"\u6eef",
"\u6edf":"\u7069",
"\u6ee0":"\u7044",
"\u6ee1":"\u6eff",
"\u6ee2":"\u7005",
"\u6ee4":"\u6ffe",
"\u6ee5":"\u6feb",
"\u6ee6":"\u7064",
"\u6ee8":"\u6ff1",
"\u6ee9":"\u7058",
"\u6eea":"\u6fa6",
"\u6f46":"\u7020",
"\u6f47":"\u701f",
"\u6f4b":"\u7032",
"\u6f4d":"\u6ff0",
"\u6f5c":"\u6f5b",
"\u6f74":"\u7026",
"\u6f9c":"\u703e",
"\u6fd1":"\u7028",
"\u6fd2":"\u7015",
"\u704f":"\u705d",
"\u706d":"\u6ec5",
"\u706f":"\u71c8",
"\u7075":"\u9748",
"\u707e":"\u707d",
"\u707f":"\u71e6",
"\u7080":"\u716c",
"\u7089":"\u7210",
"\u7096":"\u71c9",
"\u709c":"\u7152",
"\u709d":"\u7197",
"\u70a4":"\u7167",
"\u70b9":"\u9ede",
"\u70bc":"\u7149",
"\u70bd":"\u71be",
"\u70c1":"\u720d",
"\u70c2":"\u721b",
"\u70c3":"\u70f4",
"\u70db":"\u71ed",
"\u70df":"\u7159",
"\u70e6":"\u7169",
"\u70e7":"\u71d2",
"\u70e8":"\u71c1",
"\u70e9":"\u71f4",
"\u70eb":"\u71d9",
"\u70ec":"\u71fc",
"\u70ed":"\u71b1",
"\u7115":"\u7165",
"\u7116":"\u71dc",
"\u7118":"\u71fe",
"\u7145":"\u935b",
"\u7231":"\u611b",
"\u7232":"\u70ba",
"\u7237":"\u723a",
"\u7240":"\u5e8a",
"\u724d":"\u7258",
"\u7266":"\u729b",
"\u7275":"\u727d",
"\u727a":"\u72a7",
"\u728a":"\u72a2",
"\u72b6":"\u72c0",
"\u72b7":"\u7377",
"\u72b8":"\u7341",
"\u72b9":"\u7336",
"\u72c8":"\u72fd",
"\u72dd":"\u736e",
"\u72de":"\u7370",
"\u72ec":"\u7368",
"\u72ed":"\u72f9",
"\u72ee":"\u7345",
"\u72ef":"\u736a",
"\u72f0":"\u7319",
"\u72f1":"\u7344",
"\u72f2":"\u733b",
"\u7303":"\u736b",
"\u730e":"\u7375",
"\u7315":"\u737c",
"\u7321":"\u7380",
"\u732a":"\u8c6c",
"\u732b":"\u8c93",
"\u732c":"\u875f",
"\u732e":"\u737b",
"\u7343":"\u5446",
"\u736d":"\u737a",
"\u7391":"\u74a3",
"\u739b":"\u746a",
"\u73ae":"\u744b",
"\u73af":"\u74b0",
"\u73b0":"\u73fe",
"\u73b1":"\u7472",
"\u73ba":"\u74bd",
"\u73c9":"\u739f",
"\u73cf":"\u73a8",
"\u73d0":"\u743a",
"\u73d1":"\u74cf",
"\u73f2":"\u743f",
"\u740e":"\u74a1",
"\u740f":"\u7489",
"\u7410":"\u7463",
"\u742f":"\u7ba1",
"\u743c":"\u74ca",
"\u7476":"\u7464",
"\u7477":"\u74a6",
"\u748e":"\u74d4",
"\u74d2":"\u74da",
"\u74ee":"\u7515",
"\u74ef":"\u750c",
"\u7523":"\u7522",
"\u7535":"\u96fb",
"\u753b":"\u756b",
"\u7545":"\u66a2",
"\u7572":"\u756c",
"\u7574":"\u7587",
"\u7596":"\u7664",
"\u7597":"\u7642",
"\u759f":"\u7627",
"\u75a0":"\u7658",
"\u75a1":"\u760d",
"\u75ac":"\u7667",
"\u75ae":"\u7621",
"\u75af":"\u760b",
"\u75b1":"\u76b0",
"\u75b4":"\u75fe",
"\u75c8":"\u7670",
"\u75c9":"\u75d9",
"\u75d2":"\u7662",
"\u75d6":"\u7602",
"\u75e8":"\u7646",
"\u75ea":"\u7613",
"\u75eb":"\u7647",
"\u75f9":"\u75fa",
"\u7605":"\u7649",
"\u7617":"\u761e",
"\u7618":"\u763b",
"\u762a":"\u765f",
"\u762b":"\u7671",
"\u763e":"\u766e",
"\u763f":"\u766d",
"\u765e":"\u7669",
"\u7661":"\u75f4",
"\u7663":"\u766c",
"\u766b":"\u7672",
"\u7691":"\u769a",
"\u76b0":"\u75b1",
"\u76b1":"\u76ba",
"\u76b2":"\u76b8",
"\u76cf":"\u76de",
"\u76d0":"\u9e7d",
"\u76d1":"\u76e3",
"\u76d6":"\u84cb",
"\u76d7":"\u76dc",
"\u76d8":"\u76e4",
"\u770d":"\u7798",
"\u770e":"\u8996",
"\u7726":"\u7725",
"\u772c":"\u77d3",
"\u7740":"\u8457",
"\u7741":"\u775c",
"\u7750":"\u775e",
"\u7751":"\u77bc",
"\u7792":"\u779e",
"\u77a9":"\u77da",
"\u77eb":"\u77ef",
"\u77f6":"\u78ef",
"\u77fe":"\u792c",
"\u77ff":"\u7926",
"\u7800":"\u78ad",
"\u7801":"\u78bc",
"\u7816":"\u78da",
"\u7817":"\u7868",
"\u781a":"\u786f",
"\u781c":"\u78b8",
"\u783a":"\u792a",
"\u783b":"\u7931",
"\u783e":"\u792b",
"\u7840":"\u790e",
"\u7855":"\u78a9",
"\u7856":"\u7864",
"\u7857":"\u78fd",
"\u7859":"\u78d1",
"\u785a":"\u7904",
"\u786e":"\u78ba",
"\u7877":"\u9e7c",
"\u788d":"\u7919",
"\u789b":"\u78e7",
"\u789c":"\u78e3",
"\u78b1":"\u9e7c",
"\u7921":"\u7934",
"\u793c":"\u79ae",
"\u794e":"\u7995",
"\u796f":"\u798e",
"\u7977":"\u79b1",
"\u7978":"\u798d",
"\u7980":"\u7a1f",
"\u7984":"\u797f",
"\u7985":"\u79aa",
"\u79b0":"\u7962",
"\u79bb":"\u96e2",
"\u79c3":"\u79bf",
"\u79c6":"\u7a08",
"\u79cd":"\u7a2e",
"\u79ef":"\u7a4d",
"\u79f0":"\u7a31",
"\u79fd":"\u7a62",
"\u7a0e":"\u7a05",
"\u7a23":"\u7a4c",
"\u7a2d":"\u79f8",
"\u7a33":"\u7a69",
"\u7a51":"\u7a61",
"\u7a77":"\u7aae",
"\u7a83":"\u7aca",
"\u7a8d":"\u7ac5",
"\u7a8e":"\u7ab5",
"\u7a91":"\u7aaf",
"\u7a9c":"\u7ac4",
"\u7a9d":"\u7aa9",
"\u7aa5":"\u7aba",
"\u7aa6":"\u7ac7",
"\u7aad":"\u7ab6",
"\u7ad6":"\u8c4e",
"\u7ade":"\u7af6",
"\u7b03":"\u7be4",
"\u7b0b":"\u7b4d",
"\u7b14":"\u7b46",
"\u7b15":"\u7b67",
"\u7b3a":"\u7b8b",
"\u7b3c":"\u7c60",
"\u7b3e":"\u7c69",
"\u7b51":"\u7bc9",
"\u7b5a":"\u7bf3",
"\u7b5b":"\u7be9",
"\u7b5d":"\u7b8f",
"\u7b79":"\u7c4c",
"\u7b7e":"\u7c3d",
"\u7b80":"\u7c21",
"\u7b93":"\u7c59",
"\u7ba6":"\u7c00",
"\u7ba7":"\u7bcb",
"\u7ba8":"\u7c5c",
"\u7ba9":"\u7c6e",
"\u7baa":"\u7c1e",
"\u7bab":"\u7c2b",
"\u7bd1":"\u7c23",
"\u7bd3":"\u7c0d",
"\u7bee":"\u7c43",
"\u7bf1":"\u7c6c",
"\u7c16":"\u7c6a",
"\u7c41":"\u7c5f",
"\u7c74":"\u7cf4",
"\u7c7b":"\u985e",
"\u7c7c":"\u79c8",
"\u7c9c":"\u7cf6",
"\u7c9d":"\u7cf2",
"\u7ca4":"\u7cb5",
"\u7caa":"\u7cde",
"\u7cae":"\u7ce7",
"\u7cc1":"\u7cdd",
"\u7cc7":"\u9931",
"\u7ccd":"\u9908",
"\u7d25":"\u7d2e",
"\u7d27":"\u7dca",
"\u7d77":"\u7e36",
"\u7dab":"\u7dda",
"\u7ea0":"\u7cfe",
"\u7ea1":"\u7d06",
"\u7ea2":"\u7d05",
"\u7ea3":"\u7d02",
"\u7ea4":"\u7e96",
"\u7ea5":"\u7d07",
"\u7ea6":"\u7d04",
"\u7ea7":"\u7d1a",
"\u7ea8":"\u7d08",
"\u7ea9":"\u7e8a",
"\u7eaa":"\u7d00",
"\u7eab":"\u7d09",
"\u7eac":"\u7def",
"\u7ead":"\u7d1c",
"\u7eae":"\u7d18",
"\u7eaf":"\u7d14",
"\u7eb0":"\u7d15",
"\u7eb1":"\u7d17",
"\u7eb2":"\u7db1",
"\u7eb3":"\u7d0d",
"\u7eb4":"\u7d1d",
"\u7eb5":"\u7e31",
"\u7eb6":"\u7db8",
"\u7eb7":"\u7d1b",
"\u7eb8":"\u7d19",
"\u7eb9":"\u7d0b",
"\u7eba":"\u7d21",
"\u7ebc":"\u7d16",
"\u7ebd":"\u7d10",
"\u7ebe":"\u7d13",
"\u7ebf":"\u7dda",
"\u7ec0":"\u7d3a",
"\u7ec1":"\u7d32",
"\u7ec2":"\u7d31",
"\u7ec3":"\u7df4",
"\u7ec4":"\u7d44",
"\u7ec5":"\u7d33",
"\u7ec6":"\u7d30",
"\u7ec7":"\u7e54",
"\u7ec8":"\u7d42",
"\u7ec9":"\u7e10",
"\u7eca":"\u7d46",
"\u7ecb":"\u7d3c",
"\u7ecc":"\u7d40",
"\u7ecd":"\u7d39",
"\u7ece":"\u7e79",
"\u7ecf":"\u7d93",
"\u7ed0":"\u7d3f",
"\u7ed1":"\u7d81",
"\u7ed2":"\u7d68",
"\u7ed3":"\u7d50",
"\u7ed4":"\u7d5d",
"\u7ed5":"\u7e5e",
"\u7ed6":"\u7d70",
"\u7ed7":"\u7d4e",
"\u7ed8":"\u7e6a",
"\u7ed9":"\u7d66",
"\u7eda":"\u7d62",
"\u7edb":"\u7d73",
"\u7edc":"\u7d61",
"\u7edd":"\u7d55",
"\u7ede":"\u7d5e",
"\u7edf":"\u7d71",
"\u7ee0":"\u7d86",
"\u7ee1":"\u7d83",
"\u7ee2":"\u7d79",
"\u7ee3":"\u7e61",
"\u7ee5":"\u7d8f",
"\u7ee6":"\u7d5b",
"\u7ee7":"\u7e7c",
"\u7ee8":"\u7d88",
"\u7ee9":"\u7e3e",
"\u7eea":"\u7dd2",
"\u7eeb":"\u7dbe",
"\u7eed":"\u7e8c",
"\u7eee":"\u7dba",
"\u7eef":"\u7dcb",
"\u7ef0":"\u7dbd",
"\u7ef1":"\u7dd4",
"\u7ef2":"\u7dc4",
"\u7ef3":"\u7e69",
"\u7ef4":"\u7dad",
"\u7ef5":"\u7dbf",
"\u7ef6":"\u7dac",
"\u7ef7":"\u7e43",
"\u7ef8":"\u7da2",
"\u7efa":"\u7db9",
"\u7efb":"\u7da3",
"\u7efc":"\u7d9c",
"\u7efd":"\u7dbb",
"\u7efe":"\u7db0",
"\u7eff":"\u7da0",
"\u7f00":"\u7db4",
"\u7f01":"\u7dc7",
"\u7f02":"\u7dd9",
"\u7f03":"\u7dd7",
"\u7f04":"\u7dd8",
"\u7f05":"\u7dec",
"\u7f06":"\u7e9c",
"\u7f07":"\u7df9",
"\u7f08":"\u7df2",
"\u7f09":"\u7ddd",
"\u7f0a":"\u7e15",
"\u7f0b":"\u7e62",
"\u7f0c":"\u7de6",
"\u7f0d":"\u7d9e",
"\u7f0e":"\u7dde",
"\u7f0f":"\u7df6",
"\u7f11":"\u7df1",
"\u7f12":"\u7e0b",
"\u7f13":"\u7de9",
"\u7f14":"\u7de0",
"\u7f15":"\u7e37",
"\u7f16":"\u7de8",
"\u7f17":"\u7de1",
"\u7f18":"\u7de3",
"\u7f19":"\u7e09",
"\u7f1a":"\u7e1b",
"\u7f1b":"\u7e1f",
"\u7f1c":"\u7e1d",
"\u7f1d":"\u7e2b",
"\u7f1e":"\u7e17",
"\u7f1f":"\u7e1e",
"\u7f20":"\u7e8f",
"\u7f21":"\u7e2d",
"\u7f22":"\u7e0a",
"\u7f23":"\u7e11",
"\u7f24":"\u7e7d",
"\u7f25":"\u7e39",
"\u7f26":"\u7e35",
"\u7f27":"\u7e32",
"\u7f28":"\u7e93",
"\u7f29":"\u7e2e",
"\u7f2a":"\u7e46",
"\u7f2b":"\u7e45",
"\u7f2c":"\u7e88",
"\u7f2d":"\u7e5a",
"\u7f2e":"\u7e55",
"\u7f2f":"\u7e52",
"\u7f30":"\u97c1",
"\u7f31":"\u7e7e",
"\u7f32":"\u7e70",
"\u7f33":"\u7e6f",
"\u7f34":"\u7e73",
"\u7f35":"\u7e98",
"\u7f42":"\u7f4c",
"\u7f4e":"\u7f48",
"\u7f51":"\u7db2",
"\u7f57":"\u7f85",
"\u7f5a":"\u7f70",
"\u7f62":"\u7f77",
"\u7f74":"\u7f86",
"\u7f81":"\u7f88",
"\u7f9f":"\u7fa5",
"\u7fa1":"\u7fa8",
"\u7fd8":"\u7ff9",
"\u7fda":"\u7fec",
"\u8022":"\u802e",
"\u8027":"\u802c",
"\u8038":"\u8073",
"\u803b":"\u6065",
"\u8042":"\u8076",
"\u804b":"\u807e",
"\u804c":"\u8077",
"\u804d":"\u8079",
"\u8054":"\u806f",
"\u8069":"\u8075",
"\u806a":"\u8070",
"\u8080":"\u807f",
"\u8083":"\u8085",
"\u80a0":"\u8178",
"\u80a4":"\u819a",
"\u80ae":"\u9aaf",
"\u80be":"\u814e",
"\u80bf":"\u816b",
"\u80c0":"\u8139",
"\u80c1":"\u8105",
"\u80c6":"\u81bd",
"\u80dc":"\u52dd",
"\u80e7":"\u6727",
"\u80e8":"\u8156",
"\u80ea":"\u81da",
"\u80eb":"\u811b",
"\u80f6":"\u81a0",
"\u8109":"\u8108",
"\u810d":"\u81be",
"\u810f":"\u9ad2",
"\u8110":"\u81cd",
"\u8111":"\u8166",
"\u8113":"\u81bf",
"\u8114":"\u81e0",
"\u811a":"\u8173",
"\u8123":"\u5507",
"\u8129":"\u4fee",
"\u8131":"\u812b",
"\u8136":"\u8161",
"\u8138":"\u81c9",
"\u814a":"\u81d8",
"\u814c":"\u9183",
"\u8158":"\u8195",
"\u816d":"\u984e",
"\u817b":"\u81a9",
"\u817c":"\u9766",
"\u817d":"\u8183",
"\u817e":"\u9a30",
"\u8191":"\u81cf",
"\u81bb":"\u7fb6",
"\u81dc":"\u81e2",
"\u8206":"\u8f3f",
"\u8223":"\u8264",
"\u8230":"\u8266",
"\u8231":"\u8259",
"\u823b":"\u826b",
"\u8270":"\u8271",
"\u8273":"\u8c54",
"\u827a":"\u85dd",
"\u8282":"\u7bc0",
"\u8288":"\u7f8b",
"\u8297":"\u858c",
"\u829c":"\u856a",
"\u82a6":"\u8606",
"\u82c1":"\u84ef",
"\u82c7":"\u8466",
"\u82c8":"\u85f6",
"\u82cb":"\u83a7",
"\u82cc":"\u8407",
"\u82cd":"\u84bc",
"\u82ce":"\u82e7",
"\u82cf":"\u8607",
"\u82f9":"\u860b",
"\u830e":"\u8396",
"\u830f":"\u8622",
"\u8311":"\u8526",
"\u8314":"\u584b",
"\u8315":"\u7162",
"\u8327":"\u7e6d",
"\u8346":"\u834a",
"\u8350":"\u85a6",
"\u835a":"\u83a2",
"\u835b":"\u8558",
"\u835c":"\u84fd",
"\u835e":"\u854e",
"\u835f":"\u8588",
"\u8360":"\u85ba",
"\u8361":"\u8569",
"\u8363":"\u69ae",
"\u8364":"\u8477",
"\u8365":"\u6ece",
"\u8366":"\u7296",
"\u8367":"\u7192",
"\u8368":"\u8541",
"\u8369":"\u85ce",
"\u836a":"\u84c0",
"\u836b":"\u852d",
"\u836c":"\u8552",
"\u836d":"\u8452",
"\u836e":"\u8464",
"\u836f":"\u85e5",
"\u8385":"\u849e",
"\u83b1":"\u840a",
"\u83b2":"\u84ee",
"\u83b3":"\u8494",
"\u83b4":"\u8435",
"\u83b6":"\u859f",
"\u83b7":"\u7372",
"\u83b8":"\u8555",
"\u83b9":"\u7469",
"\u83ba":"\u9daf",
"\u83bc":"\u84f4",
"\u841a":"\u8600",
"\u841d":"\u863f",
"\u8424":"\u87a2",
"\u8425":"\u71df",
"\u8426":"\u7e08",
"\u8427":"\u856d",
"\u8428":"\u85a9",
"\u8457":"\u8457",
"\u846f":"\u85e5",
"\u8471":"\u8525",
"\u8487":"\u8546",
"\u8489":"\u8562",
"\u848b":"\u8523",
"\u848c":"\u851e",
"\u84dd":"\u85cd",
"\u84df":"\u858a",
"\u84e0":"\u863a",
"\u84e3":"\u8577",
"\u84e5":"\u93a3",
"\u84e6":"\u9a40",
"\u8534":"\u9ebb",
"\u8537":"\u8594",
"\u8539":"\u861e",
"\u853a":"\u85fa",
"\u853c":"\u85f9",
"\u8572":"\u8604",
"\u8574":"\u860a",
"\u85ae":"\u85ea",
"\u85d3":"\u861a",
"\u8616":"\u8617",
"\u864f":"\u865c",
"\u8651":"\u616e",
"\u865a":"\u865b",
"\u866b":"\u87f2",
"\u866c":"\u866f",
"\u866e":"\u87e3",
"\u8671":"\u8768",
"\u867d":"\u96d6",
"\u867e":"\u8766",
"\u867f":"\u8806",
"\u8680":"\u8755",
"\u8681":"\u87fb",
"\u8682":"\u879e",
"\u8695":"\u8836",
"\u86ac":"\u8706",
"\u86ca":"\u8831",
"\u86ce":"\u8823",
"\u86cf":"\u87f6",
"\u86ee":"\u883b",
"\u86f0":"\u87c4",
"\u86f1":"\u86fa",
"\u86f2":"\u87ef",
"\u86f3":"\u8784",
"\u86f4":"\u8810",
"\u8715":"\u86fb",
"\u8717":"\u8778",
"\u8721":"\u881f",
"\u8747":"\u8805",
"\u8748":"\u87c8",
"\u8749":"\u87ec",
"\u874e":"\u880d",
"\u8770":"\u867a",
"\u877c":"\u87bb",
"\u877e":"\u8811",
"\u87a8":"\u87ce",
"\u87cf":"\u8828",
"\u87ee":"\u87fa",
"\u8845":"\u91c1",
"\u8846":"\u773e",
"\u8854":"\u929c",
"\u8865":"\u88dc",
"\u886c":"\u896f",
"\u886e":"\u889e",
"\u8884":"\u8956",
"\u8885":"\u88ca",
"\u889c":"\u896a",
"\u88ad":"\u8972",
"\u88c5":"\u88dd",
"\u88c6":"\u8960",
"\u88cf":"\u88e1",
"\u88e2":"\u8933",
"\u88e3":"\u895d",
"\u88e4":"\u8932",
"\u88e5":"\u8949",
"\u891b":"\u8938",
"\u8934":"\u8964",
"\u89c1":"\u898b",
"\u89c2":"\u89c0",
"\u89c3":"\u898e",
"\u89c4":"\u898f",
"\u89c5":"\u8993",
"\u89c6":"\u8996",
"\u89c7":"\u8998",
"\u89c8":"\u89bd",
"\u89c9":"\u89ba",
"\u89ca":"\u89ac",
"\u89cb":"\u89a1",
"\u89cc":"\u89bf",
"\u89ce":"\u89a6",
"\u89cf":"\u89af",
"\u89d0":"\u89b2",
"\u89d1":"\u89b7",
"\u89de":"\u89f4",
"\u89e6":"\u89f8",
"\u89ef":"\u89f6",
"\u8a3c":"\u8b49",
"\u8a89":"\u8b7d",
"\u8a8a":"\u8b04",
"\u8ba1":"\u8a08",
"\u8ba2":"\u8a02",
"\u8ba3":"\u8a03",
"\u8ba4":"\u8a8d",
"\u8ba5":"\u8b4f",
"\u8ba6":"\u8a10",
"\u8ba7":"\u8a0c",
"\u8ba8":"\u8a0e",
"\u8ba9":"\u8b93",
"\u8baa":"\u8a15",
"\u8bab":"\u8a16",
"\u8bad":"\u8a13",
"\u8bae":"\u8b70",
"\u8baf":"\u8a0a",
"\u8bb0":"\u8a18",
"\u8bb2":"\u8b1b",
"\u8bb3":"\u8af1",
"\u8bb4":"\u8b33",
"\u8bb5":"\u8a4e",
"\u8bb6":"\u8a1d",
"\u8bb7":"\u8a25",
"\u8bb8":"\u8a31",
"\u8bb9":"\u8a1b",
"\u8bba":"\u8ad6",
"\u8bbb":"\u8a29",
"\u8bbc":"\u8a1f",
"\u8bbd":"\u8af7",
"\u8bbe":"\u8a2d",
"\u8bbf":"\u8a2a",
"\u8bc0":"\u8a23",
"\u8bc1":"\u8b49",
"\u8bc2":"\u8a41",
"\u8bc3":"\u8a36",
"\u8bc4":"\u8a55",
"\u8bc5":"\u8a5b",
"\u8bc6":"\u8b58",
"\u8bc7":"\u8a57",
"\u8bc8":"\u8a50",
"\u8bc9":"\u8a34",
"\u8bca":"\u8a3a",
"\u8bcb":"\u8a46",
"\u8bcc":"\u8b05",
"\u8bcd":"\u8a5e",
"\u8bce":"\u8a58",
"\u8bcf":"\u8a54",
"\u8bd1":"\u8b6f",
"\u8bd2":"\u8a52",
"\u8bd3":"\u8a86",
"\u8bd4":"\u8a84",
"\u8bd5":"\u8a66",
"\u8bd6":"\u8a7f",
"\u8bd7":"\u8a69",
"\u8bd8":"\u8a70",
"\u8bd9":"\u8a7c",
"\u8bda":"\u8aa0",
"\u8bdb":"\u8a85",
"\u8bdc":"\u8a75",
"\u8bdd":"\u8a71",
"\u8bde":"\u8a95",
"\u8bdf":"\u8a6c",
"\u8be0":"\u8a6e",
"\u8be1":"\u8a6d",
"\u8be2":"\u8a62",
"\u8be3":"\u8a63",
"\u8be4":"\u8acd",
"\u8be5":"\u8a72",
"\u8be6":"\u8a73",
"\u8be7":"\u8a6b",
"\u8be8":"\u8ae2",
"\u8be9":"\u8a61",
"\u8beb":"\u8aa1",
"\u8bec":"\u8aa3",
"\u8bed":"\u8a9e",
"\u8bee":"\u8a9a",
"\u8bef":"\u8aa4",
"\u8bf0":"\u8aa5",
"\u8bf1":"\u8a98",
"\u8bf2":"\u8aa8",
"\u8bf3":"\u8a91",
"\u8bf4":"\u8aaa",
"\u8bf5":"\u8aa6",
"\u8bf6":"\u8a92",
"\u8bf7":"\u8acb",
"\u8bf8":"\u8af8",
"\u8bf9":"\u8acf",
"\u8bfa":"\u8afe",
"\u8bfb":"\u8b80",
"\u8bfc":"\u8ad1",
"\u8bfd":"\u8ab9",
"\u8bfe":"\u8ab2",
"\u8bff":"\u8ac9",
"\u8c00":"\u8adb",
"\u8c01":"\u8ab0",
"\u8c02":"\u8ad7",
"\u8c03":"\u8abf",
"\u8c04":"\u8ac2",
"\u8c05":"\u8ad2",
"\u8c06":"\u8ac4",
"\u8c07":"\u8ab6",
"\u8c08":"\u8ac7",
"\u8c09":"\u8b85",
"\u8c0a":"\u8abc",
"\u8c0b":"\u8b00",
"\u8c0c":"\u8af6",
"\u8c0d":"\u8adc",
"\u8c0e":"\u8b0a",
"\u8c0f":"\u8aeb",
"\u8c10":"\u8ae7",
"\u8c11":"\u8b14",
"\u8c12":"\u8b01",
"\u8c13":"\u8b02",
"\u8c14":"\u8ae4",
"\u8c15":"\u8aed",
"\u8c16":"\u8afc",
"\u8c17":"\u8b92",
"\u8c18":"\u8aee",
"\u8c19":"\u8af3",
"\u8c1a":"\u8afa",
"\u8c1b":"\u8ae6",
"\u8c1c":"\u8b0e",
"\u8c1d":"\u8ade",
"\u8c1e":"\u8add",
"\u8c1f":"\u8b28",
"\u8c20":"\u8b9c",
"\u8c21":"\u8b16",
"\u8c22":"\u8b1d",
"\u8c23":"\u8b20",
"\u8c24":"\u8b17",
"\u8c25":"\u8b1a",
"\u8c26":"\u8b19",
"\u8c27":"\u8b10",
"\u8c28":"\u8b39",
"\u8c29":"\u8b3e",
"\u8c2a":"\u8b2b",
"\u8c2b":"\u8b7e",
"\u8c2c":"\u8b2c",
"\u8c2d":"\u8b5a",
"\u8c2e":"\u8b56",
"\u8c2f":"\u8b59",
"\u8c30":"\u8b95",
"\u8c31":"\u8b5c",
"\u8c32":"\u8b4e",
"\u8c33":"\u8b9e",
"\u8c34":"\u8b74",
"\u8c35":"\u8b6b",
"\u8c36":"\u8b96",
"\u8c6e":"\u8c76",
"\u8d1c":"\u8d13",
"\u8d1d":"\u8c9d",
"\u8d1e":"\u8c9e",
"\u8d1f":"\u8ca0",
"\u8d21":"\u8ca2",
"\u8d22":"\u8ca1",
"\u8d23":"\u8cac",
"\u8d24":"\u8ce2",
"\u8d25":"\u6557",
"\u8d26":"\u8cec",
"\u8d27":"\u8ca8",
"\u8d28":"\u8cea",
"\u8d29":"\u8ca9",
"\u8d2a":"\u8caa",
"\u8d2b":"\u8ca7",
"\u8d2c":"\u8cb6",
"\u8d2d":"\u8cfc",
"\u8d2e":"\u8caf",
"\u8d2f":"\u8cab",
"\u8d30":"\u8cb3",
"\u8d31":"\u8ce4",
"\u8d32":"\u8cc1",
"\u8d33":"\u8cb0",
"\u8d34":"\u8cbc",
"\u8d35":"\u8cb4",
"\u8d36":"\u8cba",
"\u8d37":"\u8cb8",
"\u8d38":"\u8cbf",
"\u8d39":"\u8cbb",
"\u8d3a":"\u8cc0",
"\u8d3b":"\u8cbd",
"\u8d3c":"\u8cca",
"\u8d3d":"\u8d04",
"\u8d3e":"\u8cc8",
"\u8d3f":"\u8cc4",
"\u8d40":"\u8cb2",
"\u8d41":"\u8cc3",
"\u8d42":"\u8cc2",
"\u8d43":"\u8d13",
"\u8d44":"\u8cc7",
"\u8d45":"\u8cc5",
"\u8d46":"\u8d10",
"\u8d47":"\u8cd5",
"\u8d48":"\u8cd1",
"\u8d49":"\u8cda",
"\u8d4a":"\u8cd2",
"\u8d4b":"\u8ce6",
"\u8d4c":"\u8ced",
"\u8d4d":"\u9f4e",
"\u8d4e":"\u8d16",
"\u8d4f":"\u8cde",
"\u8d50":"\u8cdc",
"\u8d52":"\u8cd9",
"\u8d53":"\u8ce1",
"\u8d54":"\u8ce0",
"\u8d55":"\u8ce7",
"\u8d56":"\u8cf4",
"\u8d57":"\u8cf5",
"\u8d58":"\u8d05",
"\u8d59":"\u8cfb",
"\u8d5a":"\u8cfa",
"\u8d5b":"\u8cfd",
"\u8d5c":"\u8cfe",
"\u8d5d":"\u8d0b",
"\u8d5e":"\u8d0a",
"\u8d5f":"\u8d07",
"\u8d60":"\u8d08",
"\u8d61":"\u8d0d",
"\u8d62":"\u8d0f",
"\u8d63":"\u8d1b",
"\u8d75":"\u8d99",
"\u8d76":"\u8d95",
"\u8d8b":"\u8da8",
"\u8db1":"\u8db2",
"\u8db8":"\u8e89",
"\u8dc3":"\u8e8d",
"\u8dc4":"\u8e4c",
"\u8dde":"\u8e92",
"\u8df5":"\u8e10",
"\u8df7":"\u8e7a",
"\u8df8":"\u8e55",
"\u8df9":"\u8e9a",
"\u8dfb":"\u8e8b",
"\u8e0a":"\u8e34",
"\u8e0c":"\u8e8a",
"\u8e2a":"\u8e64",
"\u8e2c":"\u8e93",
"\u8e2f":"\u8e91",
"\u8e51":"\u8ea1",
"\u8e52":"\u8e63",
"\u8e70":"\u8e95",
"\u8e7f":"\u8ea5",
"\u8e8f":"\u8eaa",
"\u8e9c":"\u8ea6",
"\u8eaf":"\u8ec0",
"\u8eb0":"\u9ad4",
"\u8f66":"\u8eca",
"\u8f67":"\u8ecb",
"\u8f68":"\u8ecc",
"\u8f69":"\u8ed2",
"\u8f6b":"\u8ed4",
"\u8f6c":"\u8f49",
"\u8f6d":"\u8edb",
"\u8f6e":"\u8f2a",
"\u8f6f":"\u8edf",
"\u8f70":"\u8f5f",
"\u8f71":"\u8ef2",
"\u8f72":"\u8efb",
"\u8f73":"\u8f64",
"\u8f74":"\u8ef8",
"\u8f75":"\u8ef9",
"\u8f76":"\u8efc",
"\u8f77":"\u8ee4",
"\u8f78":"\u8eeb",
"\u8f79":"\u8f62",
"\u8f7a":"\u8efa",
"\u8f7b":"\u8f15",
"\u8f7c":"\u8efe",
"\u8f7d":"\u8f09",
"\u8f7e":"\u8f0a",
"\u8f7f":"\u8f4e",
"\u8f81":"\u8f07",
"\u8f82":"\u8f05",
"\u8f83":"\u8f03",
"\u8f84":"\u8f12",
"\u8f85":"\u8f14",
"\u8f86":"\u8f1b",
"\u8f87":"\u8f26",
"\u8f88":"\u8f29",
"\u8f89":"\u8f1d",
"\u8f8a":"\u8f25",
"\u8f8b":"\u8f1e",
"\u8f8d":"\u8f1f",
"\u8f8e":"\u8f1c",
"\u8f8f":"\u8f33",
"\u8f90":"\u8f3b",
"\u8f91":"\u8f2f",
"\u8f93":"\u8f38",
"\u8f94":"\u8f61",
"\u8f95":"\u8f45",
"\u8f96":"\u8f44",
"\u8f97":"\u8f3e",
"\u8f98":"\u8f46",
"\u8f99":"\u8f4d",
"\u8f9a":"\u8f54",
"\u8f9e":"\u8fad",
"\u8fa9":"\u8faf",
"\u8fab":"\u8fae",
"\u8fb9":"\u908a",
"\u8fbd":"\u907c",
"\u8fbe":"\u9054",
"\u8fc1":"\u9077",
"\u8fc7":"\u904e",
"\u8fc8":"\u9081",
"\u8fd0":"\u904b",
"\u8fd8":"\u9084",
"\u8fd9":"\u9019",
"\u8fdb":"\u9032",
"\u8fdc":"\u9060",
"\u8fdd":"\u9055",
"\u8fde":"\u9023",
"\u8fdf":"\u9072",
"\u8fe9":"\u9087",
"\u8ff3":"\u9015",
"\u8ff9":"\u8de1",
"\u9002":"\u9069",
"\u9009":"\u9078",
"\u900a":"\u905c",
"\u9012":"\u905e",
"\u9026":"\u9090",
"\u903b":"\u908f",
"\u9057":"\u907a",
"\u9065":"\u9059",
"\u9093":"\u9127",
"\u909d":"\u913a",
"\u90ac":"\u9114",
"\u90ae":"\u90f5",
"\u90b9":"\u9112",
"\u90ba":"\u9134",
"\u90bb":"\u9130",
"\u90c3":"\u5408",
"\u90c4":"\u9699",
"\u90cf":"\u90df",
"\u90d0":"\u9136",
"\u90d1":"\u912d",
"\u90d3":"\u9106",
"\u90e6":"\u9148",
"\u90e7":"\u9116",
"\u90f8":"\u9132",
"\u915d":"\u919e",
"\u9171":"\u91ac",
"\u917d":"\u91c5",
"\u917e":"\u91c3",
"\u917f":"\u91c0",
"\u9196":"\u919e",
"\u91ca":"\u91cb",
"\u91cc":"\u88e1",
"\u9208":"\u923d",
"\u9221":"\u9418",
"\u9246":"\u947d",
"\u9274":"\u9451",
"\u92ae":"\u947e",
"\u92bc":"\u5249",
"\u92fb":"\u9451",
"\u9318":"\u939a",
"\u9332":"\u9304",
"\u933e":"\u93e8",
"\u9452":"\u9451",
"\u9486":"\u91d3",
"\u9487":"\u91d4",
"\u9488":"\u91dd",
"\u9489":"\u91d8",
"\u948a":"\u91d7",
"\u948b":"\u91d9",
"\u948c":"\u91d5",
"\u948d":"\u91f7",
"\u948e":"\u91fa",
"\u948f":"\u91e7",
"\u9490":"\u91e4",
"\u9492":"\u91e9",
"\u9493":"\u91e3",
"\u9494":"\u9346",
"\u9495":"\u91f9",
"\u9496":"\u935a",
"\u9497":"\u91f5",
"\u9498":"\u9203",
"\u9499":"\u9223",
"\u949a":"\u9208",
"\u949b":"\u9226",
"\u949c":"\u9245",
"\u949d":"\u920d",
"\u949e":"\u9214",
"\u949f":"\u9418",
"\u94a0":"\u9209",
"\u94a1":"\u92c7",
"\u94a2":"\u92fc",
"\u94a3":"\u9211",
"\u94a4":"\u9210",
"\u94a5":"\u9470",
"\u94a6":"\u6b3d",
"\u94a7":"\u921e",
"\u94a8":"\u93a2",
"\u94a9":"\u9264",
"\u94aa":"\u9227",
"\u94ab":"\u9201",
"\u94ac":"\u9225",
"\u94ad":"\u9204",
"\u94ae":"\u9215",
"\u94af":"\u9200",
"\u94b0":"\u923a",
"\u94b1":"\u9322",
"\u94b2":"\u9266",
"\u94b3":"\u9257",
"\u94b4":"\u9237",
"\u94b5":"\u7f3d",
"\u94b6":"\u9233",
"\u94b7":"\u9255",
"\u94b8":"\u923d",
"\u94b9":"\u9238",
"\u94ba":"\u925e",
"\u94bb":"\u947d",
"\u94bc":"\u926c",
"\u94bd":"\u926d",
"\u94be":"\u9240",
"\u94bf":"\u923f",
"\u94c0":"\u923e",
"\u94c1":"\u9435",
"\u94c2":"\u9251",
"\u94c3":"\u9234",
"\u94c4":"\u9460",
"\u94c5":"\u925b",
"\u94c6":"\u925a",
"\u94c8":"\u9230",
"\u94c9":"\u9249",
"\u94ca":"\u9248",
"\u94cb":"\u924d",
"\u94cc":"\u922e",
"\u94cd":"\u9239",
"\u94ce":"\u9438",
"\u94cf":"\u9276",
"\u94d0":"\u92ac",
"\u94d1":"\u92a0",
"\u94d2":"\u927a",
"\u94d3":"\u92e9",
"\u94d5":"\u92aa",
"\u94d6":"\u92ee",
"\u94d7":"\u92cf",
"\u94d8":"\u92e3",
"\u94d9":"\u9403",
"\u94db":"\u943a",
"\u94dc":"\u9285",
"\u94dd":"\u92c1",
"\u94de":"\u92b1",
"\u94df":"\u92a6",
"\u94e0":"\u93a7",
"\u94e1":"\u9358",
"\u94e2":"\u9296",
"\u94e3":"\u9291",
"\u94e4":"\u92cc",
"\u94e5":"\u92a9",
"\u94e7":"\u93f5",
"\u94e8":"\u9293",
"\u94e9":"\u93a9",
"\u94ea":"\u927f",
"\u94eb":"\u929a",
"\u94ec":"\u927b",
"\u94ed":"\u9298",
"\u94ee":"\u931a",
"\u94ef":"\u92ab",
"\u94f0":"\u9278",
"\u94f1":"\u92a5",
"\u94f2":"\u93df",
"\u94f3":"\u9283",
"\u94f4":"\u940b",
"\u94f5":"\u92a8",
"\u94f6":"\u9280",
"\u94f7":"\u92a3",
"\u94f8":"\u9444",
"\u94f9":"\u9412",
"\u94fa":"\u92ea",
"\u94fc":"\u9338",
"\u94fd":"\u92f1",
"\u94fe":"\u93c8",
"\u94ff":"\u93d7",
"\u9500":"\u92b7",
"\u9501":"\u9396",
"\u9502":"\u92f0",
"\u9503":"\u92e5",
"\u9504":"\u92e4",
"\u9505":"\u934b",
"\u9506":"\u92ef",
"\u9507":"\u92e8",
"\u9508":"\u93fd",
"\u9509":"\u92bc",
"\u950a":"\u92dd",
"\u950b":"\u92d2",
"\u950c":"\u92c5",
"\u950d":"\u92f6",
"\u950e":"\u9426",
"\u950f":"\u9427",
"\u9510":"\u92b3",
"\u9511":"\u92bb",
"\u9512":"\u92c3",
"\u9513":"\u92df",
"\u9514":"\u92e6",
"\u9515":"\u9312",
"\u9516":"\u9306",
"\u9517":"\u937a",
"\u9518":"\u9369",
"\u9519":"\u932f",
"\u951a":"\u9328",
"\u951b":"\u931b",
"\u951c":"\u9321",
"\u951d":"\u9340",
"\u951e":"\u9301",
"\u951f":"\u9315",
"\u9521":"\u932b",
"\u9522":"\u932e",
"\u9523":"\u947c",
"\u9524":"\u9318",
"\u9525":"\u9310",
"\u9526":"\u9326",
"\u9527":"\u9455",
"\u9528":"\u9341",
"\u9529":"\u9308",
"\u952a":"\u9343",
"\u952b":"\u9307",
"\u952c":"\u931f",
"\u952d":"\u9320",
"\u952e":"\u9375",
"\u952f":"\u92f8",
"\u9530":"\u9333",
"\u9531":"\u9319",
"\u9532":"\u9365",
"\u9534":"\u9347",
"\u9535":"\u93d8",
"\u9536":"\u9376",
"\u9537":"\u9354",
"\u9538":"\u9364",
"\u9539":"\u936c",
"\u953a":"\u937e",
"\u953b":"\u935b",
"\u953c":"\u93aa",
"\u953e":"\u9370",
"\u953f":"\u9384",
"\u9540":"\u934d",
"\u9541":"\u9382",
"\u9542":"\u93e4",
"\u9543":"\u93a1",
"\u9544":"\u9428",
"\u9545":"\u9387",
"\u9546":"\u93cc",
"\u9547":"\u93ae",
"\u9549":"\u9398",
"\u954a":"\u9477",
"\u954b":"\u9482",
"\u954c":"\u942b",
"\u954d":"\u93b3",
"\u954e":"\u93bf",
"\u954f":"\u93a6",
"\u9550":"\u93ac",
"\u9551":"\u938a",
"\u9552":"\u93b0",
"\u9553":"\u93b5",
"\u9554":"\u944c",
"\u9555":"\u9394",
"\u9556":"\u93e2",
"\u9557":"\u93dc",
"\u9558":"\u93dd",
"\u9559":"\u93cd",
"\u955a":"\u93f0",
"\u955b":"\u93de",
"\u955c":"\u93e1",
"\u955d":"\u93d1",
"\u955e":"\u93c3",
"\u955f":"\u93c7",
"\u9561":"\u9414",
"\u9562":"\u941d",
"\u9563":"\u9410",
"\u9564":"\u93f7",
"\u9565":"\u9465",
"\u9566":"\u9413",
"\u9567":"\u946d",
"\u9568":"\u9420",
"\u9569":"\u9479",
"\u956a":"\u93f9",
"\u956b":"\u9419",
"\u956c":"\u944a",
"\u956d":"\u9433",
"\u956e":"\u9436",
"\u956f":"\u9432",
"\u9570":"\u942e",
"\u9571":"\u943f",
"\u9572":"\u9454",
"\u9573":"\u9463",
"\u9574":"\u945e",
"\u9576":"\u9472",
"\u957f":"\u9577",
"\u9591":"\u9592",
"\u95a7":"\u9b28",
"\u95e8":"\u9580",
"\u95e9":"\u9582",
"\u95ea":"\u9583",
"\u95eb":"\u9586",
"\u95ed":"\u9589",
"\u95ee":"\u554f",
"\u95ef":"\u95d6",
"\u95f0":"\u958f",
"\u95f1":"\u95c8",
"\u95f2":"\u9592",
"\u95f3":"\u958e",
"\u95f4":"\u9593",
"\u95f5":"\u9594",
"\u95f6":"\u958c",
"\u95f7":"\u60b6",
"\u95f8":"\u9598",
"\u95f9":"\u9b27",
"\u95fa":"\u95a8",
"\u95fb":"\u805e",
"\u95fc":"\u95e5",
"\u95fd":"\u95a9",
"\u95fe":"\u95ad",
"\u95ff":"\u95d3",
"\u9600":"\u95a5",
"\u9601":"\u95a3",
"\u9602":"\u95a1",
"\u9603":"\u95ab",
"\u9604":"\u9b2e",
"\u9605":"\u95b1",
"\u9606":"\u95ac",
"\u9608":"\u95be",
"\u9609":"\u95b9",
"\u960a":"\u95b6",
"\u960b":"\u9b29",
"\u960c":"\u95bf",
"\u960d":"\u95bd",
"\u960e":"\u95bb",
"\u960f":"\u95bc",
"\u9610":"\u95e1",
"\u9611":"\u95cc",
"\u9612":"\u95c3",
"\u9614":"\u95ca",
"\u9615":"\u95cb",
"\u9616":"\u95d4",
"\u9617":"\u95d0",
"\u9619":"\u95d5",
"\u961a":"\u95de",
"\u961f":"\u968a",
"\u9633":"\u967d",
"\u9634":"\u9670",
"\u9635":"\u9663",
"\u9636":"\u968e",
"\u9645":"\u969b",
"\u9646":"\u9678",
"\u9647":"\u96b4",
"\u9648":"\u9673",
"\u9649":"\u9658",
"\u9655":"\u965d",
"\u9667":"\u9689",
"\u9668":"\u9695",
"\u9669":"\u96aa",
"\u968f":"\u96a8",
"\u9690":"\u96b1",
"\u96b6":"\u96b8",
"\u96bd":"\u96cb",
"\u96be":"\u96e3",
"\u96cf":"\u96db",
"\u96e0":"\u8b8e",
"\u96f3":"\u9742",
"\u96fe":"\u9727",
"\u9701":"\u973d",
"\u9709":"\u9ef4",
"\u972d":"\u9744",
"\u9753":"\u975a",
"\u9759":"\u975c",
"\u9763":"\u9762",
"\u9765":"\u9768",
"\u9791":"\u97c3",
"\u9792":"\u6a47",
"\u97af":"\u97c9",
"\u97e6":"\u97cb",
"\u97e7":"\u97cc",
"\u97e8":"\u97cd",
"\u97e9":"\u97d3",
"\u97ea":"\u97d9",
"\u97eb":"\u97de",
"\u97ec":"\u97dc",
"\u97f5":"\u97fb",
"\u9875":"\u9801",
"\u9876":"\u9802",
"\u9877":"\u9803",
"\u9878":"\u9807",
"\u9879":"\u9805",
"\u987a":"\u9806",
"\u987b":"\u9808",
"\u987c":"\u980a",
"\u987d":"\u9811",
"\u987e":"\u9867",
"\u987f":"\u9813",
"\u9880":"\u980e",
"\u9881":"\u9812",
"\u9882":"\u980c",
"\u9883":"\u980f",
"\u9884":"\u9810",
"\u9885":"\u9871",
"\u9886":"\u9818",
"\u9887":"\u9817",
"\u9888":"\u9838",
"\u9889":"\u9821",
"\u988a":"\u9830",
"\u988b":"\u9832",
"\u988c":"\u981c",
"\u988d":"\u6f41",
"\u988f":"\u9826",
"\u9890":"\u9824",
"\u9891":"\u983b",
"\u9893":"\u9839",
"\u9894":"\u9837",
"\u9896":"\u7a4e",
"\u9897":"\u9846",
"\u9898":"\u984c",
"\u9899":"\u9852",
"\u989a":"\u984e",
"\u989b":"\u9853",
"\u989c":"\u984f",
"\u989d":"\u984d",
"\u989e":"\u9873",
"\u989f":"\u9862",
"\u98a0":"\u985b",
"\u98a1":"\u9859",
"\u98a2":"\u9865",
"\u98a4":"\u986b",
"\u98a5":"\u986c",
"\u98a6":"\u9870",
"\u98a7":"\u9874",
"\u98ce":"\u98a8",
"\u98d1":"\u98ae",
"\u98d2":"\u98af",
"\u98d3":"\u98b6",
"\u98d4":"\u98b8",
"\u98d5":"\u98bc",
"\u98d7":"\u98c0",
"\u98d8":"\u98c4",
"\u98d9":"\u98c6",
"\u98da":"\u98c8",
"\u98de":"\u98db",
"\u98e8":"\u9957",
"\u990d":"\u995c",
"\u9965":"\u98e2",
"\u9966":"\u98e5",
"\u9967":"\u9933",
"\u9968":"\u98e9",
"\u9969":"\u993c",
"\u996a":"\u98ea",
"\u996b":"\u98eb",
"\u996c":"\u98ed",
"\u996d":"\u98ef",
"\u996e":"\u98f2",
"\u996f":"\u991e",
"\u9970":"\u98fe",
"\u9971":"\u98fd",
"\u9972":"\u98fc",
"\u9973":"\u98ff",
"\u9974":"\u98f4",
"\u9975":"\u990c",
"\u9976":"\u9952",
"\u9977":"\u9909",
"\u9978":"\u9904",
"\u9979":"\u990e",
"\u997a":"\u9903",
"\u997b":"\u990f",
"\u997c":"\u9905",
"\u997d":"\u9911",
"\u997f":"\u9913",
"\u9980":"\u9918",
"\u9981":"\u9912",
"\u9983":"\u991c",
"\u9984":"\u991b",
"\u9985":"\u9921",
"\u9986":"\u9928",
"\u9987":"\u9937",
"\u9988":"\u994b",
"\u9989":"\u9936",
"\u998a":"\u993f",
"\u998b":"\u995e",
"\u998d":"\u9943",
"\u998e":"\u993a",
"\u998f":"\u993e",
"\u9990":"\u9948",
"\u9991":"\u9949",
"\u9992":"\u9945",
"\u9993":"\u994a",
"\u9994":"\u994c",
"\u9995":"\u995f",
"\u9a03":"\u5446",
"\u9a6c":"\u99ac",
"\u9a6d":"\u99ad",
"\u9a6e":"\u99b1",
"\u9a6f":"\u99b4",
"\u9a70":"\u99b3",
"\u9a71":"\u9a45",
"\u9a73":"\u99c1",
"\u9a74":"\u9a62",
"\u9a75":"\u99d4",
"\u9a76":"\u99db",
"\u9a77":"\u99df",
"\u9a78":"\u99d9",
"\u9a79":"\u99d2",
"\u9a7a":"\u9a36",
"\u9a7b":"\u99d0",
"\u9a7c":"\u99dd",
"\u9a7d":"\u99d1",
"\u9a7e":"\u99d5",
"\u9a7f":"\u9a5b",
"\u9a80":"\u99d8",
"\u9a81":"\u9a4d",
"\u9a82":"\u7f75",
"\u9a84":"\u9a55",
"\u9a85":"\u9a4a",
"\u9a86":"\u99f1",
"\u9a87":"\u99ed",
"\u9a88":"\u99e2",
"\u9a8a":"\u9a6a",
"\u9a8b":"\u9a01",
"\u9a8c":"\u9a57",
"\u9a8e":"\u99f8",
"\u9a8f":"\u99ff",
"\u9a90":"\u9a0f",
"\u9a91":"\u9a0e",
"\u9a92":"\u9a0d",
"\u9a93":"\u9a05",
"\u9a96":"\u9a42",
"\u9a97":"\u9a19",
"\u9a98":"\u9a2d",
"\u9a9a":"\u9a37",
"\u9a9b":"\u9a16",
"\u9a9c":"\u9a41",
"\u9a9d":"\u9a2e",
"\u9a9e":"\u9a2b",
"\u9a9f":"\u9a38",
"\u9aa0":"\u9a43",
"\u9aa1":"\u9a3e",
"\u9aa2":"\u9a44",
"\u9aa3":"\u9a4f",
"\u9aa4":"\u9a5f",
"\u9aa5":"\u9a65",
"\u9aa7":"\u9a64",
"\u9ac5":"\u9acf",
"\u9acb":"\u9ad6",
"\u9acc":"\u9ad5",
"\u9b13":"\u9b22",
"\u9b47":"\u9b58",
"\u9b49":"\u9b4e",
"\u9c7c":"\u9b5a",
"\u9c7d":"\u9b5b",
"\u9c7f":"\u9b77",
"\u9c81":"\u9b6f",
"\u9c82":"\u9b74",
"\u9c85":"\u9b81",
"\u9c86":"\u9b83",
"\u9c87":"\u9bf0",
"\u9c88":"\u9c78",
"\u9c8a":"\u9b93",
"\u9c8b":"\u9b92",
"\u9c8d":"\u9b91",
"\u9c8e":"\u9c5f",
"\u9c8f":"\u9b8d",
"\u9c90":"\u9b90",
"\u9c91":"\u9bad",
"\u9c92":"\u9b9a",
"\u9c94":"\u9baa",
"\u9c95":"\u9b9e",
"\u9c96":"\u9ba6",
"\u9c97":"\u9c02",
"\u9c99":"\u9c60",
"\u9c9a":"\u9c6d",
"\u9c9b":"\u9bab",
"\u9c9c":"\u9bae",
"\u9c9d":"\u9bba",
"\u9c9e":"\u9bd7",
"\u9c9f":"\u9c58",
"\u9ca0":"\u9bc1",
"\u9ca1":"\u9c7a",
"\u9ca2":"\u9c31",
"\u9ca3":"\u9c39",
"\u9ca4":"\u9bc9",
"\u9ca5":"\u9c23",
"\u9ca6":"\u9c37",
"\u9ca7":"\u9bc0",
"\u9ca8":"\u9bca",
"\u9ca9":"\u9bc7",
"\u9cab":"\u9bfd",
"\u9cad":"\u9bd6",
"\u9cae":"\u9bea",
"\u9cb0":"\u9beb",
"\u9cb1":"\u9be1",
"\u9cb2":"\u9be4",
"\u9cb3":"\u9be7",
"\u9cb4":"\u9bdd",
"\u9cb5":"\u9be2",
"\u9cb6":"\u9bf0",
"\u9cb7":"\u9bdb",
"\u9cb8":"\u9be8",
"\u9cba":"\u9bf4",
"\u9cbb":"\u9bd4",
"\u9cbc":"\u9c5d",
"\u9cbd":"\u9c08",
"\u9cbf":"\u9c68",
"\u9cc1":"\u9c1b",
"\u9cc3":"\u9c13",
"\u9cc4":"\u9c77",
"\u9cc5":"\u9c0d",
"\u9cc6":"\u9c12",
"\u9cc7":"\u9c09",
"\u9cca":"\u9bff",
"\u9ccb":"\u9c20",
"\u9ccc":"\u9c32",
"\u9ccd":"\u9c2d",
"\u9cce":"\u9c28",
"\u9ccf":"\u9c25",
"\u9cd0":"\u9c29",
"\u9cd1":"\u9c1f",
"\u9cd2":"\u9c1c",
"\u9cd3":"\u9c33",
"\u9cd4":"\u9c3e",
"\u9cd5":"\u9c48",
"\u9cd6":"\u9c49",
"\u9cd7":"\u9c3b",
"\u9cd8":"\u9c35",
"\u9cd9":"\u9c45",
"\u9cdb":"\u9c3c",
"\u9cdc":"\u9c56",
"\u9cdd":"\u9c54",
"\u9cde":"\u9c57",
"\u9cdf":"\u9c52",
"\u9ce2":"\u9c67",
"\u9ce3":"\u9c63",
"\u9d8f":"\u96de",
"\u9dc4":"\u96de",
"\u9e1f":"\u9ce5",
"\u9e20":"\u9ce9",
"\u9e21":"\u96de",
"\u9e22":"\u9cf6",
"\u9e23":"\u9cf4",
"\u9e25":"\u9dd7",
"\u9e26":"\u9d09",
"\u9e27":"\u9dac",
"\u9e28":"\u9d07",
"\u9e29":"\u9d06",
"\u9e2a":"\u9d23",
"\u9e2b":"\u9d87",
"\u9e2c":"\u9e15",
"\u9e2d":"\u9d28",
"\u9e2e":"\u9d1e",
"\u9e2f":"\u9d26",
"\u9e30":"\u9d12",
"\u9e31":"\u9d1f",
"\u9e32":"\u9d1d",
"\u9e33":"\u9d1b",
"\u9e35":"\u9d15",
"\u9e36":"\u9de5",
"\u9e37":"\u9dd9",
"\u9e38":"\u9d2f",
"\u9e39":"\u9d30",
"\u9e3a":"\u9d42",
"\u9e3b":"\u9d34",
"\u9e3c":"\u9d43",
"\u9e3d":"\u9d3f",
"\u9e3e":"\u9e1e",
"\u9e3f":"\u9d3b",
"\u9e41":"\u9d53",
"\u9e42":"\u9e1d",
"\u9e43":"\u9d51",
"\u9e44":"\u9d60",
"\u9e45":"\u9d5d",
"\u9e46":"\u9d52",
"\u9e47":"\u9df4",
"\u9e48":"\u9d5c",
"\u9e49":"\u9d61",
"\u9e4a":"\u9d72",
"\u9e4b":"\u9d93",
"\u9e4c":"\u9d6a",
"\u9e4e":"\u9d6f",
"\u9e4f":"\u9d6c",
"\u9e50":"\u9d6e",
"\u9e51":"\u9d89",
"\u9e52":"\u9d8a",
"\u9e55":"\u9d98",
"\u9e56":"\u9da1",
"\u9e57":"\u9d9a",
"\u9e58":"\u9dbb",
"\u9e59":"\u9d96",
"\u9e5a":"\u9dbf",
"\u9e5b":"\u9da5",
"\u9e5c":"\u9da9",
"\u9e5e":"\u9dc2",
"\u9e61":"\u9dba",
"\u9e63":"\u9dbc",
"\u9e64":"\u9db4",
"\u9e65":"\u9dd6",
"\u9e66":"\u9e1a",
"\u9e67":"\u9dd3",
"\u9e68":"\u9dda",
"\u9e69":"\u9def",
"\u9e6a":"\u9de6",
"\u9e6b":"\u9df2",
"\u9e6c":"\u9df8",
"\u9e6d":"\u9dfa",
"\u9e6f":"\u9e07",
"\u9e70":"\u9df9",
"\u9e71":"\u9e0c",
"\u9e73":"\u9e1b",
"\u9e7e":"\u9e7a",
"\u9ea6":"\u9ea5",
"\u9eb8":"\u9ea9",
"\u9ebd":"\u9ebc",
"\u9ec4":"\u9ec3",
"\u9ec9":"\u9ecc",
"\u9ee1":"\u9ef6",
"\u9ee9":"\u9ef7",
"\u9eea":"\u9ef2",
"\u9efe":"\u9efd",
"\u9f0b":"\u9eff",
"\u9f0d":"\u9f09",
"\u9f39":"\u9f34",
"\u9f50":"\u9f4a",
"\u9f51":"\u9f4f",
"\u9f76":"\u984e",
"\u9f7f":"\u9f52",
"\u9f80":"\u9f54",
"\u9f83":"\u9f5f",
"\u9f84":"\u9f61",
"\u9f85":"\u9f59",
"\u9f86":"\u9f60",
"\u9f87":"\u9f5c",
"\u9f88":"\u9f66",
"\u9f89":"\u9f6c",
"\u9f8a":"\u9f6a",
"\u9f8b":"\u9f72",
"\u9f8c":"\u9f77",
"\u9f99":"\u9f8d",
"\u9f9a":"\u9f94",
"\u9f9b":"\u9f95",
"\u9f9f":"\u9f9c",
};

TongWen.t_2_s = Object.fromEntries(Object.entries(TongWen.s_2_t).map(x => [x[1], x[0]]))

exports.TongWen = TongWen

},{}]},{},[1]);
