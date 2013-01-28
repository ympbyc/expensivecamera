/*
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
