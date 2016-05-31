/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert       = require('assert'),
      EventEmitter = require('events'),
      Schema       = require('./Schema'),
      Model        = require('./Model'),
      connect      = require('./utils/connect')

class Database extends EventEmitter {
    constructor() {
        super()
        this.schemas = []
    }

    connect() {
        if (this.client)
            return this

        this.client = connect(...arguments)
        process.nextTick(setupEventsNT)
        return this
    }

    define(name, definition) {
        assert(!(name in this.schemas), `'${name}' schema already exists`)
        this.schemas[ name ] = new Schema(name, definition)
        return this
    }

    create(name, data) {
        const schema = this.schemas[ name ]
        assert(schema, `'${name}' schema not exists`)
        return new Model(schema, data)
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

// proxy client events through Database instances for convenience
function setupEventsNT(db) {
    [
        'connect',
        'end',
        'error',
        'ready',
        'reconnecting'
    ]
        .forEach(event => {
            if (db.listenerCount(event))
                db.client.on(event, err =>
                    db.emit(event, ...arguments))
        })
}

exports = module.exports = Database

exports.Schema = Schema
exports.Model  = Model
