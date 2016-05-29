/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const constants = {
    PING_INTERVAL: 10000,
    EMAIL_REG_EXP: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/g
}

module.exports = Object.freeze(constants)
