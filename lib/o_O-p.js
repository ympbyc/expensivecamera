var _g;
try       { _g = window }
catch (e) { _g = global }

(function (global) {

  global.Number.prototype['<'] = function (n) { 
    return this < n ? new True : new False;
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

  global.Object.prototype.attr = function (prop) {
    var _this = this;
    return function (val) {
      var obj = {};
      obj[prop] = val;
      obj.__proto__ = _this;
      return obj;
    };
  };

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

  global.Function.prototype.value = function () {
    return this();
  };

  global.True = function () { 
    this.then = function (f1) { 
      return function (f2) { 
        return f1(); 
      }; 
    }; 
  };

  global.False = function () { 
    this.then = function (f1) {
      return function (f2) { 
        return f2(); 
      }; 
    }; 
  };

  //prototype-base feature
  global.object = {};
})(_g);
