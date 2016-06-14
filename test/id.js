/**
 * Created by schwarzkopfb on 14/06/16.
 */

'use strict'

const test     = require('tap'),
      Database = require('..'),
      { url }  = require('./credentials'),
      db       = new Database,
      user     = {
          id:        Number, // not necessary
          name:      String,
          timestamp: Date.now
      }

test.tearDown(() => db.unref())

// custom id generator fn
db.id = (db, schema, model) => {
    test.type(db, Database)
    test.type(schema, Database.Schema)
    test.type(model, Database.Model)

    return new Promise((ok, error) => {
        db.client.incr(`id:${schema.name}`, (err, id) => {
            if (err)
                error(err)
            else
                ok(id)
        })
    })
}

db.define({ user })
  .connect(url)

// WARNING: this drops all the data in the selected database!
db.client.flushdb()

test.test('custom id generator function', test => {
    db.create('user', { name: 'test' })
      .save()
      .then(user => {
          test.equal(user.id, 1, 'model should have a numeric id')
          test.end()
      })
      .catch(test.threw)
})
