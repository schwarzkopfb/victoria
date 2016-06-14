/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert  = require('assert'),
      key     = require('./utils/key'),
      symbols = require('./symbols'),
      {
          data:      _data,
          schema:    _schema,
          changed:   _changed,
          defaults:  _defaults,
          database:  _database,
          changeset: _changeset
      } = symbols

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

        this[ _data ]      = this
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
            // validate() may throw, but the Promise catches that
            this.validate()

            const db     = this[ _database ],
                  schema = this[ _schema ],
                  { name } = schema

            if (this.id)
                var id = Promise.resolve(this.id)
            else
                id = db.generateId(schema, this)

            id.then(id => {
                this.id = id

                db.client
                  .multi([
                             [ 'sadd', key(name, null, 'all'), id ],
                             [ 'hmset', key(name, id), this.toArray() ]
                         ])
                  .exec(err => {
                      /* istanbul ignore if */
                      if (err)
                          error(err)
                      else // resolve with the model itself
                          ok(this)
                  })
            })
              .catch(error)
        })
    }

    fetch(fields) {
        if (typeof fields === 'string')
            fields = fields.split(/\s+/g)

        if (!Array.isArray(fields))
            fields = this[ _schema ].keys

        const name = this[ _schema ].name

        assert(this.id, `cannot fetch '${name}', because no id specified`)

        const db   = this[ _database ],
              data = this[ _data ]

        return new Promise((ok, error) =>
            db.client.hmget(key(name, this.id), fields, (err, result) => {
                /* istanbul ignore if */
                if (err)
                    error(err)
                else {
                    for (let i = fields.length; i--;) {
                        const key = fields[ i ],
                              val = result[ i ]

                        if (val !== null)
                            data[ key ] = val
                        // if id is null, then the entity not exists
                        else if (key === 'id')
                            return ok(null)
                    }

                    ok(this)
                }
            })
        )
    }

    toJSON() {
        const keys = this[ _schema ].keys,
              data = Object.assign(this[ _defaults ], this[ _data ], this[ _changeset ])

        for (let i = keys.length; i--;) {
            const key = keys[ i ],
                  val = data[ key ]

            if (val === undefined)
                delete data[ key ]
        }

        return data
    }

    // returns a Redis-like representation (array) of the data,
    // excluding default values and empty fields
    // useful for 'hmset' calls for example
    toArray() {
        const keys    = this[ _schema ].keys,
              data    = this[ _data ],
              changes = this[ _changeset ],
              arr     = []

        for (let i = keys.length; i--;) {
            const key = keys[ i ],
                  val = changes[ key ] || data[ key ]

            if (val != null)
                arr.push(key, val)
        }

        return arr
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

Model.prototype[ Symbol.toStringTag ] = 'Model'

// support for...of loops
Model.prototype[ Symbol.iterator ] = function *() {
    const keys = Object.keys(this)
    for (let i = 0, l = keys.length; i < l; i++)
        yield this[ keys[ i ] ]
}

module.exports = Model
