/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

class Field {
    constructor(schema, name, validators, getters, setters) {
        this.name   = name
        this.schema = schema

        this.validators = validators || []
        this.getters    = getters || []
        this.setters    = setters || []
    }

    validate(value) {
        for (let validator of this.validators)
            validator.check(value)
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

    get requiresInitialization() {
        return (
            this.validators.length ||
            this.getters.length ||
            this.setters.length
        )
    }
}

module.exports = Field
