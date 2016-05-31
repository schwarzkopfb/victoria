/**
 * Created by schwarzkopfb on 29/05/16.
 */

'use strict'

const { AssertionError } = require('assert'),
      { inspect } = require('util'),
      tap = require('tap'),
      db  = require('./database')

tap.doesNotThrow(
    () => db.create('user'),
    'schema name should be asserted'
)

tap.throws(
    () => db.create('fake'), // absent schema type
    AssertionError,
    'schema name should be asserted'
)

tap.doesNotThrow(
    () => db.create('user').username = 'test',
    'field name should be asserted'
)

tap.throws(
    () => db.create('user').invalidField = true, // absent field name
    AssertionError,
    'field name should be asserted'
)

let user = db.create('user')

tap.same(user, {}, 'an empty model should look like a hash without keys')
tap.same(user.toJSON(), {}, "an empty model's json representation must be a hash without keys")
tap.same(user.inspect(), {}, 'model.inspect() should be just an alias for model.toJSON()')
tap.equal(inspect(user), '{}', 'model should be inspected correctly')
