/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

// this allows us to simply `tap test/*.js`
if (module === require.main) {
    require('tap').pass('done')
    return
}

const assert = require('assert'),
      {
          DEV_REDIS_HOST: host,
          DEV_REDIS_PORT: port,
          DEV_REDIS_PASSWORD: password,
          DEV_REDIS_VICTORIA: db
      } = process.env

assert(host, 'redis host not specified')
assert(port, 'redis port not specified')
assert(password, 'redis password not specified')
assert.notEqual(db, undefined, 'redis database index not specified')

const safeUrl = `redis://${host}:${port}/${db}`

module.exports = {
    host,
    port,
    password,
    db,
    url: `${safeUrl}?password=${encodeURIComponent(password)}`,
    safeUrl
}
