const pg = require('pg')
require('pg-spice').patch(pg)

const pool = new pg.Pool()

module.exports = {
  query: (text, params) => pool.query(text, params)
}