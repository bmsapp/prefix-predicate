# Prefix Predicate

Evaluates simple boolean expressions. Syntax is similar to LDAP filters, which only prefix the logical operators.

For instance, an expression like `(a != 1) || (a == 1)`, would be `|(!(a = 1))(a = 1)`

This code has hardly been used, and I am not experienced at making interpreters, so I'm sure it needs more work! The eventual goal is for this to be a little more flexible than the LDAP predicates about whitespace and parenthesis but still taking advantage of prefix notation.

## Examples

    let a = new PrefixPredicate('&(asdf=1)(asdf=2)');
    let ar = a.eval({ asdf: 1 }); // false

Thanks for checking it out. Happy coding!
