/**
 * Created by schwarzkopfb on 10/06/16.
 */

'use strict'

function createKeyFor(entityName, id, relation) {
    let key = entityName

    if (id)
        key += `:${id}`

    if (relation)
        key += `.${relation}`

    return key
}

module.exports = createKeyFor
