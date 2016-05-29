/**
 * Created by schwarzkopfb1 on 23/05/16.
 */

'use strict'

const assert   = require('assert'),
      Database = require('../'),
      url      = require('./credentials'),
      db       = new Database,
      { Schema, Model } = Database

db.schema('user', {
    username:   {
        type:      String,
        maxLength: 5
    },
    age:        Number,
    email:      {
        type:  String,
        email: true
    },
    customerId: {
        type:   String,
        regExp: /[A-Z]-[1-9][0-9]{3}-[1-9][0-9]{3}/
    }
})

assert.throws(
    () => db.create('fake'),
    assert.AssertionError,
    'schema name must be asserted'
)

let user1 = db.create('user')

assert(user1 instanceof Model, 'user must be a Model instance')
assert(!Model.hasChanged(user1), 'model not changed')
assert.deepEqual(user1, {}, 'model is empty')
assert.deepEqual(Model.getChangeSet(user1), {}, 'model not changed')

function error(message, tracer) {
    tracer.message = message || ''
    console.error(tracer.stack)
    process.exit(1)
}

function captureStack() {
    const err = new Error
    Error.captureStackTrace(err, captureStack)
    return err
}

function shouldFail(promise) {
    const tracer = captureStack()

    promise.then(res => res && error('unexpected result', tracer))
           .catch(err => err || error('expected error', tracer))
}

function shouldPass(promise) {
    const tracer = captureStack()

    promise.then(res => res || error('expected result', tracer))
           .catch(err => err && error('unexpected error', tracer))
}

user1.username = 'schwarzkopfb'

shouldFail(user1.save())

let user2 = db.create('user')

user2.username = 'schb'

shouldPass(user2.save())

assert.deepEqual(Model.getData(user2), {}, 'model were initialised with an empty object')
assert(Model.hasChanged(user2), 'model has been changed')
assert.equal(user2.username, 'schb', 'username must be accessible via getter')
assert.deepEqual(Model.getChangeSet(user2), { username: 'schb' }, 'username has been changed')

let user3 = db.create('user', { username: 'schwarzkopfb' })

shouldFail(user3.save())

let user4 = db.create('user')

user4.customerId = 'missing'

shouldFail(user4.save())

let user5 = db.create('user', { customerId: 'A-1234-4567' })

// shouldPass(user5.save())
user5.save().catch(err => console.error(err))

db.schema('post', {
    title: {
        type:     String,
        required: true
    },

    body: String
})

const post1 = db.create('post')

post1.save().catch(err => console.error(err.stack))

// db.connect(url)
