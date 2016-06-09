/**
 * Created by schwarzkopfb on 30/05/16.
 */

'use strict'

// todo: replace 'tap' dev dependency, once my PR gets merged
Object.prototype.extension = 'should not mess up anything'

const Database = require('..'),
      db       = new Database

const user = {
    username:      {
        type:       String,
        minlength:  2,
        max_length: 5
    },
    age:           {
        type: Number,
        min:  0,
        max:  99
    },
    birthDate: Date,
    birthYear: {
        length: 4
    },
    email:         {
        type:  String,
        email: true
    },
    verified:      Boolean,
    customerId:    {
        type:  String,
        match: /[A-Z]-[1-9][0-9]{3}-[1-9][0-9]{3}/
    },
    favoriteDay:   {
        type: String,
        enum: [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ]
    },
    maxLengthTest: {
        type:      String,
        maxLength: -1 // pointless
    },
    odd:           {
        type:     Number,
        validate: value => value % 2
    }
}

db.define('user', user)

const hostname   = require('os').hostname,
      createHash = require('crypto').createHash,
      rating     = {
          userId: {
              type:     String,
              required: true
          },

          value: {
              type:     Number,
              required: true,
              min:      1,
              max:      5
          },

          text: {
              type:    String,
              default: '-'
          },

          timestamp: {
              type:    Date,
              default: Date.now
          },

          // store a unique machine identifier,
          // where the entity has been created
          // it's a demo of dynamic default values
          origin: {
              type:    String,
              default: () => createHash('md5').update(hostname())
                                              .digest('hex')
          },

          month: {
              setter: value => value.getMonth()
          },

          reverseText: {
              getter: value => Array.from(value)
                                    .reverse()
                                    .join('')
          }
      }

db.define({ rating })

module.exports = db

exports.schemas = {
    user,
    rating
}
