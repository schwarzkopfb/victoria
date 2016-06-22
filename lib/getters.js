/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

// better stack trace
exports = module.exports = new class getters {}

exports.boolean = function () {
    return function booleanGetter(value) {
        switch (value) {
            case 'false':
            case '0':
                return false

            case 'true':
            case '1':
                return true

            default:
                return Boolean(value)
        }
    }
}

exports.date = function () {
    return function dateGetter(value) {
        if (isNaN(value))
            return NaN
        else
            return new Date(+value)
    }
}

exports.number = function () {
    return function numberGetter(value) {
        return +value
    }
}

exports.fixed = function (n) {
    return function fixedNumberGetter(value) {
        return (+value).toFixed(n)
    }
}

