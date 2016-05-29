/**
 * Created by schwarzkopfb on 24/05/16.
 */

'use strict'

const Validator = require('../Validator')

class RegExpValidator extends Validator {
    constructor(field, expression) {
        super(field)
        this.expression = expression
    }

    check(text) {
        if (text && this.expression.test(text))
            return

        const { field, expression } = this

        this.fail(
            text, 'match', expression,
            `${field.schema.name}.${field.name} must match ${expression}`
        )
    }
}

module.exports = RegExpValidator
