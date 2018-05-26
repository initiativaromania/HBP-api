const Router = require('express-promise-router')
const {query, sql} = require('../db')

const router = new Router()

const limits = require('./limits')

const {cache} = require('./cache')

module.exports = router;

router.get('/institutions', cache('3 days'), async(req, res) => {
  const {rows} = await query(sql`SELECT id, lng, lat FROM institution`)
  res.send(rows)
})

router.get('/institution_summary/:id(\\d+)', cache('30 seconds'), async(req, res) => {
  const {rows: [ret]} = await query(sql`
    WITH foo AS (
      SELECT institution, SUM(contract_count) AS contracts, SUM(tender_count) AS tenders
      FROM statistics GROUP BY institution 
    )
    SELECT 
      i.name, COALESCE(foo.contracts, 0) AS contracts, COALESCE(foo.tenders, 0) AS tenders
    FROM institution i 
    LEFT JOIN foo ON foo.institution=i.id
    WHERE i.id=${req.params.id}
  `)
  res.send(ret)
})

router.get('/institution/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      id,
      county,
      reg_no,
      name,
      locality,
      address,
      longitude(geo) AS long,
      latitude(geo) AS lat,
      version
    FROM institution where id=${req.params.id}
    `)
  res.send(rows)
})

router.get('/contract/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {id} = req.params
  const {rows: [ret]} = await query(sql`
    SELECT 
      x.id, x.procedure, x.application_no, x.application_date::text, x.closing_type, 
      x.contract_no, x.contract_date::text, x.title, x.price, x.currency, x.price_eur, x.price_ron, x.cpvcode,
      x.institution, x.requests, x.company,
      c.reg_no as company_reg_no,
      c.name AS company_name,
      i.reg_no AS institution_reg_no,
      i.name AS institution_name
    FROM contract x
    INNER JOIN company c ON c.id=x.company
    INNER JOIN institution i ON i.id=x.institution
    WHERE x.id=${id}`)
  if (!ret) res.status(404).send({message:"Resource cannot be found"})
  else res.send(ret)
})
