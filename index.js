/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

exports = module.exports = require('./lib/Database');

[
    'Database',
    'Schema',
    'Field',
    'Model',
    'Validator',
    'ValidationError',
    'validators',
    'constants',
    'getters',
    'setters',
    'symbols'
]
    .forEach(m => exports[ m ] = require(`./lib/${m}`))

exports.version = require('./package.json').version
