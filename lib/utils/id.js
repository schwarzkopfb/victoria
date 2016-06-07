/**
 * Utility that generates MongoDB-like object identifiers for our model instances.
 * See: https://docs.mongodb.com/manual/reference/method/ObjectId/
 *
 * Created by schwarzkopfb on 07/06/16.
 */

'use strict'

const { createHash } = require('crypto'),
      { hostname } = require('os'),
      PROCESS_ID = process.pid % 0xFFFF,
      MACHINE_ID = createHash('md5').update(hostname())
                                    .digest()
                                    .slice(0, 3)
                                    .toString('hex'),
      PREFIXES   = {
          '4': '00000000',
          '3': '000000',
          '2': '0000'
      }

let index = ~~(Math.random() * 0xFFFFFF)

function f(n, l) {
    const s = PREFIXES[ l ] + n.toString(16)
    return s.substring(s.length - l * 2)
}

function generateId() {
    const time    = ~~(Date.now() / 1000),
          counter = index++ % 0xFFFFFF

    return `${f(time, 4)}${f(MACHINE_ID, 3)}${f(PROCESS_ID, 2)}${f(counter, 3)}`
}

module.exports = generateId
