/**
 * Created by schwarzkopfb on 06/06/16.
 */

'use strict'

const Validator = require('../Validator')

class DateValidator extends Validator {
    test(value) {
        if (
            value === undefined ||
            !isNaN(value) &&
            value >= 0
        )
            return

        const { field } = this

        this.fail(
            value, null, null,
            `${field.schema.name}.${field.name} must be a valid date`
        )
    }
}

module.exports = DateValidator
