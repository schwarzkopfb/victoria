/**
 * Created by schwarzkopfb on 07/06/16.
 */

'use strict'

const { AssertionError } = require('assert'),
      co  = require('co'),
      tap = require('tap'),
      db  = require('./database'),
      url = require('./credentials')

db.connect(url)

tap.test('database reconnection', test => {
    test.throws(
        () => db.connect(),
        AssertionError,
        'db.connect() should be called exactly once'
    )
    db.quit()
    test.doesNotThrow(
        () => db.connect(),
        'db.connect() should be called again after disconnection'
    )

    test.end()
})

// WARNING: this drops all the data in the selected database!
db.client.flushdb()

tap.test('basic model functionality', test => {
    co(function *() {
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
        .then(() => {
            test.end()
            db.unref()
        })
        .catch(test.threw)
})
