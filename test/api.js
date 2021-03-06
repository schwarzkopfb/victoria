/**
 * Created by schwarzkopfb on 29/05/16.
 */

'use strict'

const { AssertionError } = require('assert'),
      only        = require('only'),
      manifest    = require('../package.json'),
      Database    = require('..'),
      test        = require('tap'),
      db          = require('./database'),
      credentials = require('./credentials')

// note:
// redis module throws `TypeError: The options argument contains the property "extension" that is either unknown or of a wrong type`
// so we need to temporally remove that extension before connection tests
function removeObjectExtension() {
    delete Object.prototype.extension
}

function restoreObjectExtension() {
    Object.prototype.extension = 'should not mess up anything else'
}

test.test('exposition', test => {
    test.type(Database, 'function', 'main export should be the `Database` constructor function')
    const db = new Database
    test.pass('`Database` constructor should be used with `new`')

    test.strictEqual(Database, Database.Database, 'Database should have a static reference to itself')

    test.type(Database.Schema, 'function', 'Database.Schema should be a constructor function')
    const schema = new Database.Schema(db, 'test')
    test.pass('`Schema` constructor should be used with `new`')

    test.type(Database.Field, 'function', 'Database.Field should be a constructor function')
    const field = new Database.Field(schema, 'test')
    test.pass('`Field` constructor should be used with `new`')

    test.type(Database.Model, 'function', 'Database.Model should be a constructor function')
    new Database.Model(schema)
    test.pass('`Model` constructor should be used with `new`')

    test.type(Database.Validator, 'function', 'Database.Validator should be a constructor function')
    new Database.Validator(field)
    test.pass('`Validator` constructor should be used with `new`')

    test.type(Database.ValidationError, 'function', 'Database.ValidationError should be a descendant of assert.AssertionError')
    const err = new Database.ValidationError(schema, field, 'test', '!=', 'test', 'test')
    test.type(err, AssertionError, '`ValidationError` should be a descendant of assert.AssertionError');

    [
        'validators',
        'constants',
        'getters',
        'setters',
        'symbols'
    ]
        .forEach(name => {
            const exp = Database[ name ]
            test.type(exp, 'object', `${name} should be exposed`)
            test.ok(Object.keys(exp).length, `${name} should contain at least one key`)
        })

    test.equal(Database.version, manifest.version, 'module version should be exposed')

    test.end()
})

test.test('Schema methods', test => {
    const user   = db.create('user'),
          schema = db.schemas.user,
          desc   = schema.descriptor

    test.same(schema.toJSON(), desc, "a schema's json representation should be its descriptor")
    test.same(schema.inspect(), desc, '`schema.inspect()` should be just an alias for `schema.toJSON()`')

    test.end()
})

test.test('Schema definition assertions', test => {
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
    test.throws(
        () => db.define('invalid_desc_prop_test', { a: { invalidDescriptorProperty: true } }),
        AssertionError,
        'invalid descriptor property should be asserted'
    )

    test.end()
})

test.test('Database api', test => {
    test.throws(
        () => db.client = 42,
        TypeError,
        'database.client should be asserted'
    )

    test.test('convenience getters/setters', test => {
        const keys = Object.keys(Database.defaultSettings)

        // getters
        keys.forEach(key => test.equal(db[ key ], db.settings[ key ]))

        // setters
        keys.forEach((key, i) => db[ key ] = `test ${i}`)
        const expected = keys.reduce((settings, key, i) => {
            settings[ key ] = `test ${i}`
            return settings
        }, {})
        test.same(db.settings, expected)

        // reference
        Database.defaultSettings.test = 'test'
        test.equal(db.settings.test, undefined, 'default settings object should be cloned')
        const obj    = { a: 1 },
              testDb = new Database(obj)
        test.equal(testDb.settings.a, 1, 'provided settings object should be cloned')
        obj.b = 2
        test.equal(testDb.settings.b, undefined, 'provided settings object should be cloned')
        test.equal(Database.defaultSettings.a, undefined, 'instance settings should not affect default settings')
        test.equal(Database.defaultSettings.b, undefined, 'instance settings should not affect default settings')

        test.end()
    })

    test.test('(re)connection', test => {
        removeObjectExtension()
        test.tearDown(restoreObjectExtension)

        const credUrl  = only(credentials, 'url'),
              credHPPD = only(credentials, [ 'host', 'port', 'password', 'db' ]),
              dbs      = [
                  new Database,
                  new Database,
                  new Database(credentials),
                  new Database(credUrl),
                  new Database(credHPPD)
              ],
              exitFns  = [ 'quit', 'unref' ]

        // 1
        dbs[ 0 ].url = credentials.url

        // 2
        let db      = dbs[ 1 ]
        db.db       = credentials.db
        db.host     = credentials.host
        db.port     = credentials.host
        db.password = credentials.password

        dbs.forEach(db =>
                        test.doesNotThrow(
                            () => db.connect(),
                            'db.connect() should be called once'
                        ))

        dbs.forEach(db =>
                        test.throws(
                            () => db.connect(),
                            AssertionError,
                            'cannot connect more then once'
                        ))

        // close database connections with different exit fns
        const m = exitFns.length
        dbs.forEach((db, i) => db[ exitFns[ i % m ] ]())

        dbs.forEach(db =>
                        test.throws(
                            () => db.connect(),
                            AssertionError,
                            'cannot reconnect manually after disconnection'
                        ))

        test.test('database.connect() signatures', test => {
            db = new Database

            test.doesNotThrow(
                () => db.connect(credentials.url),
                'db.connect() should accept the same arguments as redis.createClient()'
            )

            db.quit()
            db = new Database

            test.doesNotThrow(
                () => db.connect(credUrl),
                'db.connect() should accept the same arguments as redis.createClient()'
            )

            db.quit()
            db = new Database

            test.doesNotThrow(
                () => db.connect(credHPPD),
                'db.connect() should accept the same arguments as redis.createClient()'
            )

            db.quit()
            db = new Database

            test.doesNotThrow(
                () => db.connect(
                    credentials.port,
                    credentials.host,
                    only(credentials, 'password')
                ),
                'db.connect() should accept the same arguments as redis.createClient()'
            )

            db.quit()

            test.end()
        })

        test.end()
    })

    test.end()
})

test.test('extensions', test => {
    function myTestGetter() {
        return v => v * 2
    }

    function myTestSetter() {
        return v => v / 2
    }

    const Validator = Database.Validator

    class MyValidator extends Validator {
        test(value) {
            if (value <= 42)
                return

            this.fail(null, null, null, 'oh no!')
        }
    }

    Database.register.getter('test', myTestGetter)
    Database.register.setter('test', myTestSetter)
    Database.register.validator('test', MyValidator)

    db.define('test', {
        test: {
            type:    Number,
            default: 1,
            test:    true
        }
    })

    // getter

    const entity = db.create('test')

    test.equal(entity.test, 2, 'custom getter should be registered')

    // setter

    entity.test = 4

    test.equal(entity.toObject().test, 2, 'custom setter should be registered')

    // validator

    test.doesNotThrow(() => entity.validate(), 'custom validator should not fail')
    entity.test = 420
    test.throws(() => entity.validate(), Database.ValidationError, 'custom validator should fail')

    // validator aliasing

    class TestError extends Error {
    }

    class tv1 extends Validator {
        test() {
            throw new TestError
        }
    }

    tv1.alias = 't1'

    class tv2 extends Validator {
        test() {
            throw new TestError
        }
    }

    tv2.aliases = [ 't2_1', 't2_2' ]

    Database.register.validator('test1', tv1)
    Database.register.validator('test2', tv2)

    db.define('test_alias1', {
        f: { t1: true }
    })

    const ta1 = db.create('test_alias1', { f: 1 })

    test.throws(
        () => ta1.validate(),
        TestError,
        'custom validator aliases should work'
    )

    db.define('test_alias2', {
        f: { t2_2: true }
    })

    const ta2 = db.create('test_alias1', { f: 1 })

    test.throws(
        () => ta2.validate(),
        TestError,
        'custom validator aliases should work'
    )

    test.end()
})
