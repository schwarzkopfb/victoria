/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert     = require('assert'),
      id         = require('./utils/id'),
      _schema    = Symbol('schema'),
      _changed   = Symbol('changed'),
      _defaults  = Symbol('defaults'),
      _database  = Symbol('database'),
      _changeset = Symbol('changeset')

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
        this[ _database ]  = schema.database
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
        return new Promise((ok, error) => {
            // validate() throws, but the Promise catches it
            this.validate()

            if (!this.id)
                this.id = id()

            const db   = this[ _database ],
                  name = this[ _schema ].name

            db.client
              .multi([
                         [ 'sadd', db.keyFor(name, null, 'all'), this.id ],
                         [ 'hmset', db.keyFor(name, this.id), this.toArray() ]
                     ])
              .exec(err => {
                  if (err)
                      error(err)
                  else
                  // resolve with the model itself
                      ok(this)
              })
        })
    }

    toJSON(includeEmpty) {
        const keys = this[ _schema ].keys,
              obj  = Object.assign(this[ _defaults ], this)

        if (!includeEmpty)
            for (let i = keys.length; i--;) {
                const key = keys[ i ]

                if (obj[ key ] === undefined)
                    delete obj[ key ]
            }

        return obj
    }

    // returns a Redis-like representation (array) of the data
    // useful for 'hmset' calls for example
    toArray() {
        const keys = this[ _schema ].keys,
              data = this.toJSON(true),
              arr  = []

        for (let i = keys.length; i--;) {
            const key = keys[ i ],
                  val = data[ key ]

            if (val != null)
                arr.push(key, val)
        }

        return arr
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
