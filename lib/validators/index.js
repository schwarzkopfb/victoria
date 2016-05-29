/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict';

[
    'EMail',
    'Enum',
    'Max',
    'MaxLength',
    'Min',
    'MinLength',
    'RegExp',
    'Required'
]
    .forEach(v => exports[ v ] = require(`./${v}`))
