/**
 * Created by schwarzkopfb on 30/05/16.
 */

'use strict'

// this allows us to simply `tap test/*.js`
if (module === require.main) {
    require('tap').pass('done')
    return
}

// todo: replace 'tap' dev dependency, once my PR gets merged
Object.prototype.extension = 'should not mess up anything'

const Database = require('..'),
      db       = new Database

const user = {
    username:      {
        type:                      String,
        minlength:                 2, // alias for minLength
        max_length:                5, // alias for maxLength
        thisShouldBeSimplyIgnored: true // todo: or maybe an error should be raised instead...
    },
    password:      {
        type: String,
        md5:  true
    },
    age:           {
        type: Number,
        min:  0,
        max:  99,
        int:  true
    },
    birthDate:     Date,
    birthYear:     {
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

const { hostname }  = require('os'),
      { createHash } = require('crypto'),
      rating = {
          // user specified id field
          // now it's just a fallback to the internal spec,
          // but it should be recognised by the schema parser
          id: String,

          userId: {
              type:     String,
              required: true
          },

          value: {
              type:     Number,
              required: true,
              min:      1,
              max:      5,
              fixed:    1
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
          // it's a test of dynamic default values
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

db.on('error', err => {
    console.error(err && err.stack || err || 'unknown client error')
    process.exit(1)
})

module.exports = db

exports.schemas = {
    user,
    rating
}
