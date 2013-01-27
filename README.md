Expensivecamera
===============

an expensive camera.

> You see here an expensive camera.
> d - an expensive camera.
> You are blinded by the flash!

Expensivecamera is a camera that is expensive. For more info, see http://nethackwiki.com/wiki/Expensive_camera



Back yet? That link actually has nothing to do with this project. What it instead is my pet programming language crossbred between **Scheme**, **Nadeko**, **Smalltalk** and **JavaScript**. Expensive camera is currently implemented as a translator to JavaScript, but Expensivecamera is a specification rather than implementation, so don't hesitate to fork and implement however you like.

Now take a look at this not-very-good example:

```
animal == (object .attr 'name' ''
                  .attr 'move' [meters -> (this .'s 'name' .++ ' moved ' .++ meters .++ 'm.')])

sam  == (animal .attr 'name' 'Sammy the Python'
  .~> [self -> (self .attr 'move' [('Slithering...' .++ (self .move 5))]

tom  == (animal .attr 'name' 'Tommy the Palomino'
  .~> [self -> (self .attr 'move' [('Galloping...' .++ (animal .move 45))])])

(sam .move .++ (tom .move))
```

What you can tell from this is that it is a prototype-based object-oriented language and you don't see any assignment.
Expensivecamera is an experimental language based around the paradigm specified  by the following characteristics:

+ Prototype-based object system
  + Classes are dead. Use higher-order function instead
+ Everything is an object
  + Including true, false and null
+ Objects are immutable
  + For those who doesn't know, immutable means it can not be changed after creation
  + Thanks to `__proto__` delegation, copying is cheap (just like `cons`)
  + Since everything is an object, everything is immutable ;)
+ Fully justified beautiful syntax
  + Absolutely minimal
  + It is S-expression, for paren haters
+ Methods are curried
  + yum yum :D
+ Strict order evaluation
  + Unfortunately...
  + If you are interested in dynamic lazy language, please see ympbyc/Nadeko

/docs directory might eventually appear.

Installation
------------

**BEWARE: I started writing Expensivecamera on January 26th 2013. It obviously means it isn't ready for any means of production use.**

```
git clone https://github.com/ympbyc/expensivecamera.git
```

Usage
-----

I have not written the REPL for it yet...

```
cd expensivecamera
node
> require('./lib/o_O-p')
> var excam = require('./src/expensivecamera')
> eval(excam.parse("    'your code here'      "))
```

Run tests
---------

Coming soon


Contribute
----------

Expensivecamera is written in LittleSmallscript. Please learn it and hack on.

LICENCE
-------

MIT
