const apicache = require('apicache')

const cacheOptions = {debug: true}

module.exports = { cache: apicache.options(cacheOptions).middleware }