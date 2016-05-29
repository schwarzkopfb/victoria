/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const ValidationError = require('./ValidationError')

class Validator {
    constructor(field) {
        this.field = field
    }

    fail(actual, operator, expected, message) {
        const field = this.field

        throw new ValidationError(
            field.schema.name,
            field.name,
            {
                actual,
                expected,
                message,
                operator,
                stackStartFunction: this.fail
            }
        )
    }
}

module.exports = Validator
