/**
 * Created by schwarzkopfb on 22/06/16.
 */

'use strict'

const assert       = require('assert'),
      manifestName = require('../package.json').name,
      setters      = require('./setters'),
      getters      = require('./getters'),
      validators   = require('./validators'),
      Validator    = require('./Validator')

module.exports = new class extensions {
    setter(name, fn) {
        assert.equal(typeof name, 'string', 'setter name must be a string')
        assert(name.length, 'setter name must be at least one character long')
        assert.equal(typeof fn, 'function', 'setter must be a function')
        assert.equal(typeof fn(), 'function', 'setter initializer must return a function')

        setters[ name ] = fn
    }

    getter(name, fn) {
        assert.equal(typeof name, 'string', 'getter name must be a string')
        assert(name.length, 'getter name must be at least one character long')
        assert.equal(typeof fn, 'function', 'getter must be a function')
        assert.equal(typeof fn(), 'function', 'getter initializer must return a function')

        getters[ name ] = fn
    }

    validator(name, obj) {
        assert(obj.prototype instanceof Validator, `validator must inherit from \`${manifestName}.Validator\``)

        const names = []

        function addName(name) {
            assert.equal(typeof name, 'string', 'validator name alias must be a string')
            assert(name.length, 'validator name alias must be at least one character long')
            names.push(name)
        }

        addName(name)

        if (typeof obj.alias === 'string')
            addName(obj.alias)
        else if (Array.isArray(obj.aliases))
            obj.aliases.forEach(addName)

        names.forEach(name => validators[ name ] = obj)
    }
}
