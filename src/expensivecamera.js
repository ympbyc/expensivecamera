(function () {
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
  Excam.prototype.equal = function () {
    var _this = this;
    return _this.cacheaParser('equal', function () {
      return _this.string('==');
    });
  };
  Excam.prototype.rightArrow = function () {
    var _this = this;
    return _this.cacheaParser('roghtArrow', function () {
      return _this.string('->');
    });
  };
  Excam.prototype.lambda = function () {
    var _this = this;
    return _this.cacheaParser('lambda', function () {
      return _this.betweenandaccept((function () {
        return _this.chr('[');
      }), (function () {
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
  Excam.prototype.methodInvocation = function () {
    var _this = this;
    return _this.cacheaParser('methodInvocation', function () {
      var selector, arg;
      _this.skipSpace();
      _this.chr('.');
      selector = _this.symbol();
      _this.space();
      arg = _this.expression();
      return (((('.' + selector) + '(') + arg) + ')');
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
      return (('\'' + _this.betweenandaccept((function () {
        return _this.char('\'');
      }), (function () {
        return _this.char('\'');
      }), function () {
        var c;
        c = _this.anyChar();
        return (c === '\\') ? ((function () {
          return (c + _this.anyChar());
        }))() : (function () {
          return c;
        })();
      }).replace(/\n/g, '\\n')) + '\'');
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
  module.exports = Excam;
  return Excam;
}).call(this);