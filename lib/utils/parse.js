/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const Field      = require('../Field'),
      validators = require('../validators'),
      getters    = require('../getters'),
      setters    = require('../setters')

const vAliases = {
    'max':       validators.Max,
    'min':       validators.Min,
    'maxLength': validators.MaxLength,
    'maxlength': validators.MaxLength,
    'minLength': validators.MinLength,
    'minlength': validators.MinLength,
    'eMail':     validators.EMail,
    'EMail':     validators.EMail,
    'email':     validators.EMail,
    'enum':      validators.Enum,
    'oneOf':     validators.Enum,
    'required':  validators.Required,
    'regExp':    validators.RegExp,
    'regexp':    validators.RegExp,
    'regEx':     validators.RegExp,
    'regex':     validators.RegExp,
    'rxp':       validators.RegExp,
    'match':     validators.RegExp
}

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
                const Validator = vAliases[ key ]

                if (Validator)
                    v.push(new Validator(field, descriptor[ key ]))
            }
    }

    return field
}

module.exports = parseSchema
