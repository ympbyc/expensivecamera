"
  Expensivecamera to JavaScript parser+translator
  2013 Minori Yamashita <ympbyc@gmail.com>
"

| Packrat |

Packrat := require value: '../lib/Packrat'.

Packrat subclass:#Excam variables: #().

!Excam space
  self cache: #space aParser: [
    self regex: (RegExp new: '^[\\s\\n\\t]+')]!.

!Excam skipSpace
  self optional: [self space]!.

!Excam symbol
  self cache: #symbol aParser: [
    self regex: (RegExp new: '^[a-zA-Z_$][a-zA-Z0-9_$]*')]!.

!Excam equal
  self cache: #equal aParser: [
    self string: '==']!.

!Excam rightArrow
  self cache: #roghtArrow aParser: [
    self string: '->']!.

!Excam lambda
  self cache: #lambda aParser: [
    self between: [ self chr: '[' ]
         and:     [ self chr:']' ]
         accept:  [
           self try_: #(
             [|s| s := 'function () { return ' + self expression + ' }'. self skipSpace. self followedBy:[self chr:']']. s]
             [self lambdaBody ])]]!.

!Excam lambdaBody
  "Curry"
  self cache: #lambdaBody aParser: [| exp |
    self skipSpace.
    self try_: #(
      [| f  |
       f := 'function (' + self symbol + ') { return '.
       self skipSpace.
       self rightArrow.
       f += (self lambdaBody + ' }').
       f]
      [self expression])]!.

!Excam primary
  self cache: #primary aParser: [
    self try_: #(
      [self symbol]
      [self literal]
      [self lambda]
      "[self between: [self chr: '('. self skipSpace]
            and:     [self skipSpace. self chr: ')']
            accept:  [self expression]]")]!.

!Excam methodInvocation
  self cache: #methodInvocation aParser: [| selector arg |
    self skipSpace.
    self chr: '.'.
    selector := self symbol.
    self space.
    arg := self expression.
    '.' + selector + '(' + arg + ')']!.

!Excam funcall
  self cache: #funcall aParser: [| arg  |
    self skipSpace.
    arg := self expression.
    '(' + arg + ')']!.

!Excam message
  "function application inclusive-or method invocation"
  self cache: #message aParser: [| receiver mes |
    self chr: '('.
    self skipSpace.
    receiver := self primary.
    self space.
    mes := self many: [
      self try_: #(
        [self methodInvocation]
        [self funcall])].
    self skipSpace.
    self chr: ')'.
    receiver + mes]!.

!Excam expression
  self cache: #expression aParser: [
    self try_: #(
      [ self message ]
      [ self primary ])]!.

!Excam numberLit
  self cache: #numberLit aParser: [
    self regex: (RegExp new: '^-?[0-9]+(\\.?[0-9]+)?')]!.

!Excam stringLit
  self cache: #stringLit aParser: [
    '\''
    + ((self
          between: [self char: '\'']
          and:     [self char: '\'']
          accept:  [| c |
            c := self anyChar.
            c === '\\' ifTrue: [c + self anyChar]
                       ifFalse:[ c ]])
    rep:</\n/g> lace:'\\n') + '\'']!.

!Excam literal
  self cache: #literal aParser: [
    self try_: #(
      [self numberLit]
      [self stringLit])]!.

!Excam declaration
  self cache: #declaration aParser: [| v exp |
    self skipSpace.
    v := self symbol.
    self skipSpace.
    self string: '=='.
    self skipSpace.
    exp := self expression.
    'var ' + v + ' = ' + exp + ';']!.

!Excam program
  self cache: #program aParser: [| decs exp |
    decs := self many: [self declaration].
    self skipSpace.
    exp := (self optional: [self expression]) || ''.
    decs + exp]!.

module at: #exports put: Excam.

Excam
