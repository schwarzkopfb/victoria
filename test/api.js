/**
 * Created by schwarzkopfb on 29/05/16.
 */

'use strict'

const { AssertionError } = require('assert'),
      { inspect } = require('util'),
      { Model } = require('..'),
      tap = require('tap'),
      db  = require('./database')

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

    test.equal(user.age, 42, 'model property should be accessible')
    test.notOk('username' in user, '`in` operator should work properly on models')
    test.ok('age' in user, '`in` operator should work properly on models')
    test.same(Object.keys(user), [ 'age' ], '`Object.keys()` should return only the keys of the changeset')
    test.same(Object.getOwnPropertyNames(user), [ 'age' ], '`Object.keys()` should return only the keys of the changeset')
    test.equal(user.toString(), '[object Model]', 'model string tag should be set properly')
    test.equal(JSON.stringify(user), '{"age":42}', 'result of JSON serialisation should contain the changed keys')

    let res = []
    for (let key in user)
        res.push(key)

    test.same(res, [ 'age' ], '`for...in` should enumerate correctly')

    res = []
    for (let val of user)
        res.push(val)

    test.same(res, [ 42 ], '`for...of` should iterate correctly')

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
    test.same(Model.getChangeSet(user), { username: 'schb' }, 'model changed')
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

    test.equal(rating.month, now.getMonth(), 'custom setter should be applied')
    test.equal(rating.reverseText, 'victory!', 'custom getter should return proper values')

    test.type(rating.timestamp, Date, 'date getter should return a Date instance')
    rating.timestamp = 'invalid'
    test.ok(isNaN(rating.timestamp), 'date getter should return NaN if the value is invalid')
    rating.timestamp = now
    const num = +now
    test.equal(+rating.timestamp, num, 'date getter')
    rating.timestamp = num
    test.equal(+rating.timestamp, num, 'date getter')

    user.verified = true
    test.equal(user.verified, true, 'boolean getter')
    user.verified = 0
    test.equal(user.verified, false, 'boolean getter')
    user.verified = Object
    test.equal(user.verified, true, 'boolean getter')
    user.verified = ''
    test.equal(user.verified, false, 'boolean getter')
    user.verified = 'true'
    test.equal(user.verified, true, 'boolean getter')

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

tap.test('Schema definition assertions', test => {
    test.doesNotThrow(
        () => db.create('user'),
        'schema name should be asserted'
    )
    test.throws(
        () => db.create('fake'), // absent schema type
        AssertionError,
        'schema name should be asserted'
    )
    test.doesNotThrow(
        () => db.create('user').username = 'test',
        'field name should be asserted'
    )
    test.throws(
        () => db.create('user').invalidField = true, // absent field name
        AssertionError,
        'field name should be asserted'
    )
    test.throw(
        () => db.define('test', { a: { type: 1 } }),
        TypeError,
        '`1` is an invalid type specifier'
    )
    test.throw(
        () => db.define('test', { a: { type: 'a' } }),
        TypeError,
        '`\'a\'` is an invalid type specifier'
    )
    test.throw(
        () => db.define('test', { a: Buffer }),
        TypeError,
        '`Buffer` is an invalid type specifier'
    )
    test.doesNotThrow(
        () => db.define('test1', { a: String }),
        '`String` is a valid type specifier'
    )
    test.doesNotThrow(
        () => db.define('test2', { a: Number }),
        '`Number` is a valid type specifier'
    )
    test.doesNotThrow(
        () => db.define('test3', { a: Boolean }),
        '`Boolean` is a valid type specifier'
    )
    test.doesNotThrow(
        () => db.define('test4', { a: Date }),
        '`Date` is a valid type specifier'
    )
    test.doesNotThrow(
        () => db.define('test5', { a: 'a' }),
        '`\'a\'` is a valid specifier'
    )
    test.doesNotThrow(
        () => db.define('test6', { a: 1 }),
        '`1` is a valid specifier'
    )
    test.doesNotThrow(
        () => db.define('test7', { a: true }),
        '`true` is a valid specifier'
    )
    test.doesNotThrow(
        () => db.define('test8', { a: new Date }),
        '`Date` instance is a valid specifier'
    )

    test.end()
})
