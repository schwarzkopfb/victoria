/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

exports.boolean = function booleanSetter(value) {
    return value ? 1 : 0
}

exports.date = function dateSetter(value) {
    if (
        value instanceof Date ||
        !isNaN(value)
    )
        return +value
    else
        return +new Date(value)
}

