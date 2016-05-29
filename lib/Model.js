/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const _data      = Symbol(),
      _fresh     = Symbol(),
      _schema    = Symbol(),
      _changed   = Symbol(),
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
    // so caller is curious about a data field
    if (schema.has(key)) {
        const value = model[ _changeset ][ key ] || model[ _data ][ key ]
        return model[ _schema ].get(key, value)
    }
    // ...or maybe tries to access a Model instance prop
    else
        return model[ key ]
}

function setField(model, key, value) {
    const schema = model[ _schema ]

    // our related schema contains this key,
    // so we need to validate and transform the given value
    if (schema.has(key)) {
        // apply value transformations
        value = schema.set(key, value)

        // mark this model as a changed one
        model[ _changed ]          = true
        // track this change of the model
        model[ _changeset ][ key ] = value
    }
    // this key is just a decorator
    // all we have to do is to store it in
    // the underlying data holder object
    else
        model[ _data ][ key ] = value

    // otherwise a TypeError will be thrown:
    // "'set' on proxy: trap returned falsish"
    return true
}

class Model {
    constructor(schema, data, fresh) {
        this[ _data ]      = data || {}
        this[ _fresh ]     = fresh || false
        this[ _schema ]    = schema
        this[ _changeset ] = {}

        if (fresh)
            this[ _changed ] = true

        return new Proxy(this, traps)
    }

    validate() {
        if (!this[ _changed ])
            return

        const schema  = this[ _schema ],
              changes = this[ _fresh ]
                  ? Object.assign({}, schema.initialData, this[ _changeset ])
                  : this[ _changeset ]

        for (let key in changes) {
            if (changes.hasOwnProperty(key)) {
                const value = changes[ key ]
                schema.validate(key, value)
            }
        }
    }

    save() {
        return new Promise(ok => {
            this.validate()
            ok(this)
        })
    }

    toJSON() {
        return Object.assign({}, this[ _data ], this[ _changeset ])
    }

    inspect() {
        return this.toJSON()
    }

    static getData(model) {
        return model[ _data ]
    }

    static hasChanged(model) {
        return model[ _changed ] || false
    }

    static getChangeSet(model) {
        return model[ _changeset ]
    }
}

module.exports = Model
