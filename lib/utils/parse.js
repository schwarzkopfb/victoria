/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const Field      = require('../Field'),
      validators = require('../validators'),
      getters    = require('../getters'),
      setters    = require('../setters')

function parseSchema(schema, descriptor) {
    const fields = {}

    for (let key in descriptor)
        /* istanbul ignore if */
        if (descriptor.hasOwnProperty(key))
            fields[ key ] = parseField(schema, key, descriptor[ key ])

    return fields
}

function parseField(schema, name, descriptor) {
    const v     = [],
          g     = [],
          s     = [],
          field = new Field(schema, name, v, g, s)

    if (typeof descriptor === 'object') {
        // todo: check String, Number, Boolean, etc.

        for (let key in descriptor)
            /* istanbul ignore if */
            if (descriptor.hasOwnProperty(key)) {
                const Validator = validators[ key ]

                if (Validator)
                    v.push(new Validator(field, descriptor[ key ]))
            }
    }

    return field
}

module.exports = parseSchema
