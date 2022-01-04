
class PrefixPredicate
{
    constructor(expression)
    {
        this.comparison_operators = new Set(['=', '>', '<']);
        this.logical_operators = new Set(['&','|','!']);
        this.expression = expression;
    }
    
    eval(target)
    {
        if (!this.tree)
        {
            let tokens = this.lexercise(this.expression);
            this.tree = this.parse(tokens);
        }

        return this.tree.eval(target);
    }

    parse(tokens)
    {
        if (typeof(tokens) === 'string')
        {
            return new ValueExpression(tokens);
        }
    
        let token = tokens.shift();
        let operation = null;
    
        if (this.logical_operators.has(token))
        {
            operation = this.newOperation(token);
    
            if (operation instanceof UnaryExpression)
            {
                operation.child = this.parse(tokens.shift());
            }
            else if (operation instanceof BinaryExpression)
            {
                operation.left = this.parse(tokens.shift());
    
                if (tokens.length > 1)
                {
                    tokens.unshift(operation.operator);
                    operation.right = this.parse(tokens);
                }
                else if (tokens.length == 1)
                {
                    operation.right = this.parse(tokens[0]);
                }
                else
                {
                    operation.right = new ValueExpression(true);
                }
            }
        }
        else if (this.comparison_operators.has(token))
        {
            operation = this.newOperation(token);
            operation.left = this.parse(tokens.shift());
    
            if (tokens.length > 1)
            {
                tokens.unshift(operation.operator);
                operation.right = this.parse(tokens);
            }
            else if (tokens.length == 1)
            {
                operation.right = this.parse(tokens[0]);
            }
            else
            {
                operation.right = new ValueExpression(true);
            }
    
            if (token == '=')
            {
                if (operation.left instanceof ValueExpression && operation.right instanceof ValueExpression)
                {
                    if (operation.left.value == '*')
                    {
                        operation = new Exists(operation.right.value);
                    }
                    else if (operation.right.value == '*')
                    {
                        operation = new Exists(operation.left.value);
                    }
                }
            }
        }
        else if (Array.isArray(tokens))
        {
            // an expression with multiple terms but no logical operator was given
            // assume &
    
            operation = new And();
            operation.left = this.parse(token);
    
            if (tokens.length > 1)
            {
                tokens.unshift(operation.operator);
                operation.right = this.parse(tokens);
            }
            else if (tokens.length == 1)
            {
                operation.right = this.parse(tokens[0]);
            }
            else
            {
                operation.right = new ValueExpression(true);
            }
        }
    
        return operation;
    }
    
    newOperation(operator)
    {
        switch(operator)
        {
            case '&': return new And();
            case '|': return new Or();
            case '!': return new Not();
            case '=': return new EqualTo();
            case '>': return new GreaterThan();
            case '<': return new LessThan();
        }
    }

    lexercise(expression)
    {
        let tokens = new Array();
        let firstChar = expression.charAt(0);

        if (this.logical_operators.has(firstChar))
        {
            tokens.push(firstChar);
            expression = expression.substring(1)

            let secondChar = expression.charAt(0);
            if (secondChar != '(')
            {
                expression = `(${expression})`;
            }

            return tokens.concat(this.lexercise(expression));
        }

        let nestingLevel = 0;
        let substring = '';

        for (let i = 0; i < expression.length; i++) 
        {
            let char = expression.charAt(i);

            if (this.comparison_operators.has(char) && nestingLevel == 0)
            {
                tokens.push(char);
                tokens.push(substring.trim());
                substring = '';
            }
            else if (char == '(')
            {
                if (nestingLevel == 0 && substring.length > 1)
                {
                    tokens.push(this.lexercise(substring));
                    substring = '';
                }

                if (nestingLevel > 0) substring += char;

                nestingLevel++;
            }
            else if (char == ')')
            {
                if (--nestingLevel == 0)
                {
                    tokens.push(this.lexercise(substring));
                    substring = '';
                }

                if (nestingLevel > 0) substring += char;
            }
            else
            {
                substring += char;
            }

            if (nestingLevel < 0) throw `missing an opening parens in ${expression}`;
        }

        if (substring != '') tokens.push(substring.trim());

        if (nestingLevel > 0) throw `missing a closing parens in ${expression}`;

        return tokens;
    }
}

class UnaryExpression
{
    constructor(child)
    {
        this.child = child
    }

    eval(target) 
    {
        return this.child.eval(target)
    }
}

class ValueExpression
{
    constructor(value)
    {
        this.value = value
    }

    eval(target) 
    {
        // returns value from a property of the target object, otherwise this literal value

        if (!target)
            return this.value;

        if (this.valueHasDots())
        {
            let propertiesAccessed = this.value.split('.');

            for (let i = 0; i < propertiesAccessed.length; i++) 
            {
                let property = propertiesAccessed[i];
                if (target.hasOwnProperty(property))
                {
                    target = target[property];
                }
                else
                {
                    return this.value;
                }
            }
    
            return target;
        }

        return target.hasOwnProperty(this.value) ? target[this.value] : this.value;
    }

    valueHasDots()
    {
        return typeof(this.value) === 'string' && this.value.includes('.');
    }
}

class Not extends UnaryExpression
{
    constructor(child)
    {
        super(child)
    }

    eval(target)
    {
        return !this.child.eval(target)
    }
}

class Exists extends ValueExpression
{
    constructor(value)
    {
        super(value)
    }

    eval(target) 
    {
        if (!target)
            return false;

        if (this.valueHasDots())
        {
            let propertiesAccessed = this.value.split('.');
            let propertyExists = true;
    
            for (let i = 0; i < propertiesAccessed.length; i++) 
            {
                let property = propertiesAccessed[i];
                if (target.hasOwnProperty(property))
                {
                    target = target[property];
                }
                else
                {
                    propertyExists = false;
                }
            }
            
            return propertyExists;
        }
        
        return target.hasOwnProperty(this.value)
    }
}

class BinaryExpression
{
    constructor(left, right)
    {
        this.left = left
        this.right = right
    }

    eval(target)
    {
        throw "eval not implemented in BinaryExpression"
    }
}

class And extends BinaryExpression
{
    constructor(left, right)
    {
        super(left, right)
        this.operator = '&'
    }

    eval(target) {
        return this.left.eval(target) && this.right.eval(target)
    }
}

class Or extends BinaryExpression
{
    constructor(left, right)
    {
        super(left, right)
        this.operator = '|'
    }

    eval(target) {
        return this.left.eval(target) || this.right.eval(target)
    }
}

class EqualTo extends BinaryExpression
{
    constructor(left, right)
    {
        super(left, right)
        this.operator = '='
    }

    eval(target) {
        return this.left.eval(target) == this.right.eval(target)
    }
}

class GreaterThan extends BinaryExpression
{
    constructor(left, right)
    {
        super(left, right)
        this.operator = '>'
    }

    eval(target) {
        return this.left.eval(target) > this.right.eval(target)
    }
}

class LessThan extends BinaryExpression
{
    constructor(left, right)
    {
        super(left, right)
        this.operator = '<'
    }

    eval(target) {
        return this.left.eval(target) < this.right.eval(target)
    }
}
