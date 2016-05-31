/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const Validator = require('../Validator')

class MinValidator extends Validator {
    constructor(field, min) {
        super(field)
        this.min = min
    }

    test(value) {
        if (
            value === undefined ||
            value >= this.min
        )
            return

        const { field, min } = this

        this.fail(
            value, '>=', min,
            `${field.schema.name}.${field.name} must be greater than or equal to ${min}`
        )
    }
}

module.exports = MinValidator
