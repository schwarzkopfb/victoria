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

    // `id` is a mandatory field,
    // so add it automatically if the user didn't
    if (!('id' in fields))
        fields.id = new Field(schema, 'id')

    return fields
}

function parseField(schema, name, descriptor) {
    const v       = [],
          g       = [],
          s       = [],
          field   = new Field(schema, name, v, g, s),
          type    = typeof descriptor

    const setType = type => {
        switch (type) {
            case Number:
            case 'number':
            case 'num':
                g.push(getters.number())
                break

            case Boolean:
            case 'boolean':
            case 'bool':
                g.push(getters.boolean())
                s.push(setters.boolean())
                break

            // if type is Date.now, then it's a Date field
            // with a dynamic default value, so use switch fall-through
            case Date.now:
                field.default = Date.now
            case Date:
            case 'date':
                v.push(new validators.Date(field))
                g.push(getters.date())
                s.push(setters.date())
                break

            case String:
            case 'string':
            case 'str':
            case undefined:
                break

            case JSON:
            case 'JSON':
            case 'json':
                s.push(setters.json())
                g.push(getters.json())
                break

            default:
                throw new TypeError(
                    `unknown field type specifier provided for ${schema.name}.${name}`
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
        if (descriptor === JSON) {
            setType(JSON)
            return field
        }

        setType(descriptor.type)

        // if no default value has been specified,
        // then we need to initialize the field
        // with `undefined`, so this will cover
        // both specified/unspecified cases
        field.default = descriptor.default

        for (let key in descriptor) {
            if (!descriptor.hasOwnProperty(key))
                continue

            // skip special descriptor props
            if (key === 'type' || key === 'default')
                continue

            // is it an internal field?
            if (
                key === 'internal' ||
                key === 'private'
            ) {
                field.internal = Boolean(descriptor[ key ])
                continue
            }

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

            const Validator = validators[ key ],
                  value     = descriptor[ key ]

            if (Validator)
                v.push(new Validator(field, value))

            const getter = getters[ key ]

            if (getter)
                g.push(getter(value))

            const setter = setters[ key ]

            if (setter)
                s.push(setter(value))

            assert(
                Validator || getter || setter,
                `unknown descriptor property found in ${schema.name}.${name}: '${key}'`
            )
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
