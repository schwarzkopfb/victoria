/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert     = require('assert'),
      _data      = Symbol(),
      _schema    = Symbol(),
      _changed   = Symbol(),
      _defaults  = Symbol(),
      _changeset = Symbol()

// this will result in a more expressive stack trace
const traps = new class Model {
    constructor() {
        this.get = getField
        this.set = setField
    }
}

function getField(model, key) {
    const schema = model[ _schema ]

    // our related schema contains this key,
    // so the caller is curious about a field
    if (schema.has(key)) {
        const value =
                  model[ _changeset ][ key ] ||
                  model[ _data ][ key ] ||
                  model[ _defaults ][ key ]

        return schema.get(key, value)
    }
    // ...or maybe tries to access a Model instance prop
    else
        return model[ key ]
}

function setField(model, key, value) {
    const schema = model[ _schema ]

    assert(schema.has(key), `'${key}' field not exists in '${schema.name}' schema`)

    // apply value transformations
    value = schema.set(key, value)

    // mark this model as a changed one
    model[ _changed ]          = true
    // track this change of the model
    model[ _changeset ][ key ] = value

    // otherwise a TypeError will be thrown:
    // "'set' on proxy: trap returned falsish"
    return true
}

class Model {
    constructor(schema, data) {
        this[ _data ]      = {}
        this[ _schema ]    = schema
        this[ _defaults ]  = schema.defaults // resolve dynamic defaults
        this[ _changeset ] = data || {}

        if (data)
            this[ _changed ] = true

        return new Proxy(this, traps)
    }

    validate() {
        if (!this[ _changed ])
            return

        const schema   = this[ _schema ],
              changes  = this[ _changeset ],
              defaults = this[ _defaults ],
              keys     = schema.keys

        for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[ i ]
            let value = changes[ key ]

            if (value === undefined)
                value = defaults[ key ]

            schema.validate(key, value)
        }
    }

    save() {
        return new Promise(ok => {
            this.validate()
            ok(this)
        })
    }

    toJSON() {
        return Object.assign(this[ _defaults ], this[ _data ], this[ _changeset ])
    }

    inspect() {
        return this.toJSON()
    }

    static getData(model) {
        return model[ _data ]
    }

    static getSchema(model) {
        return model[ _schema ]
    }

    static hasChanged(model) {
        return model[ _changed ] || false
    }

    static getChangeSet(model) {
        return model[ _changeset ]
    }
}

module.exports = Model
