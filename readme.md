[![view on npm](http://img.shields.io/npm/v/victoria.svg?style=flat-square)](https://www.npmjs.com/package/victoria)
[![downloads per month](http://img.shields.io/npm/dm/victoria.svg?style=flat-square)](https://www.npmjs.com/package/victoria)
[![node version](https://img.shields.io/badge/node-%3E=6-brightgreen.svg?style=flat-square)](https://nodejs.org/download)
[![build status](https://img.shields.io/travis/schwarzkopfb/victoria.svg?style=flat-square)](https://travis-ci.org/schwarzkopfb/victoria)
[![test coverage](https://img.shields.io/coveralls/schwarzkopfb/victoria.svg?style=flat-square)](https://coveralls.io/github/schwarzkopfb/victoria)
[![license](https://img.shields.io/npm/l/express.svg?style=flat-square)](https://github.com/schwarzkopfb/victoria/blob/development/LICENSE)

# Victoria

Simple object-hash relational mapper library for [Redis](http://redis.io/), targeting [Node.js](https://nodejs.org/) 6 and above.

## This project is a work in progress

**Be aware!** Before the project reaches its first release-candidate version,
APIs may change without warning and documentation may differ from the actual code base.

## Usage

```js

const Database = require('victoria'),
      db       = new Database

db.define('user', {
    name: {
        type: String,
        index: [ 'unique', 'matcing' ],
        minLength: 4,
        maxLength: 16,
        match: /^[a-z0-9_.]+$/
    },
    password: {
        type: String,
        private: true,
        md5: true
    },
    age: {
        type: Number,
        index: 'range',
        min: 0,
        max: 99
    },
    status: {
        type: String,
        index: 'matching',
        enum: [ 'pending', 'verified', 'suspended' ],
        default: 'pending'
    }
})

db.connect()

// create record

db.create('user', {
       name: 'foo',
       password: 'bar',
       age: 42
   })
   .save()
   .then(user => console.log(`user created: ${user.id}`))
   .catch(err => console.error('something exploded! :(' + '\n' + err.stack))

// fetch record with id

db.find('user', '576d132b12b437226f116ea6')
  .then(user => console.log(user ? `${user.name} is ${user.age} years old` : 'user not found :('))

// query records

db.query('user')
  .where({ age: { '>=': 18 } })
  .except({ status: [ 'pending', 'suspended' ] })
  .fetch()
  .then(users => console.log(users))

const search = 'adam'

db.find('user', { name: `*${search}*` })
  .fetch()
  .then(console.log)

```

## Installation

With npm:

    npm install victoria

## Credits

`victoria` borrows concepts and inspiration from [Michel Martens](http://soveran.com/)' [ohm](https://github.com/soveran/ohm).

## Topics (to be explained later)

* Model functionality
  * Serialization & private fields (`toObject()`, `toJSON()`, `select()`)
  * Update data
  * Validation
  * Setters
  * Getters
  * Dynamic defaults
* Indices
* References & population
* Record creation
* Querying
* CLI (coming soon)

## Todo

* General field list parsing & cache
* Better structure to cover Redis data types:
* `Model`
  * `Hash` (extract from the current `Model` implementation)
  * `Collection`
    * `Set`
    * `SortedSet`
    * `List`

## License

[MIT license](https://github.com/schwarzkopfb/victoria/blob/master/LICENSE)
