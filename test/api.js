/**
 * Created by schwarzkopfb on 29/05/16.
 */

'use strict'

const { AssertionError } = require('assert'),
      { inspect } = require('util'),
      { Model } = require('..'),
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

tap.test('Model inspections', test => {
    let user = db.create('user'),
        def  = { age: 42 },
        ins  = '{ age: 42 }'

    test.type(user, Model, '`db.create()` should return a Model instance')
    test.equal(user.toString(), '[object Model]')

    test.same(user, {}, 'an empty model should look like a hash without keys')
    test.same(user.toJSON(), {}, "an empty model's json should look like a hash without keys")
    test.same(user.inspect(), {}, '`model.inspect()` should be just an alias for `model.toJSON()`')
    test.equal(inspect(user), '{}', 'model should be inspected correctly')

    user.age = 42

    test.same(user, def, 'model should contain the initialized fields')
    test.same(user.toJSON(), def, "an empty model's json should contain the initialized fields")
    test.same(user.inspect(), def, '`model.inspect()` should be just an alias for `model.toJSON()`')
    test.equal(inspect(user), ins, 'model should be inspected correctly')

    test.end()
})

tap.test('Model default values', test => {
    const now    = Date.now(),
          rating = db.create('rating')

    test.equal(rating.userId, undefined, 'default value should be `undefined` if not specified')
    test.equal(rating.text, '-', 'default value should be set if specified')
    test.ok(rating.timestamp >= now, 'dynamic default date should be set correctly')

    setTimeout(() => {
        const rating2 = db.create('rating'),
              ts2     = +rating2.timestamp,
              ts1     = +rating.timestamp

        test.ok(ts1 >= now, 'dynamic default value should be regenerated only on create')
        test.ok(ts2 > now, 'dynamic default value should be regenerated only on create')
        test.ok(ts1 < ts2, 'dynamic default value should be regenerated only on create')

        setTimeout(() => {
            test.equal(+rating.timestamp, ts1, 'dynamic default value should not be regenerated on access')
            test.equal(+rating2.timestamp, ts2, 'dynamic default value should not be regenerated on access')

            const hostname   = require('os').hostname,
                  createHash = require('crypto').createHash,
                  machineId  = createHash('md5').update(hostname()).digest('hex')

            test.equal(rating.origin, machineId, 'custom dynamic default value should be computed')

            test.end()
        }, 1)
    }, 1)
})

tap.test('Model methods', test => {
    const user = db.create('user')

    test.doesNotThrow(
        () => user.validate(),
        'an empty model should be valid'
    )
    test.notOk(Model.hasChanged(user), 'model not changed')
    test.same(Model.getChangeSet(user), {}, 'model not changed')
    user.username = 'schb'
    test.ok(Model.hasChanged(user), 'model changed')
    test.same(Model.getSchema(user), db.schemas.user, 'a schema should be predetermined')

    test.end()
})

tap.test('Model getters/setters', test => {
    const now    = new Date,
          user   = db.create('user', {
              age: '42'
          }),
          rating = db.create('rating', {
              reverseText: '!yrotciv',
              month:       now
          })

    test.type(rating.timestamp, Date, 'date getter should return a Date instance')
    test.equal(rating.month, now.getMonth(), 'custom setter should be applied')
    test.equal(rating.reverseText, 'victory!', 'custom getter should return proper values')

    test.end()
})

tap.test('Schema methods', test => {
    const user   = db.create('user'),
          schema = db.schemas.user,
          desc   = schema.descriptor

    test.same(schema.toJSON(), desc, "a schema's json representation should be its descriptor")
    test.same(schema.inspect(), desc, '`schema.inspect()` should be just an alias for `schema.toJSON()`')

    test.end()
})


console.log('!!!!!!!!!!')
const user = db.create('user', { age: 42 })

console.log(user.age)
console.log('age' in user)
console.log(Object.keys(user))
console.log(Object.getOwnPropertyNames(user))
console.log(user.toString())
console.log(JSON.stringify(user))

for (let key in user)
    console.log(key)

// for (let val of user)
//     console.log(val)

console.log('!!!!!!!!!!')