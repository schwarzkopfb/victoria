/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert     = require('assert'),
      id         = require('./utils/id'),
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

    /*
     * todo: to be decided
     * we should intercept the `in` operator,
     * but probably that's rather confusing than
     * convenient
     */
    // has(model, key) {
    //     return model[ _schema ].has(key)
    // }
}

function getField(model, key) {
    const schema = model[ _schema ]

    // our related schema contains this key,
    // so the caller is curious about a field
    let value = model[ key ]

    if (value === undefined)
        value = model[ _defaults ][ key ]

    if (schema.has(key))
        return schema.get(key, value)
    else
        return value
}

function setField(model, key, value) {
    const schema = model[ _schema ]

    assert(schema.has(key), `'${key}' field not exists in '${schema.name}' schema`)

    // apply value transformations
    value = schema.set(key, value)

    // set the given field
    model[ key ]               = value
    // mark this model as a changed one
    model[ _changed ]          = true
    // track this change of the model
    model[ _changeset ][ key ] = value

    // otherwise a TypeError will be thrown:
    // "'set' on proxy: trap returned falsish"
    return true
}

class Model {
    constructor(schema, id) {
        if (id)
            this.id = id

        this[ _schema ]    = schema
        this[ _defaults ]  = schema.defaults // resolve dynamic defaults
        this[ _changeset ] = {}

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
            // validate() throws, but the Promise catches it
            this.validate()

            // is it a existing entity?
            // if it is, then update it
            if (this.id)
                // todo: maybe we should assert (could we be less specific in comments? [sarcasm])
                this.schema.database.client.hmset(/* todo: generate key */ this.toJSON())
            // or else insert it
            else {
                const data = this.toJSON()
                data.id    = id()
                this.schema.database.client.hmset(/* todo: generate key */ data)
            }

            // resolving with `this` results in something like
            // 'chainable' in the context of `co`
            ok(this)
        })
    }

    toJSON() {
        const keys = this[ _schema ].keys,
              obj  = Object.assign(this[ _defaults ], this)

        // filter out empty fields
        for (let i = keys.length; i--;) {
            const key = keys[ i ]

            if (obj[ key ] === undefined)
                delete obj[ key ]
        }

        return obj
    }

    inspect() {
        return this.toJSON()
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

Model.prototype[ Symbol.toStringTag ] = 'Model'

// support for...of loops
Model.prototype[ Symbol.iterator ] = function *() {
    const keys = Object.keys(this)
    for (let i = 0, l = keys.length; i < l; i++)
        yield this[ keys[ i ] ]
}

module.exports = Model
