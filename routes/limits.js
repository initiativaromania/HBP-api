const RateLimit = require('express-rate-limit')

module.exports = {
  JustifyContract: new RateLimit({
    windowMs: 60*60*1000, // 1 hour window
    max: 1, // start blocking after 1 requests
    message: "Too many requests created from this IP",
    keyGenerator: (req, res) => req.ip + "_" + req.params.id
  }),
  JustifyTender: new RateLimit({
    windowMs: 60*60*1000, // 1 hour window
    max: 1, // start blocking after 1 requests
    message: "Too many requests created from this IP",
    keyGenerator: (req, res) => req.ip + "_" + req.params.id
  })
}