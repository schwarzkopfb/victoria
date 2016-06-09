/**
 * Created by schwarzkopfb on 09/06/16.
 */

'use strict'

const Validator = require('../Validator')

class LengthValidator extends Validator {
    constructor(field, length) {
        super(field)
        this.length = length
    }

    test(text) {
        if (text === undefined)
            return

        if (!text)
            text = ''

        if (text.length === this.length)
            return

        const { field, length } = this

        this.fail(
            text.length, '===', length,
            `${field.schema.name}.${field.name}.length must equal to ${length}`
        )
    }
}

module.exports = LengthValidator
