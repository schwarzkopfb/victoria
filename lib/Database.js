/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert       = require('assert'),
      EventEmitter = require('events'),
      Schema       = require('./Schema'),
      Model        = require('./Model'),
      connect      = require('./utils/connect'),
      { REGEXP_SCHEMA_NAME } = require('./constants')

class Database extends EventEmitter {
    constructor() {
        super()
        this.schemas = {}
    }

    connect() {
        if (this.client)
            return this

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

        this.schemas[ name ] = new Schema(name, definition)
        return this
    }

    create(name, data) {
        const schema = this.schemas[ name ]
        assert(schema, `'${name}' schema not exists`)
        const model = new Model(schema)

        // fill model with initial data
        if (data) {
            for (let key in data)
                if (data.hasOwnProperty(key))
                    model[ key ] = data[ key ]
        }

        return model
    }

    unref() {
        this.client.unref()
        return this
    }

    quit() {
        this.client.quit()
        return this
    }

    end(flush) {
        this.client.end(flush)
        return this
    }
}

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
                     db.client.on(event, err =>
                         db.emit(event, ...arguments)))
}

exports = module.exports = Database

exports.Schema = Schema
exports.Model  = Model
