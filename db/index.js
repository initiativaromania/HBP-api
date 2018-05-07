const pg = require('pg')
require('dotenv').config()

const config = {
  host: process.env.CUSTOMCONNSTR_PGHOST,
  user: process.env.CUSTOMCONNSTR_PGUSER,
  password: process.env.CUSTOMCONNSTR_PGPASSWORD,
  database: process.env.CUSTOMCONNSTR_PGDATABASE,
  port: process.env.CUSTOMCONNSTR_PGPORT
}

const pool = new pg.Pool(config)

module.exports = {
  sql: function(strings, ...params) {return {strings, params}},
  query: function(...parts)
  {
    var text = ''
    var params = []
    var idx = 1
    parts.forEach(part => {
      if (part===null) return
      text += part.strings[0]

      part.params.forEach((param, i) => {
        text += "$" + (idx++) + part.strings[i+1]
        params.push(param)
      })
    })
    return pool.query(text, params)
  }
}
