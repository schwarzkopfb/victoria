/**
 * Created by schwarzkopfb on 07/06/16.
 */

'use strict'

const { inspect } = require('util'),
      { AssertionError } = require('assert'),
      co   = require('co'),
      test = require('tap'),
      db   = require('./database'),
      { Model } = require('..'),
      { url } = require('./credentials')


// note:
// redis module throws `TypeError: The options argument contains the property "extension" that is either unkown or of a wrong type`
// so we need to temporally remove that extension here...
delete Object.prototype.extension

db.connect(url)

// ...and then we should restore it
Object.prototype.extension = 'should not mess up anything else'

test.tearDown(() => db.unref())

test.test('basic functionality', test => {
    return co(function *() {
        let user = db.create('user', {
            username: 'test',
            age:      42
        })

        user.verified = true
        yield user.save()

        const id   = user.id
        let exists = yield db.exists('user', id)
        test.ok(exists, 'user should exist with auto-generated id')
        exists = yield db.exists('user', 'absent')
        test.notOk(exists, 'user should not exist with invalid id')

        user = yield db.find('user', id)
        test.ok(user, 'user should be fetched')
        test.equal(user.username, 'test', 'user.username should be correct')
        test.equal(user.age, 42, 'user.age should be correct')
        test.equal(user.verified, true, 'user.age should be correct')

        user = yield db.find('user', id, [ 'age', 'verified' ])
        test.ok(user, 'user should be fetched')
        test.equal(user.username, undefined, 'user.username should not be fetched')
        test.equal(user.age, 42, 'user.age should be correct')
        test.equal(user.verified, true, 'user.age should be correct')

        user = yield db.find('user', id, 'verified age')
        test.ok(user, 'user should be fetched')
        test.equal(user.username, undefined, 'user.username should not be fetched')
        test.equal(user.age, 42, 'user.age should be correct')
        test.equal(user.verified, true, 'user.age should be correct')

        // resave
        user.verified = false
        yield user.save()
        test.equal(user.verified, false, 'user.age should be correct')

        // fetch non-existing entity
        user = yield db.find('user', 'absent')
        test.equal(user, null, 'user should not be fetched')
    })
})

test.test('inspections', test => {
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
    test.same(user.toObject(), def, "an empty model's json should contain the initialized fields")
    test.same(user.toJSON(), def, '`model.toJSON()` should be just an alias for `model.toObject()`')
    test.same(user.inspect(), def, '`model.inspect()` should be just an alias for `model.toObject()`')
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

test.test('default values', test => {
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

test.test('private fields', test => {
    const user = db.create('user', {
        username: 'test',
        password: 'test'
    })

    test.equal(
        // note: there is also an md5 setter on pw field
        user.password, '098f6bcd4621d373cade4e832627b4f6',
        'private fields should be accessible directly'
    )
    test.doesNotThrow(
        () => user.password = 'kitten',
        'private fields should be accessible directly'
    )
    test.same(user.toObject(), { username: 'test' }, 'private fields should not be exposed')
    test.equal(
        JSON.stringify(user), '{"username":"test"}',
        'private fields should not appear in serialized objects'
    )
    test.same(
        Object.keys(user), [ 'username', 'password' ],
        'private fields should be listen in `Object.keys()` result'
    )

    let found
    for (let key in user)
        if (key === 'password')
            found = true

    test.ok(found, 'private fields should be enumerated')

    test.end()
})

test.test('instance methods', test => {
    test.test('select()', test => {
        const user = db.create('user', {
            username: 'test',
            password: 'test',
            age:      42,
            email:    'test@example.com'
        })

        test.same(
            user.select('username password'), { username: 'test' },
            'private fields should not be selected by default'
        )
        test.same(
            user.select([ 'username', 'password' ], true),
            {
                username: 'test',
                password: '098f6bcd4621d373cade4e832627b4f6'
            },
            'private fields should be selected explicitly'
        )

        db.define('model_select_test', {
            a: String,
            b: { default: 'test' }
        })

        const entity = db.create('model_select_test')

        test.same(entity.select('a'), {}) // `a` is empty
        entity.a = 'test'
        test.same(entity.select('a'), { a: 'test' })
        test.same(
            entity.select('a b'),
            { a: 'test', b: 'test' },
            'default value should be returned when an uninitialized field is selected'
        )

        test.end()
    })

    test.end()
})

test.test('static methods', test => {
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
    test.same(Model.getData(user), { username: 'schb' })

    test.end()
})

test.test('getters/setters', test => {
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
    const num        = +now
    test.equal(+rating.timestamp, num, 'date getter')
    rating.timestamp = num
    test.equal(+rating.timestamp, num, 'date getter')
    rating.value = 5
    test.equal(rating.value, '5.0', 'fixed number getter')
    rating.value = Math.PI
    test.equal(rating.value, '3.1', 'fixed number getter')
    test.throws(
        () => db.define('fixed_getter_test', { f: { fixed: 'test' } }),
        AssertionError,
        'fixed number getter should assert `digits` parameter'
    )
    test.throws(
        () => db.define('fixed_getter_test', { f: { fixed: -1 } }),
        AssertionError,
        'fixed number getter should assert `digits` parameter'
    )
    test.throws(
        () => db.define('fixed_getter_test', { f: { fixed: Math.PI } }),
        AssertionError,
        'fixed number getter should assert `digits` parameter'
    )

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
    user.customerId = null
    test.equal(user.customerId, '', 'trim setter with invalid value')
    user.customerId = '  Z-3241-5768 '
    test.equal(user.customerId, 'Z-3241-5768', 'trim setter')

    test.test('cut setter', test => {
        const text   = 'lorem ipsum',
              rating = db.create('rating', {
                  text:  text,
                  text2: text,
                  text3: text,
                  text4: text,
                  text5: text,
                  text6: text,
                  text7: null
              })

        test.equal(rating.text, 'ipsum')
        test.equal(rating.text2, 'ipsum')
        test.equal(rating.text3, 'lorem')
        test.equal(rating.text4, 'lorem')
        test.equal(rating.text5, 'ip')
        test.equal(rating.text6, 'lorem')
        test.equal(rating.text7, '')

        test.throws(
            () => db.define('cut_setter_test', { f: { cut: false } }),
            AssertionError,
            'no `start` nor `end` specified'
        )
        test.throws(
            () => db.define('cut_setter_test', { f: { cut: { from: Infinity } } }),
            AssertionError,
            '`from: Infinity` is not valid'
        )
        test.throws(
            () => db.define('cut_setter_test', { f: { cut: { from: -1 } } }),
            AssertionError,
            '`from: -1` is not valid'
        )
        test.throws(
            () => db.define('cut_setter_test', { f: { cut: { from: Math.PI } } }),
            AssertionError,
            '`from` should be integer'
        )
        test.doesNotThrow(
            () => db.define('cut_setter_test', { f: { cut: { to: Infinity } } }),
            '`to: Infinity` is valid'
        )
        test.throws(
            () => db.define('cut_setter_test2', { f: { cut: { to: -1 } } }),
            AssertionError,
            '`to: -1` is not valid'
        )
        test.throws(
            () => db.define('cut_setter_test2', { f: { cut: { to: Math.PI } } }),
            AssertionError,
            '`to` should be integer'
        )

        test.end()
    })

    test.test('escape setter', test => {
        test.throws(
            () => db.define('escape_setter_test', {
                text: { escape: 'fake' }
            }),
            AssertionError,
            'escape type should be asserted'
        )
        test.doesNotThrow(
            () => db.define('escape_setter_test', {
                html: { escape: 'html' },
                js:   { escape: 'js' },
                js2:  { escape: 'javascript' },
                js3:  { escape: 'JavaScript' }
            }),
            'escape should not throw if a valid type is provided'
        )

        const js      = "var test = 'test';\nalert('you are hacked!')\u001F",
              escaped = 'var test \\u003D \\u0027test\\u0027\\u003B\\u000Aalert(\\u0027you are hacked!\\u0027)\\u001F',
              entity  = db.create('escape_setter_test', {
                  html: '<h1>Winter is coming!</h1>',
                  js:   js,
                  js2:  js,
                  js3:  js
              })

        test.equal(entity.html, '&lt;h1&gt;Winter is coming!&lt;/h1&gt;')
        test.equal(entity.js, escaped)
        test.equal(entity.js2, escaped)
        test.equal(entity.js3, escaped)

        test.end()
    })

    test.test('upperCase/lowerCase getters', test => {
        db.define('case_getters_test', {
            lower:  { lower: true },
            lower2: { lowercase: true },
            lower3: { lowerCase: true },
            lower4: { lowerCase: true },
            upper:  { upper: true },
            upper2: { uppercase: true },
            upper3: { upperCase: true },
            upper4: { upperCase: true }
        })

        const text   = 'Lorem Ipsum',
              lower  = 'lorem ipsum',
              upper  = 'LOREM IPSUM',
              entity = db.create('case_getters_test', {
                  lower:  text,
                  lower2: text,
                  lower3: text,
                  lower4: null,
                  upper:  text,
                  upper2: text,
                  upper3: text,
                  upper4: null
              })

        test.equal(entity.lower, lower)
        test.equal(entity.lower2, lower)
        test.equal(entity.lower3, lower)
        test.equal(entity.lower4, '')
        test.equal(entity.upper, upper)
        test.equal(entity.upper2, upper)
        test.equal(entity.upper3, upper)
        test.equal(entity.upper4, '')

        test.end()
    })

    test.test('special cases of boolean getter', test => {
        return co(function *() {
            yield user.save()

            const key  = `user:${user.id}`,
                  hset = value =>
                      new Promise((ok, error) => {
                          db.client.hset(key, 'verified', value, err => {
                              if (err)
                                  error(err)
                              else
                                  ok()
                          })
                      })

            yield hset('true')
            yield user.fetch('verified')
            test.equal(user.verified, true, 'boolean getter')

            yield hset('1')
            yield user.fetch('verified')
            test.equal(user.verified, true, 'boolean getter')

            yield hset('false')
            yield user.fetch('verified')
            test.equal(user.verified, false, 'boolean getter')

            yield hset('0')
            yield user.fetch('verified')
            test.equal(user.verified, false, 'boolean getter')
        })
    })

    const password = 'victoria',
          user2    = db.create('user', { password }),
          hash     = require('crypto').createHash('md5')
                                      .update(password)
                                      .digest('hex')

    test.equal(user2.password, hash, "md5 setter should hash the user's password")
    user2.password = null
    test.equal(user2.password, '', 'md5 setter should return empty string if a falsy value has been provided')
    user2.password = ''
    test.equal(user2.password, '', 'md5 setter should return empty string if a falsy value has been provided')

    const profile = user2.profile = {
        test: 42,
        a:    {
            b: {
                c: [ 'hello', 'victori', { a: '!' } ]
            }
        }
    }

    const serialized = user2.toObject().profile
    test.type(serialized, 'string', 'json field should be serialized')
    test.same(profile, user2.profile, 'json field should be parsed back')
    test.notEqual(profile, user2.profile, 'parsed json field should have a new reference')
    test.same(JSON.parse(serialized), user2.profile, 'json field should be parsed properly')
    const profile2 = user2.profile2 = { a: 42 },
          serialized2 = user2.toObject().profile2
    test.type(serialized2, 'string', '`field: JSON` syntax should work either #1')
    test.same(profile2, user2.profile2, '`field: JSON` syntax should work either #2')
    test.notEqual(profile2, user2.profile2, '`field: JSON` syntax should work either #3')
    test.same(JSON.parse(serialized2), user2.profile2, '`field: JSON` syntax should work either #4')
    const profile3 = user2.profile3 = { test: [ 'a', 'r', 'r', 'a', 'y' ] },
          serialized3 = user2.toObject().profile3
    test.type(serialized3, 'string', '`field: { type: JSON }` syntax should work either #1')
    test.same(profile3, user2.profile3, '`field: { type: JSON }` syntax should work either #2')
    test.notEqual(profile3, user2.profile3, '`field: { type: JSON }` syntax should work either #3')
    test.same(JSON.parse(serialized3), user2.profile3, '`field: { type: JSON }` syntax should work either #4')
    const profile4 = user2.profile4 = { 'this contains spaces': 'as well', _: null },
          serialized4 = user2.toObject().profile4
    test.type(serialized4, 'string', "`field: { type: 'JSON' }` syntax should work either #1")
    test.same(profile4, user2.profile4, "`field: { type: 'JSON' }` syntax should work either #2")
    test.notEqual(profile4, user2.profile4, "`field: { type: 'JSON' }` syntax should work either #3")
    test.same(JSON.parse(serialized4), user2.profile4, "`field: { type: 'JSON' }` syntax should work either #4")
    const profile5 = user2.profile5 = [ 'arrays', 'should', 'also', 'work', '!' ],
          serialized5 = user2.toObject().profile5
    test.type(serialized5, 'string', "`field: { type: 'json' }` syntax should work either #1")
    test.same(profile5, user2.profile5, "`field: { type: 'json' }` syntax should work either #2")
    test.notEqual(profile5, user2.profile5, "`field: { type: 'json' }` syntax should work either #3")
    test.same(JSON.parse(serialized5), user2.profile5, "`field: { type: 'json' }` syntax should work either #4")
    ////
    Model.getData(user2).profile = 'test' // overwrite internal data with invalid json
    test.doesNotThrow(() => user2.profile, 'json parse error should be ignored')
    test.equal(user2.profile, null, 'invalid json should result in `null`')

    test.end()
})
