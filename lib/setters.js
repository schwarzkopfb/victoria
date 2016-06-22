/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const { createHash } = require('crypto')

// better stack trace
exports = module.exports = new class setters {
}

exports.boolean = function () {
    return function booleanSetter(value) {
        return value ? 1 : 0
    }
}

exports.date = function () {
    return function dateSetter(value) {
        if (value instanceof Date || !isNaN(value))
            return +value
        else
            return +Date.parse(value)
    }
}

exports.md5 = function () {
    return function md5Setter(value) {
        if (typeof value !== 'string' || !value.length)
            return ''
        else
            return createHash('md5').update(value).digest('hex')
    }
}
