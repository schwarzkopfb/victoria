/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const Validator = require('../Validator')

class MinLengthValidator extends Validator {
    constructor(field, length) {
        super(field)
        this.length = length
    }

    test(text) {
        if (text === undefined)
            return

        if (!text)
            text = ''

        if (text.length >= this.length)
            return

        const { field, length } = this

        this.fail(
            text.length, '>=', length,
            `${field.schema.name}.${field.name}.length must be greater than or equal to ${length}`
        )
    }
}

MinLengthValidator.aliases = [
    'minLength',
    'min_length'
]

module.exports = MinLengthValidator
