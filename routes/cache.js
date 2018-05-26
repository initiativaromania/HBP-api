const apicache = require('apicache')

const cacheOptions = {debug: true, statusCodes: {include: [200]}}

module.exports = { cache: apicache.options(cacheOptions).middleware }