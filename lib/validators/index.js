/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict';

[
    'Custom',
    'Date',
    'EMail',
    'Enum',
    'Length',
    'Max',
    'MaxLength',
    'Min',
    'MinLength',
    'RegExp',
    'Required',
    'Integer'
]
    .forEach(name => {
        const Validator = exports[ name ] = require(`./${name}`),
              aliases = [ name.toLowerCase() ]

        if (Validator.alias)
            aliases.push(Validator.alias)
        else if (Validator.aliases)
            aliases.push(...Validator.aliases)

        aliases.forEach(name => exports[ name ] = Validator)
    })
