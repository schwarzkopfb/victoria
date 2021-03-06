/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const parse   = require('./utils/parse'),
      symbols = require('./symbols'),
      {
          defaults:  _defaults,
          dynamics:  _dynamics,
          internals: _internals
      } = symbols

class Schema {
    constructor(database, name, descriptor) {
        // note: name must be set before parsing
        this.name       = name
        this.descriptor = descriptor

        const fields    = parse(this, descriptor),
              keys      = Object.keys(fields),
              dynamics  = [],
              internals = {},
              defaults  = {}

        // compose an object containing default values
        // of this schema
        for (let i = 0, l = keys.length; i < l; i++) {
            const key   = keys[ i ],
                  field = fields[ key ],
                  value = field.default

            defaults[ key ] = value

            // create a separate list of dynamic default values
            if (typeof value === 'function')
                dynamics.push(key)

            // create a lookup table from internal fields
            if (field.internal)
                internals[ key ] = true
        }

        this.keys         = keys
        this.fields       = fields
        this.database     = database
        this.internals    = internals
        this[ _defaults ] = defaults
        this[ _dynamics ] = dynamics
    }

    has(key) {
        if (
            key === 'constructor' ||
            key === 'prototype' ||
            key === 'toString'
        )
            return false

        return key in this.fields
    }

    get(key, value) {
        return this.fields[ key ].get(value)
    }

    set(key, value) {
        return this.fields[ key ].set(value)
    }

    validate(key, value) {
        this.fields[ key ].validate(value)
    }

    get defaults() {
        // clone our internal 'defaults' object
        // to create a new reference
        const defaults = Object.assign({}, this[ _defaults ]),
              dynamics = this[ _dynamics ]

        // initialize dynamic default values
        // e.g. Date.now
        for (let i = dynamics.length; i--;) {
            const key       = dynamics[ i ]
            defaults[ key ] = defaults[ key ]()
        }

        return defaults
    }

    toJSON() {
        return this.descriptor
    }

    inspect() {
        return this.toJSON()
    }
}

module.exports = Schema
