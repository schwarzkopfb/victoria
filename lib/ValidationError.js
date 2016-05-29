/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const { AssertionError } = require('assert')

class ValidationError extends AssertionError {
    constructor(schema, field, ...args) {
        super(...args)

        this.name   = 'ValidationError'
        this.schema = schema
        this.field  = field
    }
}

module.exports = ValidationError
