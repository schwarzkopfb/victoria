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

        process.nextTick(() => {
            if (this.listenerCount('error'))
                this.client.on('error', err =>
                    this.emit('error', ...arguments))
        })

        return this
    }

    schema(name, definition) {
        this.schemas[ name ] = new Schema(name, definition)
        return this
    }

    create(name, data) {
        const schema = this.schemas[ name ]
        assert(schema, `no schema found with the given name: '${name}'`)
        return new Model(schema, data, !!data)
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

exports = module.exports = Database

exports.Schema = Schema
exports.Model  = Model
