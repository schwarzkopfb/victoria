/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert    = require('assert'),
      Validator = require('../Validator')

class CustomValidator extends Validator {
    constructor(field, fn) {
        assert.strictEqual(typeof fn, 'function', 'custom validator must be a function')

        super(field)
        this.fn = fn
    }

    test(value) {
        if (
            value === undefined ||
            this.fn(value)
        )
            return

        const { field } = this

        this.fail(
            value, null, null,
            `${field.schema.name}.${field.name} is invalid`
        )
    }
}

CustomValidator.aliases = [
    'validate',
    'test'
]

module.exports = CustomValidator
