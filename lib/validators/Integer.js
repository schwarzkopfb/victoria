/**
 * Created by schwarzkopfb on 22/06/16.
 */

'use strict'

const Validator = require('../Validator')

class IntegerValidator extends Validator {
    test(value) {
        if (
            value === undefined ||
            value % 1 === 0
        )
            return

        const { field } = this

        this.fail(
            value, null, null,
            `${field.schema.name}.${field.name} must be an integer number`
        )
    }
}

IntegerValidator.alias = 'int'

module.exports = IntegerValidator
