/**
 * Created by schwarzkopfb on 30/05/16.
 */

'use strict'

const Database = require('..'),
      db       = new Database

db.define('user', {
    username: {
        type:      String,
        minLength: 2,
        maxLength: 5
    },
    age: {
        type: Number,
        min:  0,
        max:  99
    },
    email: {
        type:  String,
        email: true
    },
    customerId: {
        type:  String,
        match: /[A-Z]-[1-9][0-9]{3}-[1-9][0-9]{3}/
    },
    favoriteDay: {
        type: String,
        enum: [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ]
    },
    maxLengthTest: {
        type:      String,
        maxLength: -1 // pointless
    }
})

db.define('rating', {
    userId: {
        type: String,
        required: true
    },

    value: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
})

module.exports = db
