/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const Validator = require('../Validator')

class RequiredValidator extends Validator {
    test(value) {
        if (
            value !== undefined &&
            value !== null &&
            value !== ''
        )
            return

        const { field } = this

        this.fail(
            value, '!=', null,
            `${field.schema.name}.${field.name} is required but empty`
        )
    }
}

module.exports = RequiredValidator
