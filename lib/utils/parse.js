/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert     = require('assert'),
      Field      = require('../Field'),
      validators = require('../validators'),
      getters    = require('../getters'),
      setters    = require('../setters')

function parseSchema(schema, descriptor) {
    const fields = {}

    for (let key in descriptor)
        if (descriptor.hasOwnProperty(key))
            fields[ key ] = parseField(schema, key, descriptor[ key ])

    return fields
}

function parseField(schema, name, descriptor) {
    const v       = [],
          g       = [],
          s       = [],
          field   = new Field(schema, name, v, g, s),
          type    = typeof descriptor,
          setType = type => {
              switch (type) {
                  case Number:
                      g.push(getters.number)
                      break

                  case Boolean:
                      g.push(getters.boolean)
                      s.push(setters.boolean)
                      break

                  case Date:
                      v.push(new validators.Date(field))
                      g.push(getters.date)
                      s.push(setters.date)
                      break

                  case String:
                  case undefined:
                      break

                  default:
                      throw new TypeError(
                          `unknown filed type specifier provided for ${schema.name}.${name}`
                      )
              }
          }

    // date field with default value
    if (descriptor instanceof Date) {
        setType(Date)
        field.default = +descriptor
    }
    // descriptor object
    else if (type === 'object') {
        setType(descriptor.type)

        for (let key in descriptor) {
            if (!descriptor.hasOwnProperty(key))
                continue

            // register custom getter
            if (
                key === 'get' ||
                key === 'getter'
            ) {
                let fn = descriptor[ key ]
                assert.equal(typeof fn, 'function', `invalid getter provided for ${schema.name}.${name}`)
                g.push(fn)
                continue
            }

            // register custom setter
            if (
                key === 'set' ||
                key === 'setter'
            ) {
                let fn = descriptor[ key ]
                assert.equal(typeof fn, 'function', `invalid setter provided for ${schema.name}.${name}`)
                s.push(fn)
                continue
            }

            // if no default value has been specified,
            // then we need to initialize the field
            // with `undefined`
            field.default = descriptor.default

            const Validator = validators[ key ]

            if (Validator)
                v.push(new Validator(field, descriptor[ key ]))
        }
    }
    // direct field specifier
    else switch (type) {
            case 'string':
                field.default = descriptor
                break

            case 'number':
                setType(Number)
                field.default = descriptor
                break

            case 'boolean':
                setType(Boolean)
                field.default = descriptor
                break

            // Number, String, Boolean, etc.
            case 'function':
                setType(descriptor)
        }

    return field
}

module.exports = parseSchema
