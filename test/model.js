/**
 * Created by schwarzkopfb on 07/06/16.
 */

'use strict'

const //tap = require('tap'),
      db  = require('./database'),
      url = require('./credentials')

db.connect(url)

// WARNING: this drops all the data in the selected database!
db.client.flushdb()

db.client.keys('*', (err, keys) => {
    if (err)
        console.error(err.stack)
    else
        console.log(keys)

    db.unref()
})
