/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const assert = require('assert'),
      { createHash } = require('crypto')

exports.boolean = () => function booleanSetter(value) {
    return value ? 1 : 0
}

exports.date = () => function dateSetter(value) {
    if (value instanceof Date || !isNaN(value))
        return +value
    else
        return +Date.parse(value)
}

exports.md5 = () => function md5Setter(value) {
    if (typeof value !== 'string' || !value.length)
        return ''
    else
        return createHash('md5').update(value).digest('hex')
}

exports.json = () => function jsonSetter(value) {
    return JSON.stringify(value)
}

exports.trim = () => function trimSetter(value) {
    return value ? value.toString().trim() : ''
}

exports.cut = options => {
    let from, to

    if (options) {
        const otype = typeof options

        assert(
            otype === 'object' || otype === 'number',
            'option for the `cut` setter must be a number or object'
        )

        from = 0
        to   = Infinity

        if (otype === 'object') {
            from = options.from || options.start || 0
            to   = options.to || options.end || Infinity

            assert.equal(
                typeof from, 'number',
                '`options.start` object for the `cut` setter must be a number'
            )
            assert.equal(
                typeof to, 'number',
                '`options.end` object for the `cut` setter must be a number'
            )
        }
        else
            to = options

        if (from === Infinity || from < 0 || from % 1 !== 0)
            assert.fail(from, '0', "`options.start` for the `cut` setter must be an integer that's greater than or equal to zero", '>=')


        if (to < 0 || to % 1 !== 0 && to !== Infinity)
            assert.fail(to, '0', "`options.end` for the `cut` setter must be an integer that's greater than or equal to zero", '>=')
    }
    else
        assert.fail(null, null, 'no `start` nor `end` is specified for the `cut` setter')

    return function cutSetter(value) {
        return value ? value.toString().substring(from, to) : ''
    }
}

const ESCAPE_MAP = {
    '38': '\\u0026', // & (ampersand)
    '60': '\\u003C', // < (less-than sign)
    '62': '\\u003E', // > (greater-than sign)
    '39': '\\u0027', // ' (apostrophe)
    '34': '\\u0022', // " (quotation mark)
    '61': '\\u003D', // = (equal sign)
    '45': '\\u002D', // - (hyphen-minus)
    '59': '\\u003B', // ; (semicolon)
    '92': '\\u005C'  // \ (backslash)
}

exports.escape = type => {
    switch (type) {
        case 'html':
            return require('escape-html') // lazy load

        case 'JavaScript':
        case 'javascript':
        case 'js':
            return function escapeJsSetter(text) {
                let code,
                    res = '',
                    i   = 0

                for (; i < text.length; i++) {
                    code = text.charCodeAt(i)

                    if (code in ESCAPE_MAP)
                        res += ESCAPE_MAP[ code ]
                    // control characters
                    else if (code < 32) {
                        code = code.toString(16)
                                   .toUpperCase()
                        code = (code.length < 2) ? '0' + code : code
                        res += '\\u00' + code
                    }
                    else
                        res += text[ i ]
                }

                return res
            }

        default:
            assert.fail(type, null, `escape type must be 'html' or 'js', but it's ${type}`)
    }
}
