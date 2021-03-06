/*
 * o_O-p.js
 * 2013 Minori Yamashita <ympbyc@gmail.com>
 *
 * Correct OOP for JavaScript.
 * o_O-p.js is a part of ympbyc/expensivecamera
 */

var _g;
try { _g = window;  }
catch (e) { _g = global;  }

(function (global) {

  global.Number.prototype['<'] = function (n) {
    return this < n ? True() : False();
  };
  global.Number.prototype['+'] = function (n) {
    return this + n;
  };
  global.Number.prototype['-'] = function (n) {
    return this - n;
  };
  global.Number.prototype['*'] = function (n) {
    return this * n;
  };
  global.Number.prototype['/'] = function (n) {
    return this / n;
  };
  global.Number.prototype['%'] = function (n) {
    return this % n;
  };
  global.Number.prototype['.'] = function (n) {
    return this > n ? [] : [this].concat((this+1)['.'](n));
  };


  global.String.prototype['++'] = function (str) {
    return this + str;
  };

  global.Array.prototype.at = function (i) {
    return this[i];
  };

  global.Array.prototype.fold = function (fn) {
    var _this = this;
    return function (initial) {
      var last = initial;
      _this.forEach(function (it) {
        last = fn(it)(last);
      });
      return last;
    };
  };

  global.Object.prototype['~>'] = function (fn) {
    //let
    return fn(this);
  };
  global.Object.prototype.asArray = function () {
    var arr = [];
    var key;
    for (key in this)
      if (this.hasOwnproperty(key) && (typeof key === "number"))
        arr[key] = this[key];
    return arr;
  };

  global.Object.prototype.s = function (prop) {
    if (this[prop] === undefined) return none;
    return Just(this[prop]);
  };

  global.Object.prototype.attr = function (prop) {
    var _this = this;
    return function (val) {
      if (_this[prop] === undefined) {
        //mutation -- experimental! do not rely on this
        _this[prop] = val;
        return _this;
      }
      var obj = {};
      obj[prop] = val;
      obj.__proto__ = _this;
      return obj;
    };
  };

  global.Object.prototype[':'] = global.Object.prototype.attr;

  global.Object.prototype.act = function (prop) {
    var _this = this;
    return function (fn) {
      var obj = {};
      obj[prop] = function () {
        var arg = arguments;
        setTimeout(function() {
          fn.apply({}, arg);
        }, 0);
      };
      obj.__proto__ = _this;
      return obj;
    };
  };

  global.Object.prototype['_{}_'] = function (prop) {
    var _this = this;
    return function (fn) {
      if (typeof fn !== 'function') return none;
      if (_this.__proto__[prop] !== undefined) return none;
      _this.__proto__[prop] = fn;
      return Just(_this);
    };
  };

  global.Function.prototype.value = function () {
    return this();
  };

  global.Function.prototype.periodically = function (milisec) {
    setInterval(this, milisec);
  };

  global.True = function () {
    return {
      then: function (f1) {
        return function (f2) {
          return f1();
        };
      }
    , __proto__: object
    };
  };

  global.False = function () {
    return {
      then: function (f1) {
        return function (f2) {
          return f2();
        };
      }
    , __proto__: object
    };
  };

  //Maybe danom
  //A danom is any object with >>= method defined.
  //I believe in duck-typing
  global.None = function () {
    return {
      '>>=': function (_) {
        return None();}
    , type:'none'
    };
  };
  global.Just = function (v) {
    return {
      '>>=' : function (fn) {
        return fn(v);}
    , type:'just'
    };
  };


  //prototype-base feature
  global.object = {};
  global._true  = True();
  global._false = False();
  global.none = None();

  //unix pipe actor
  global.unix = {
    stdin: function (input) {
      var _this = this;
      setTimeout(function () { _this.main(input)(_this); }, 0); //async
    }
  , main: function (input) { return function (_this) { _this.stdout(input);  }; }
  , stdout: function (data) { this.piped.stdin(data);  }
  , '|': function (u) { return this.attr('piped')(u); }
  , __proto__: object
  };

})(_g);

/*
(2)['.']((5))['map'](function (n) { return n['*'](n) })
*/
