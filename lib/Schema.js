/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const parse = require('./utils/parse')

class Schema {
    constructor(name, descriptor) {
        const fields = parse(this, descriptor),
              empty  = {}

        for (let key in fields)
            /* istanbul ignore if */
            if (fields.hasOwnProperty(key))
                empty[ key ] = undefined

        this.name       = name
        this.fields     = fields
        this.defaults   = empty
        this.descriptor = descriptor
    }

    has(key) {
        if (key === 'constructor')
            return false

        return key in this.fields
    }

    get(key, value) {
        const field = this.fields[ key ]

        if (field)
            return field.get(value)
        else
            return value
    }

    set(key, value) {
        const field = this.fields[ key ]

        if (field)
            return field.set(value)
        else
            return value
    }

    validate(key, value) {
        const field = this.fields[ key ]

        if (field)
            field.validate(value)
    }

    toJSON() {
        return this.descriptor
    }

    inspect() {
        return this.toJSON()
    }
}

module.exports = Schema
