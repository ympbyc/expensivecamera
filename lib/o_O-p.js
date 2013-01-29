/*
 * o_O-p.js
 * 2013 Minori Yamashita <ympbyc@gmail.com>
 *
 * Correct OOP for JavaScript.
 * o_O-p.js is a part of ympbyc/expensivecamera
 */

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
    return this[prop];
  };

  global.Object.prototype.attr = function (prop) {
    var _this = this;
    return function (val) {
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
      if (typeof fn !== 'function') return None();
      if (_this.__proto__[prop] !== undefined) return None();
      _this.__proto__[prop] = fn;
      return Just(_this);
    };
  };

  global.Function.prototype.value = function () {
    return this();
  };

  global.True = function () {
    return {
      then: function (f1) {
        return function (f2) {
          return f1();
        };
      }
    };
  };

  global.False = function () {
    return {
      then: function (f1) {
        return function (f2) {
          return f2();
        };
      }
    };
  };

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
})(global);

/*
(2)['.']((5))['map'](function (n) { return n['*'](n) })
*/
