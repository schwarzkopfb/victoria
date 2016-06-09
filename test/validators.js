/**
 * Created by schwarzkopfb on 30/05/16.
 */

'use strict'

const tap = require('tap'),
      db  = require('./database')

function noop() {
}

function test(name, schema, fn, resolved, rejected) {
    if (typeof schema !== 'string') {
        fn     = schema
        schema = 'user'
    }

    if (!resolved)
        resolved = noop

    if (!rejected)
        rejected = noop

    let entity = db.create(schema)

    if (fn)
        fn(entity)

    tap.test(name, test => {
        try {
            entity.validate()
            resolved(test, entity)
        }
        catch (ex) {
            test.type(ex, 'ValidationError')
            rejected(test, ex)
        }

        test.end()
    })
}

function fail(name, schema, fn) {
    test(
        name, schema, fn,
        (test, res) =>
            test.notOk(res, 'unexpected result')
    )
}

function pass(name, schema, fn) {
    test(
        name, schema, fn,

        (test, res) =>
            test.ok(res, 'result expected'),

        (test, err) => test.threw(err)
    )
}

fail('min validator', user => user.age = -1)
fail('max validator', user => user.age = 100)
fail('minLength validator', user => user.username = 'a')
fail('minLength validator', user => user.username = '')
fail('maxLength validator', user => user.username = 'too_long')
fail('maxLength validator', user => user.maxLengthTest = '')
fail('regExp validator', user => user.customerId = 'missing')
fail('eMail validator', user => user.email = 'invalid@address')
fail('enum validator', user => user.favoriteDay = 'test')
fail('required validator', 'rating', rating => rating.value = null)
fail('custom validator', user => user.odd = 2)
fail('date validator', user => user.birthDate = 'invalid')
fail('date validator', user => user.birthDate = -1)
fail('length validator', user => user.birthYear = '93')

pass('min validator', user => user.age = 1)
pass('max validator', user => user.age = 22)
pass('minLength validator', user => user.username = 'victo')
pass('maxLength validator', user => user.username = 'app')
pass('regExp validator', user => user.customerId = 'A-1234-4567')
pass('eMail validator', user => user.email = 'schwarzkopfb@icloud.com')
pass('enum validator', user => user.favoriteDay = 'fri')
pass('required validator', 'rating', rating => {
    rating.userId = 1
    rating.value  = 3
})
pass('custom validator', user => user.odd = 1)
pass('date validator', user => user.birthDate = 1)
pass('date validator', user => user.birthDate = new Date)
pass('length validator', user => user.birthYear = '1993')
