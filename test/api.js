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

let user = db.create('user'),
    def  = {
        username:      undefined,
        age:           undefined,
        email:         undefined,
        customerId:    undefined,
        favoriteDay:   undefined,
        maxLengthTest: undefined,
        odd:           undefined
    },
    ins  = `{ username: undefined,
  age: undefined,
  email: undefined,
  customerId: undefined,
  favoriteDay: undefined,
  maxLengthTest: undefined,
  odd: undefined }`

tap.same(user, {}, 'an empty model should look like a hash without keys')
tap.same(user.toJSON(), def, "an empty model's json representation should be initialized correctly")
tap.same(user.inspect(), def, 'model.inspect() should be just an alias for model.toJSON()')
tap.equal(inspect(user), ins, 'model should be inspected correctly')

tap.test('default values', test => {
    const now    = Date.now(),
          rating = db.create('rating')

    test.equal(rating.userId, undefined, 'default value should be `undefined` if not specified')
    test.equal(rating.text, '-', 'default value should be set if specified')
    test.ok(rating.timestamp >= now, 'dynamic default date should be set correctly')

    setTimeout(() => {
        const rating2 = db.create('rating'),
              ts2     = rating2.timestamp,
              ts1     = rating.timestamp

        test.ok(ts1 >= now, 'dynamic default value should be regenerated only on create')
        test.ok(ts2 > now, 'dynamic default value should be regenerated only on create')
        test.ok(ts1 < ts2, 'dynamic default value should be regenerated only on create')

        setTimeout(() => {
            test.equal(rating.timestamp, ts1, 'dynamic default value should not be regenerated on access')
            test.equal(rating2.timestamp, ts2, 'dynamic default value should not be regenerated on access')

            const hostname   = require('os').hostname,
                  createHash = require('crypto').createHash,
                  machineId  = createHash('md5').update(hostname()).digest('hex')

            test.equal(rating.origin, machineId, 'custom dynamic default value should be computed')

            test.end()
        }, 1)
    }, 1)
})
