(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/src/expensivecamera.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
  "use strict";
  var Packrat;
  Packrat = require('../lib/Packrat');
  var Excam;
  Excam = function () {
    if (this.init) {
      this.init.apply(this, arguments);
    }
  };
  Excam.__super = Packrat.prototype;
  Excam.prototype = new Packrat();
  Excam.prototype.space = function () {
    var _this = this;
    return _this.cacheaParser('space', function () {
      return _this.regex(new RegExp('^[\\s\\n\\t]+'));
    });
  };
  Excam.prototype.skipSpace = function () {
    var _this = this;
    return _this.optional(function () {
      return _this.space();
    });
  };
  Excam.prototype.symbol = function () {
    var _this = this;
    return _this.cacheaParser('symbol', function () {
      return _this.regex(new RegExp('^[a-zA-Z_$][a-zA-Z0-9_$]*'));
    });
  };
  Excam.prototype.identifier = function () {
    var _this = this;
    return _this.cacheaParser('identifier', function () {
      return _this.many1(function () {
        return _this.satisfyChar(function (c) {
          return (c.search(/[\s\n\t]/) === -1);
        });
      });
    });
  };
  Excam.prototype.equal = function () {
    var _this = this;
    return _this.cacheaParser('equal', function () {
      return _this.string('==');
    });
  };
  Excam.prototype.rightArrow = function () {
    var _this = this;
    return _this.cacheaParser('rightArrow', function () {
      return _this.string('->');
    });
  };
  Excam.prototype.lambda = function () {
    var _this = this;
    return _this.cacheaParser('lambda', function () {
      return _this.betweenandaccept((function () {
        return _this.chr('[');
      }), (function () {
        _this.skipSpace();
        return _this.chr(']');
      }), function () {
        return _this.try_([function () {
          var s;
          s = (('function () { return ' + _this.expression()) + ' }');
          _this.skipSpace();
          _this.followedBy(function () {
            return _this.chr(']');
          });
          return s;
        }, function () {
          return _this.lambdaBody();
        }]);
      });
    });
  };
  Excam.prototype.lambdaBody = function () {
    var _this = this;
    return _this.cacheaParser('lambdaBody', function () {
      var exp;
      _this.skipSpace();
      return _this.try_([function () {
        var f;
        f = (('function (' + _this.symbol()) + ') { return ');
        _this.skipSpace();
        _this.rightArrow();
        (f += (_this.lambdaBody() + ' }'));
        return f;
      }, function () {
        return _this.expression();
      }]);
    });
  };
  Excam.prototype.primary = function () {
    var _this = this;
    return _this.cacheaParser('primary', function () {
      return _this.try_([function () {
        return _this.symbol();
      }, function () {
        return _this.literal();
      }, function () {
        return _this.lambda();
      }]);
    });
  };
  Excam.prototype.selector = function () {
    var _this = this;
    return _this.cacheaParser('selector', function () {
      _this.chr('.');
      return (('\'' + _this.identifier()) + '\'');
    });
  };
  Excam.prototype.methodInvocation = function () {
    var _this = this;
    return _this.cacheaParser('methodInvocation', function () {
      var selector, arg;
      _this.skipSpace();
      selector = _this.selector();
      _this.space();
      arg = _this.optional(function () {
        return _this.expression();
      });
      _this.skipSpace();
      return (((('[' + selector) + '](') + arg) + ')');
    });
  };
  Excam.prototype.funcall = function () {
    var _this = this;
    return _this.cacheaParser('funcall', function () {
      var arg;
      _this.skipSpace();
      arg = _this.expression();
      return (('(' + arg) + ')');
    });
  };
  Excam.prototype.message = function () {
    var _this = this;
    return _this.cacheaParser('message', function () {
      var receiver, mes;
      _this.chr('(');
      _this.skipSpace();
      receiver = _this.primary();
      _this.space();
      mes = _this.many(function () {
        return _this.try_([function () {
          return _this.methodInvocation();
        }, function () {
          return _this.funcall();
        }]);
      });
      _this.skipSpace();
      _this.chr(')');
      return (receiver + mes);
    });
  };
  Excam.prototype.expression = function () {
    var _this = this;
    return _this.cacheaParser('expression', function () {
      return _this.try_([function () {
        return _this.message();
      }, function () {
        return _this.primary();
      }]);
    });
  };
  Excam.prototype.numberLit = function () {
    var _this = this;
    return _this.cacheaParser('numberLit', function () {
      return _this.regex(new RegExp('^-?[0-9]+(\\.?[0-9]+)?'));
    });
  };
  Excam.prototype.stringLit = function () {
    var _this = this;
    return _this.cacheaParser('stringLit', function () {
      var str;
      str = _this.betweenandaccept((function () {
        return _this.chr('\'');
      }), (function () {
        return _this.chr('\'');
      }), function () {
        var c;
        c = _this.anyChar();
        return (c === '\\') ? ((function () {
          return (c + _this.anyChar());
        }))() : (function () {
          return c;
        })();
      });
      str = str.replace(/\n/g, '\\n');
      return (('\'' + str) + '\'');
    });
  };
  Excam.prototype.literal = function () {
    var _this = this;
    return _this.cacheaParser('literal', function () {
      return _this.try_([function () {
        return _this.numberLit();
      }, function () {
        return _this.stringLit();
      }]);
    });
  };
  Excam.prototype.declaration = function () {
    var _this = this;
    return _this.cacheaParser('declaration', function () {
      var v, exp;
      _this.skipSpace();
      v = _this.symbol();
      _this.skipSpace();
      _this.string('==');
      _this.skipSpace();
      exp = _this.expression();
      return (((('var ' + v) + ' = ') + exp) + ';');
    });
  };
  Excam.prototype.program = function () {
    var _this = this;
    return _this.cacheaParser('program', function () {
      var decs, exp;
      decs = _this.many(function () {
        return _this.declaration();
      });
      _this.skipSpace();
      exp = (_this.optional(function () {
        return _this.expression();
      }) || '');
      return (decs + exp);
    });
  };
  Excam.parse = function (str) {
    var excam;
    excam = new Excam(str);
    return excam.program();
  };
  module.exports = Excam;
  return Excam;
}).call(this);
});

require.define("/lib/Packrat.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
  "use strict";
  require('./prelude');
  Number.prototype.timesString = function (str) {
    var _this = this;
    var ret;
    ret = '';
    _this.timesRepeat(function (i) {
      return (ret += str);
    });
    return ret;
  };
  var Packrat;
  Packrat = function () {
    this.input = null;
    this.index = null;
    this.cache = null;
    this.maxIndex = null;
    this.logNest = null;
    this.stackTrace = null;
    if (this.init) {
      this.init.apply(this, arguments);
    }
  };
  Packrat.__super = Object.prototype;
  Packrat.prototype = new Object();
  Packrat.prototype.init = function (text) {
    var _this = this;
    _this.input = text;
    _this.index = 0;
    _this.cache = {};
    _this.maxIndex = 0;
    _this.logNest = -1;
    return _this.stackTrace = '';
  };
  Packrat.prototype.getIndex = function () {
    var _this = this;
    return _this.index;
  };
  Packrat.prototype.getMaxIndex = function () {
    var _this = this;
    return _this.maxIndex;
  };
  Packrat.prototype.getInputLength = function () {
    var _this = this;
    return _this.input.size();
  };
  Packrat.prototype.getStackTrace = function () {
    var _this = this;
    return _this.stackTrace;
  };
  Packrat.prototype.cacheaParser = function (s, fn) {
    var _this = this;
    var c, slot, logIndent;
    fn = (fn !== undefined) ? ((function () {
      return fn;
    }))() : (function () {
      return function () {
        return null;
      };
    })();
    c = {};
    (_this.logNest += 1);
    logIndent = _this.logNest.timesString('  ');
    (_this.stackTrace += (((((logIndent + 'ENTER : ') + s) + ' : ') + _this.input.substring(_this.index)) + '\n'));
    (function () {
      var _ret;
      try {
        _ret = (function () {
          return (_this.cache[s] === undefined) ? (_this.cache[s] = {})() : void 0;
        })();
      } catch (err) {
        _ret = function () {
          return _this.cache[s] = {};
        }(err);
      }
      return _ret;
    })();
    slot = _this.cache[s][_this.index];
    return ((slot !== undefined) && (slot !== null)) ? ((function () {
      c = slot;
      _this.index = c.idx;
      (_this.index > _this.maxIndex) ? (function () {
        return _this.maxIndex = _this.index;
      })() : void 0;
      (_this.stackTrace += (((((logIndent + 'CACHED: ') + s) + ' : ') + c.fn) + '\n'));
      (_this.logNest -= 1);
      return c.fn;
    }))() : (function () {
      return (function () {
        var _ret;
        try {
          _ret = (function () {
            c.idx = _this.index;
            c.fn = fn.call(_this);
            _this.cache[s][c.idx] = {
              'fn': c.fn,
              'idx': _this.index
            };
            (_this.index > _this.maxIndex) ? (function () {
              return _this.maxIndex = _this.index;
            })() : void 0;
            (_this.stackTrace += (((((logIndent + 'PASS  : ') + s) + ' : ') + c.fn) + '\n'));
            (_this.logNest -= 1);
            return c.fn;
          })();
        } catch (err) {
          _ret = function (err) {
            _this.cache[s][c.idx] = null;
            (_this.stackTrace += (((logIndent + 'FAIL  : ') + s) + '\n'));
            (_this.logNest -= 1);
            return _this.noParse();
          }(err);
        }
        return _ret;
      })();
    })();
  };
  Packrat.prototype.noParse = function () {
    var _this = this;
    return _this.error(('Parse error at:' + _this.index));
  };
  Packrat.prototype.try_ = function (parsers) {
    var _this = this;
    var ret, i;
    i = _this.index;
    parsers.do_(function (parser) {
      return (ret === undefined) ? (function () {
        return (function () {
          var _ret;
          try {
            _ret = (function () {
              return ret = parser.call(_this);
            })();
          } catch (err) {
            _ret = function () {
              return _this.index = i;
            }(err);
          }
          return _ret;
        })();
      })() : void 0;
    });
    return (ret !== undefined) ? ((function () {
      return ret;
    }))() : (function () {
      return _this.noParse();
    })();
  };
  Packrat.prototype.sequence = function (parsers) {
    var _this = this;
    var ret, i, fail;
    i = _this.index;
    ret = '';
    fail = false;
    parsers.do_(function (parser) {
      return fail ? void 0 : (function () {
        return (function () {
          var _ret;
          try {
            _ret = (function () {
              return (ret += parser.call(_this));
            })();
          } catch (err) {
            _ret = function (err) {
              _this.index = i;
              fail = true;
              return _this.noParse();
            }(err);
          }
          return _ret;
        })();
      })();
    });
    return fail ? (function () {
      return _this.noParse();
    })() : ((function () {
      return ret;
    }))();
  };
  Packrat.prototype.optional = function (parser) {
    var _this = this;
    var ret, i;
    i = _this.index;
    return (function () {
      var _ret;
      try {
        _ret = (function () {
          return parser.call(_this);
        })();
      } catch (err) {
        _ret = function () {
          _this.index = i;
          return '';
        }(err);
      }
      return _ret;
    })();
  };
  Packrat.prototype.followedBy = function (parser) {
    var _this = this;
    var f, i;
    f = true;
    i = _this.index;
    (function () {
      var _ret;
      try {
        _ret = (function () {
          parser.call(_this);
          return f = false;
        })();
      } catch (err) {
        _ret = function () {
          return null;
        }(err);
      }
      return _ret;
    })();
    _this.index = i;
    return f ? ((function () {
      return _this.noParse();
    }))() : (function () {
      return null;
    })();
  };
  Packrat.prototype.notFollowedBy = function (parser) {
    var _this = this;
    var f, i;
    f = false;
    i = _this.index;
    (function () {
      var _ret;
      try {
        _ret = (function () {
          parser.call(_this);
          return f = true;
        })();
      } catch (err) {
        _ret = function () {
          return null;
        }(err);
      }
      return _ret;
    })();
    _this.index = i;
    return f ? ((function () {
      return _this.noParse();
    }))() : (function () {
      return null;
    })();
  };
  Packrat.prototype.many = function (parser) {
    var _this = this;
    var a;
    return _this.try_([function () {
      return _this.many1(function () {
        return parser.call(_this);
      });
    }, function () {
      return '';
    }]);
  };
  Packrat.prototype.many1 = function (parser) {
    var _this = this;
    var v, vs;
    v = parser.call(_this);
    vs = _this.many(function () {
      return parser.call(_this);
    });
    return (v + vs);
  };
  Packrat.prototype.betweenandaccept = function (start, end, inbetween) {
    var _this = this;
    var ret;
    _this.sequence([start, function () {
      return ret = _this.many(function () {
        _this.notFollowedBy(end);
        return inbetween.call(_this);
      });
    },
    end]);
    return ret;
  };
  Packrat.prototype.anyChar = function () {
    var _this = this;
    var c;
    c = _this.input[_this.index];
    (_this.index += 1);
    return (c !== undefined) ? ((function () {
      return c;
    }))() : (function () {
      return _this.noParse();
    })();
  };
  Packrat.prototype.satisfyChar = function (fn) {
    var _this = this;
    var c;
    c = _this.anyChar();
    return fn(c) ? ((function () {
      return c;
    }))() : (function () {
      return _this.noParse();
    })();
  };
  Packrat.prototype.chr = function (ch) {
    var _this = this;
    var c;
    c = _this.anyChar();
    return (c === ch) ? ((function () {
      return c;
    }))() : (function () {
      return _this.noParse();
    })();
  };
  Packrat.prototype.string = function (str) {
    var _this = this;
    return (_this.input.substring(_this.index, (_this.index + str.size())) === str) ? ((function () {
      (_this.index += str.size());
      return str;
    }))() : (function () {
      return _this.noParse();
    })();
  };
  Packrat.prototype.regex = function (regex) {
    var _this = this;
    var rc, match;
    rc = regex.exec(_this.input.substring(_this.index));
    return rc.isKindOf(Array) ? ((function () {
      match = rc[0];
      (_this.index += match.size());
      return match;
    }))() : (function () {
      console.log('regexFalse');
      return _this.noParse('regex');
    })();
  };
  Packrat.prototype.asParser = function (str) {
    var _this = this;
    return function () {
      return _this.string(str);
    };
  };
  Packrat.prototype.p = function (s) {
    var _this = this;
    console.log(s);
    return s;
  };
  module.exports = Packrat;
  return Packrat;
}).call(this);
});

require.define("/lib/prelude.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Copyright (c) 2012 Minori Yamashita <ympbyc@gmail.com>
 * See LICENCE.txt
 */
/* 
 * Little Smallmethods
 * Define Little Smalltalk's built-in methods for JS primitive objects.
 * This library adds methods to basic objects' prototype if you like it or not.
 */
(function () {
  'use strict';
  var __hasProp = {}.hasOwnProperty;
  
  Object.prototype.asString = Object.prototype.toString;
  Object.prototype.class_ = function () { return this.constructor; };
  Object.prototype.copy = Object.prototype.shallowCopy = function () { return this; };
  Object.prototype.deepCopy = function () {
    var a = new (this.constructor || Object);
    for (var key in this) {
      if (__hasProp.call(this, key)) a[key] = this[key];
    }
    return a;
  };
  Object.prototype.do_ = Object.prototype.binaryDo = function (fn) {
    for (var key in this) {
      if (__hasProp.call(this, key) && String(key).search(/__/) !== 0) fn(this[key], key);
    }
    return null;
  };
  Object.prototype.error = function (str) { throw str; };
  Object.prototype.isKindOf = function (Klass) { return this instanceof Klass; };
  Object.prototype.isMemberOf = function (Klass) { return this.class_() === Klass;  };
  Object.prototype.print = Object.printString = function () { return JSON ? JSON.stringify(this) : this.toString();  };
  Object.prototype.respondsTo = function (name) { return this[name] !== undefined && this[name] !== null; };
    
  Number.prototype.to = function (tonum) { 
    var i = this-1, 
    res = []; 
    while (++i < tonum) 
      res.push(i); 
    return res;
  };
  // to:by:
  Number.prototype.toby = function (tonum, bynum) {
    var i = this-1,
        res = [];
    while (i += bynum <= tonum)
      res.push(i);
    return res;
  };
  Number.prototype.timesRepeat = function (fn) {
    var _this = this;
    return (0).to(this).do_(function (it) { return fn.call(_this, it); }); 
  };
  
  Object.prototype.asArray = function () {
    return this.collect(function (it) {return it});
  };
  Object.prototype.asString = function () {
    return this.asArray().injectinto('', function (it, lastres) {
      return lastres + String(it);
    });
  };
  Object.prototype.collect = function (fn) {
    var ret = {},
        _this = this;
    this.do_(function (it, key) {
      ret[key] = fn.call(_this, it);
    });
    return ret;
  };
  Object.prototype.detect = function (fn) {
    this.do_(function (it, key) {
      if (fn.call(this, it)) return it;
    });
    throw "Object.detect could not find an item that satisfies "+fn.toString()+".";
  };
  // detect:ifAbsent:
  Object.prototype.detectifAbsent = function (fn1, fn2) {
    try {
      return this.detect(fn1);
    } catch (err) {
      return fn2.call(this);
    }
  };
  Object.prototype.includes = function (it) {
    try{
      this.detect(function (it2) { return it === it2; });
      return true;
    } catch (err) {
      return false;
    }
  };
  // inject:into:
  Object.prototype.injectinto = function (initialValue,fn) {
    var lastres = initialValue,
        _this = this;
    this.do_(function (it, key) {
      lastres = fn.call(_this, it, lastres);
    });
    return lastres;
  };
  Object.prototype.isEmpty = function () { 
    return this.size() === 0;
  };
  Object.prototype.occuranceOf = function (item) {
    return this.injectinto(0, function (it, lst) { return (item === it) ? ++lst : lst; });
  };
  Object.prototype.remove = function (item) {
    var found = false,
        _this = this;
    this.do_(function (it, key) {
      if (it === item) { found = true; delete _this[key]; }
    });
    return null;
  };
  // remove:ifAbsent:
  Object.prototype.removeifAbsent = function (item, fn) {
    try {
      return this.remove(item);
    } catch (err) {
      return fn.call(this);
    }
  };
  Object.prototype.select = function (fn) {
    var ret = {},
        _this = this;
    this.do_(function (it, key) {
      if (fn.call(_this, it)) ret[key] = it;
    });
    return ret;
  };
  Object.prototype.reject = function (fn) {
    var ret = {},
        _this = this;
    this.do_(function (it, key) {
      if ( ! fn.call(_this, it)) ret[key] = it;
    });
    return ret;
  };
  Object.prototype.size = function () { 
    return this.injectinto(0,function (a,b) {return b+1});
  };
  Object.prototype.asDictionary = function () {
    var ret = {},
        _this = this;
    this.do_(function (it, key) {
      ret[key] = it;
    });
    return ret;
  };
  Object.prototype.at = function (key) {
    if ((! this[key]) || this[key].isNil()) throw "Object.at: slot "+key+" is nil";
    return this[key]; 
  };
  // at:ifAbsent:
  Object.prototype.atifAbsent = function (key, fn) {
    try {
      return this.at(key);
    } catch (err) {
      return fn.call(this);
    }
  };
  // at:put:
  Object.prototype.atput = function (key, item) {
    this[key] = item;
    return this;
  };
  Object.prototype.includesKey = function (key) {
    return this[key] !== undefined;
  };
  Object.prototype.indexOf = function (item) {
    for (var key in this) {
      if (this[key] === item) return key;
    }
    throw "Object.indexOf: not found";
  };
  // indexOf:ifAbsent:
  Object.prototype.indexOfifAbsent = function (item, fn) {
    try {
      return this.indexOf(item);
    } catch (err) {
      return fn.call(this);
    }
  };
  Object.prototype.keys = function () {
    if (Object.keys) return Object.keys(this);
    this.collect(function (it, key) {return key});
  };
  Object.prototype.keysDo = function (fn) {
    return this.keys().do_(fn);
  };
  Object.prototype.keySelect = function (fn) {
    return this.keys().select(fn);
  };
  
  Array.prototype.addLast = function (item) { this.push(item); return this; };  
  Array.prototype.do_ = Array.prototype.binaryDo = Array.prototype.forEach || Object.prototype.do_;
  Array.prototype.collect = Array.prototype.map || function (fn) {
    var ret = [], 
        _this = this;
    this.do_(function (it, key) {
      ret.push(fn.call(_this, it, key));
    });
    return ret;
  };
  Array.prototype.select = Array.prototype.filter || function (fn) {
    var ret = [],
        _this = this;
    this.do_(function (it, key) {
      if (fn.call(_this, it)) ret.push(it);
    });
    return ret;
  };
  Array.prototype.reject = function (fn) {
    var ret = [],
        _this = this;
    this.do_(function (it, key) {
      if ( ! fn.call(_this, it)) ret.push(it);
    });
    return ret;
  };
  // copyFrom:to:
  Array.prototype.copyFromto = function (from, to) {
    return this.slice(from, to);
  };
  Array.prototype.copyWith = function (fn) {
    return this.concat([]).concat(fn.call(this));
  };
  Array.prototype.copyWithout = function (val) {
    return this.reject(function (it) { return it===val;  });
  };
  // equals:startingAt:
  Array.prototype.equalsstartingAt = function (arr, idx) {
    if (this.length !== arr.slice(idx).length) return false;
    var tgt = arr.slice(idx), 
        _this = this;
    this.do_(function (it, key) {
      if (it !== tgt[key]) return false;
    });
    return true;
  };
  Array.prototype.findFirst = function (fn) {
    var _this = this;
    this.do_(function (it, key) {
      if (fn.call(_this, it)) return key;
    });
    throw "Array.findFirst: not found";
  };
  // findFirst:ifAbsent:
  Array.prototype.findFirstifAbsent = function (fn1, fn2) {
    try {
      return this.findFirst(fn1);
    } catch (err) {
      return fn2.call(this);
    }
  };
  Array.prototype.findLast = function (fn) {
    var ret, 
        _this = this;
    this.do_(function (it, key) {
      if (fn.call(_this, it)) ret = key;
    });
    if (ret) return ret;
    throw "Array.findLast: not found";
  };
  // findLast:ifAbsent:
  Array.prototype.findLastifAbsent = function (fn1, fn2) {
    try {
      return this.findLast(fn1);
    } catch (err) {
      return fn2.call(this);
    }
  };
  Array.prototype.firstKey = function () { return 0;  };
  Array.prototype.last = function () { return this[this.length-1];  };
  Array.prototype.lastKey = function () { return this.length - 1;  };
  // replaceFrom:to:with:
  Array.prototype.replaceFromtowith = function (from, to, replacement) {
    for (var i = from, j = 0; i < to; ++i) {
      this[i] = replacement[j];
      ++j;
    }
    return this;
  };
  Array.prototype.startingAt = function (idx) { return this.slice(idx);  };
  Array.prototype.reversed = function () {
    return this.reverse();
  };
  Array.prototype.reverseDo = function (fn) {
    return this.reverse().do_(fn);
  };
  Array.prototype.sort = Array.prototype.sort;
  // with:do:
  Array.prototype.withdo = function (col, fn) {
    if (this.length !== col.length) throw "Array.withDo: first argument has to be an array that have the same length as the receiver";
  };
  Array.prototype.size = function () { return this.length };

  String.prototype.at = function (idx) { return this[idx]; };

  // copyFrom:length:
  String.prototype.copyFromlength = function (from, length) { return this.substring(from, from + length);  };
  // copyFrom:to:
  String.prototype.copyFromto = String.prototype.substring;
  String.prototype.print = function () { try { return console.log(this); } catch (err) { throw "String.print: no console found"; } };
  String.prototype.size = function () { return this.length; };
  String.prototype.sameAs = function (str) { return this.toLowerCase() === str.toLowerCase(); };
  
  Function.prototype.value = function () { return this(); };
  // value:value:...
  Function.prototype.valuevalue 
      = Function.prototype.valuevaluevalue 
      = Function.prototype.valuevaluevaluevalue 
      = Function.prototype.valuevaluevaluevaluevalue 
      = function (/* &rest arguments */) { 
        return this.apply(this, arguments);
      };
  Function.prototype.whileTrue = function (fn) {
    while (this()) if (fn) fn.call(this);
    return null;
  };
  Function.prototype.whileFalse = function (fn) {
    while ( ! this()) if (fn) fn.call(this);
    return null;
  };
  Function.prototype.tryCatch = function (fn) {
    try {
      return this();
    } catch (err) {
      return fn.call(this, err);
    }
  };
  Function.prototype.tryCatchfinally = function (fn1, fn2) {
    try {
      this();
    } catch (err) {
      fn1.call(this, err);
    } finally {
      return fn2.call(this);
    }
  };
  
}).call(this);

});

require.define("/test/tests.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Expensivecamera tests
 */

var Excam = require('../src/expensivecamera');

window.Excam = Excam;

var E = {};
E.__noSuchMethod__ = function (p, args) {
  var e = new Excam(args[0]);
  return e[p]();
};

test("space", function () {
  strictEqual(E.space(' ab'), ' ', "one space");
  strictEqual(E.space('   ab'), '   ', "three spaces");
  strictEqual(E.space('\tab'), '\t', "one tab");
  strictEqual(E.space('\nab'), '\n', "one newline");
  strictEqual(E.space(' \n\t \t\nab'), ' \n\t \t\n', "combined");
});

test("skipSpace", function () {
  strictEqual(E.skipSpace(' \n\t \t\nab'), ' \n\t \t\n', "combined");
  strictEqual(E.skipSpace('abcd'), '', "none");
});

test("symbol", function () {
  strictEqual(E.symbol('abcd*+~'), 'abcd', "alphabet");
  strictEqual(E.symbol('abcd$0_*+~'), 'abcd$0_', "alphanumer$_ical");
});

test("identifier", function () {
  strictEqual(E.identifier('();*abcd$0_*+~  '), '();*abcd$0_*+~', "mess");
});

test("equal", function () {
  strictEqual(E.equal('==ab'), '==', "==");
});

test("rightArrow", function () {
  strictEqual(E.rightArrow('->ab'), '->', "->");
});

test("lambdaBody", function () {
  strictEqual(E.lambdaBody('(a .foo 5) '), "a[\'foo\'](5)", "no arg");
  strictEqual(E.lambdaBody('foo -> 5 '), 'function (foo) { return 5 }', "one arg");
  strictEqual(E.lambdaBody('foo ->bar-> 5 '), 'function (foo) { return function (bar) { return 5 } }', "two arg");
});

test("lambda", function () {
    strictEqual(E.lambda('[(a .foo 5)] '), "function () { return a[\'foo\'](5) }", "no arg");
    strictEqual(E.lambda('[a -> (a .foo 5)] '), "function (a) { return a[\'foo\'](5) }", "one arg");
});

test("primary", function () {
  strictEqual(E.primary('foo '), 'foo', "symbol");
  strictEqual(E.primary('5 '), '5', "numberLit");
  strictEqual(E.primary("'foo'"), "\'foo\'", "stringLit");
  strictEqual(E.primary('[a] '), 'function () { return a }', "lambda");
});

test("selector", function () {
  strictEqual(E.selector('.foo '), "\'foo\'", "symbol");
  strictEqual(E.selector('.~>_&akl '), "\'~>_&akl\'", "mess");
});

test("methodInvocation", function () {
  strictEqual(E.methodInvocation('.foo~ 5 '), "[\'foo~\'](5)", "selector-literal");
    strictEqual(E.methodInvocation('.foo~ (a 5) '), "[\'foo~\'](a(5))", "selector-expression");
  strictEqual(E.methodInvocation('.foo~ .bar '), "[\'foo~\']()", "selector-selector");
});

test("funcall", function () {
  strictEqual(E.funcall('5 '), '(5)', "literal");
  strictEqual(E.funcall('(a 5) '), '(a(5))', "expression");
});

test("message", function () {
  strictEqual(E.message('(foo (a 5)) '), 'foo(a(5))', "fn fn");
  strictEqual(E.message('( foo .bar (a 5) ) '), "foo[\'bar\'](a(5))", "mtd fn");
  strictEqual(E.message('(5 .bar (a 5) .baz 7) '), "5[\'bar\'](a(5))[\'baz\'](7)", "mtd fn mtd");
  strictEqual(E.message('( 5 .foo .bar .baz )'), "5['foo']()['bar']()['baz']()", 'mtd mtd mtd');
});

test("expression", function () {
  strictEqual(E.expression('(foo .bar (a 5) .baz 7) '), 'foo[\'bar\'](a(5))[\'baz\'](7)', "message");
  strictEqual(E.expression('817 '), '817', "literal");
  strictEqual(E.expression('[n->n] '), 'function (n) { return n }', "lambda");
});

test("numberLit", function () {
  strictEqual(E.numberLit('5 '), '5', "int");
  strictEqual(E.numberLit('891.272 '), '891.272', "float");
});

test("stringLit", function () {
  strictEqual(E.stringLit("'quick brown fox\njumps over the lazy dog \\',' "), "\'quick brown fox\\njumps over the lazy dog \\',\'", "_");
});

test("declaration", function () {
  strictEqual(E.declaration('foo == 5 '), 'var foo = 5;', "primary");
  strictEqual(E.declaration('bar== [n]  '), 'var bar = function () { return n };', "lambda");
  strictEqual(E.declaration('foo==(a 5) '), 'var foo = a(5);', "message");
});

test("program", function () {
  strictEqual(E.program('foo == 5 bar == 6'), 'var foo = 5;var bar = 6;', "declarations");
  strictEqual(E.program('foo == 5 bar == 6 7 8 '), 'var foo = 5;var bar = 6;7', "declarations expression");
  strictEqual(E.program('(a 5) (b 6)'), 'a(5)', "expression");
});

});
require("/test/tests.js");
})();
