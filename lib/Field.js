/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

class Field {
    constructor(schema, name, validators, getters, setters, defaultValue) {
        this.name   = name
        this.schema = schema

        this.validators = validators || []
        this.getters    = getters || []
        this.setters    = setters || []
        this.default    = defaultValue
    }

    validate(value) {
        for (let validator of this.validators)
            validator.test(value)
    }

    get(value) {
        for (let getter of this.getters)
            value = getter(value)

        return value
    }

    set(value) {
        for (let setter of this.setters)
            value = setter(value)

        return value
    }
}

module.exports = Field
