/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const Validator = require('../Validator')

class EnumValidator extends Validator {
    constructor(field, values) {
        super(field)
        this.values = values
    }

    test(value) {
        if (
            value === undefined ||
            ~this.values.indexOf(value)
        )
            return

        const { field, values } = this

        this.fail(
            value, 'one of', values,
            `${field.schema.name}.${field.name} must equal to one of the following values: ${values.join(', ')}`
        )
    }
}

EnumValidator.alias = 'oneOf'

module.exports = EnumValidator
