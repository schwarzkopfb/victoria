/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert = require('assert')

exports.boolean = () => function booleanGetter(value) {
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

exports.date = () => function dateGetter(value) {
    if (isNaN(value))
        return NaN
    else
        return new Date(+value)
}

exports.number = () => function numberGetter(value) {
    return +value
}

exports.fixed = digits => {
    assert.equal(typeof digits, 'number', 'digits for fixed getter must be a number')
    assert(digits >= 0, 'digits for fixed getter must be greater than or equal to zero')
    assert(digits % 1 === 0, 'digits for fixed getter must be an integer number')

    return function fixedNumberGetter(value) {
        return (+value).toFixed(digits)
    }
}

exports.json = () => function jsonGetter(value) {
    try {
        var res = JSON.parse(value)
    }
    catch (ex) {
        var err = ex
    }

    return err ? null : res
}

exports.lowerCase = () => function lowerCaseGetter(value) {
    return value ? value.toString().toLowerCase() : ''
}
exports.lower = exports.lowercase = exports.lowerCase

exports.upperCase = () => function upperCaseGetter(value) {
    return value ? value.toString().toUpperCase() : ''
}
exports.upper = exports.uppercase = exports.upperCase
