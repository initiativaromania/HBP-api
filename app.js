const express = require('express')
const mountRoutes = require('./routes')

const app = express()

// various middleware:
// helmet injects various headers in express responses; 
// https://github.com/helmetjs/helmet
const helmet = require('helmet');
app.use(helmet());

// morgan is a logging library
// https://github.com/expressjs/morgan
var morgan = require('morgan');
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :remote-addr'));

// generic cache -- this will need to be changed for fine-grained control
const apicache = require('apicache')
app.use(apicache.options({debug: true}).middleware('30 seconds'))

mountRoutes(app)

module.exports = app
