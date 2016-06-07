/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const constants = {
    PING_INTERVAL:      10000,
    REGEXP_SCHEMA_NAME: /^[a-zA-Z0-9_]+$/,
    REGEXP_EMAIL:       /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
}

module.exports = Object.freeze(constants)
