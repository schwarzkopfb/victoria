/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert       = require('assert'),
      EventEmitter = require('events'),
      Schema       = require('./Schema'),
      Model        = require('./Model'),
      key          = require('./utils/key'),
      symbols      = require('./symbols'),
      {
          client: _client,
          closed: _closed
      } = symbols,
      { createClient }       = require('redis'),
      { REGEXP_SCHEMA_NAME } = require('./constants')

class Database extends EventEmitter {
    constructor(settings) {
        if (settings)
            assert.equal(typeof settings, 'object', 'if provided then settings must be an object')

        super()

        this.schemas  = {}
        this.settings = Object.assign({}, Database.defaultSettings, settings || {})
    }

    connect() {
        assert(!this[ _client ], 'database.connect() called more than once')
        assert(!this[ _closed ], 'database connection already closed')

        let client

        if (arguments.length)
            client = createClient(...arguments)
        else if (this.settings.url)
            client = createClient(this.settings.url)
        else
            client = createClient(this.settings)

        this[ _client ] = client
        setupEvents(client, this)

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
                        `cannot set '${name}.id' directly. It's auto-generated on save or comes from a fetch() call.`
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
            this.client.exists(key(name, id), (err, exists) => {
                /* istanbul ignore if */
                if (err)
                    error(err)
                else
                    ok(exists)
            })
        })
    }

    get client() {
        const client = this[ _client ]
        assert(client, 'database.connect() not called')
        return client
    }

    set client(value) {
        throw new TypeError("cannot assign to read only property 'client' of database")
    }

    unref() {
        this.client.unref()
        this[ _closed ] = true
        this[ _client ] = null
        return this
    }

    quit() {
        this.client.quit()
        this[ _closed ] = true
        this[ _client ] = null
        return this
    }
}

Database.defaultSettings = {
    prefix:   null,
    host:     '127.0.0.1',
    port:     6379,
    password: null,
    path:     null,
    db:       0,
    url:      null
};

// add direct getters/setters for settings (convenience)
Object.keys(Database.defaultSettings)
      .forEach(key =>
                   Object.defineProperty(Database.prototype, key, {
                       get: function () {
                           return this.settings[ key ]
                       },
                       set: function (value) {
                           this.settings[ key ] = value
                       }
                   }))

// proxy relevant client events through Database instance (convenience)
function setupEvents(client, db) {
    [
        'connect',
        'end',
        'error',
        'ready',
        'reconnecting'
    ]
        .forEach(event =>
                     client.on(event, (a1, a2, a3, a4, a5) => {
                         // inelegant, but faster than db.emit.apply(...)
                         // and covers nearly all the practical use cases
                         db.emit(event, a1, a2, a3, a4, a5)

                         /* this resolves to the arguments of setupEventsNT and
                          * not the arguments of the directly enclosing anonymous fn
                          * why?
                          */
                         // db.emit(event, ...arguments)
                     }))
}

exports = module.exports = Database

exports.Schema = Schema
exports.Model  = Model
