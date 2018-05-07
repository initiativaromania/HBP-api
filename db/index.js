const pg = require('pg');
const env = require('dotenv').config();

// const config = {
//   host: process.env.CUSTOMCONNSTR_PGHOST,
//   user: process.env.CUSTOMCONNSTR_PGUSER,     
//   password: process.env.CUSTOMCONNSTR_PGPASSWORD,
//   database: process.env.CUSTOMCONNSTR_PGDATABASE,
//   port: process.env.CUSTOMCONNSTR_PGPORT
// };

require('pg-spice').patch(pg);

//const pool = new pg.Pool(config);
const pool = new pg.Pool();

module.exports = {
  query: (text, params) => pool.query(text, params)
}
