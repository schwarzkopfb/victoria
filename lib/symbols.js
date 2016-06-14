/**
 * Created by schwarzkopfb on 14/06/16.
 */

'use strict';

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
