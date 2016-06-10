/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert       = require('assert'),
      EventEmitter = require('events'),
      Schema       = require('./Schema'),
      Model        = require('./Model'),
      connect      = require('./utils/connect'),
      _client      = Symbol('client'),
      { RedisClient } = require('redis'),
      { REGEXP_SCHEMA_NAME } = require('./constants')

class Database extends EventEmitter {
    constructor() {
        super()
        this.schemas = {}
    }

    connect() {
        assert(!this[ _client ], 'database.connect() called more than once')
        this.client = connect(...arguments)
        process.nextTick(setupEventsNT, this)
        return this
    }

    define(name, definition) {
        // is it an object containing multiple definitions?
        if (
            arguments.length === 1 &&
            typeof name === 'object'
        ) {
            definition = name

            for (let name in definition)
                if (definition.hasOwnProperty(name))
                    this.define(name, definition[ name ])

            return this
        }

        assert.equal(typeof name, 'string', 'schema name must be a string')
        assert(REGEXP_SCHEMA_NAME.test(name), `schema name must match ${REGEXP_SCHEMA_NAME}`)
        assert(!(name in this.schemas), `'${name}' schema already exists`)

        this.schemas[ name ] = new Schema(this, name, definition)
        return this
    }

    create(name, data) {
        const schema = this.schemas[ name ]
        assert(schema, `'${name}' schema not exists`)
        const model = new Model(schema)

        // fill model with initial data
        if (data) {
            for (let key in data)
                if (data.hasOwnProperty(key)) {
                    assert.notEqual(
                        key, 'id',
                        `cannot set '${name}.id' directly. Use database.find(name, id) instead.`
                    )
                    model[ key ] = data[ key ]
                }
        }

        return model
    }

    find(name, id, fields) {
        assert(id, `no identifier provided to find '${name}'`)
        const schema = this.schemas[ name ]
        assert(schema, `'${name}' schema not exists`)
        const model = new Model(schema, id)
        return model.fetch(fields)
    }

    exists(name, id) {
        assert(id, `no identifier provided to check existence of '${name}'`)
        const schema = this.schemas[ name ]
        assert(schema, `'${name}' schema not exists`)
        return new Promise((ok, error) => {
            this.client.exists(this.keyFor(name, id), (err, exists) => {
                /* istanbul ignore if */
                if (err)
                    error(err)
                else
                    ok(exists)
            })
        })
    }

    keyFor(entityName, id, relation) {
        let key = entityName

        if (this.prefix)
            key = `${this.prefix}:${entityName}`

        if (id)
            key += `:${id}`

        if (relation)
            key += `.${relation}`

        return key
    }

    get client() {
        const client = this[ _client ]
        assert(client, 'database.connect() not called')
        return client
    }

    set client(client) {
        assert(client instanceof RedisClient, 'client must be a RedisClient instance')
        this[ _client ] = client
    }

    unref() {
        this.client.unref()
        this[ _client ] = null
        return this
    }

    quit() {
        this.client.quit()
        this[ _client ] = null
        return this
    }

    end(flush) {
        this.client.end(flush)
        this[ _client ] = null
        return this
    }
}

// Database.prototype.prefix = 'vict' // todo: proper configuration functionality

// proxy client events through Database instance for convenience
function setupEventsNT(db) {
    [
        'connect',
        'end',
        'error',
        'ready',
        'reconnecting'
    ]
        .forEach(event =>
                     db.client.on(event, (a1, a2, a3, a4, a5) => {
                         db.emit(event, a1, a2, a3, a4, a5) // inelegant

                         // this resolves to the arguments of setupEventsNT and
                         // not the arguments of the directly enclosing anonymous fn
                         // why?
                         // db.emit(event, ...arguments)
                     }))
}

exports = module.exports = Database

exports.Schema = Schema
exports.Model  = Model
