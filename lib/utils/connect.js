/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const redis = require('redis'),
      { PING_INTERVAL } = require('../constants')

function createConnection(client) {
    if (!(client instanceof redis.RedisClient))
        client = redis.createClient(...arguments)

    setInterval(() => client.ping(), PING_INTERVAL).unref()

    return client
}

module.exports = createConnection
