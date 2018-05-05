const v1_route = require('./v1')
const express = require('express')

module.exports = (app) => {
  app.use('/api(V1)?', v1_route)
  app.use('/static', express.static(__dirname + '/../static'));
}