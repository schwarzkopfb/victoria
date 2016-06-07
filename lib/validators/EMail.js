/**
 * Created by schwarzkopfb on 23/05/16.
 */

'use strict'

const EXPRESSION      = require('../constants').REGEXP_EMAIL,
      RegExpValidator = require('./RegExp')

class EMailValidator extends RegExpValidator {
    constructor(field) {
        super(field)
        this.expression = EXPRESSION
    }
}

EMailValidator.alias = 'eMail'

module.exports = EMailValidator
