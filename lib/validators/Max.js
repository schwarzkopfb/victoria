/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const Validator = require('../Validator')

class MaxValidator extends Validator {
    constructor(field, max) {
        super(field)
        this.max = max
    }

    check(value) {
        if (value <= this.max)
            return

        const { field, max } = this

        this.fail(
            value, '<=', max,
            `${field.schema.name}.${field.name} must be lower than or equal to ${max}`
        )
    }
}

module.exports = MaxValidator
