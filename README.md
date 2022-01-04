# Prefix Predicate

Evaluates simple boolean expressions. Syntax is similar to LDAP filters, which only prefix the logical operators.

For instance, an expression like `(a != 1) || (a == 1)`, would be `|(!(a = 1))(a = 1)`

This code has hardly been used, and I am not experienced at making interpreters, so I'm sure it needs work. My goal is for this to be a little more flexible than LDAP filters about whitespace and parenthesis while still taking advantage of prefix notation. None of that flexibility is there yet - just a basic starting point.

## Examples

```js
let a = new PrefixPredicate('&(asdf=1)(asdf=2)');
let ar = a.eval({ asdf: 1 }); // false
```

Thanks for checking it out. Happy coding!
