/**
 * Created by schwarzkopfb on 14/06/16.
 */

'use strict'

// better stack trace
exports = module.exports = new class symbols {};

[
    'data',
    'schema',
    'changed',
    'defaults',
    'database',
    'changeset',
    'client',
    'closed',
    'dynamics'
]
    .forEach(s => exports[ s ] = Symbol(s))
