const Router = require('express-promise-router')
const {query, sql} = require('../db')

const router = new Router()

const limits = require('./limits')

const {cache} = require('./cache')

module.exports = router;

function rad(x) {
  return x * Math.PI / 180
}

function getDistance(p1, p2) {
  var R = 6378137
  var dLat = rad(parseFloat(p2.lat) - parseFloat(p1.lat))
  var dLong = rad(parseFloat(p2.lng) - parseFloat(p1.lng))
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(parseFloat(p1.lat))) * Math.cos(rad(parseFloat(p2.lat))) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

router.get('/institutions', cache('10 secs'), async(req, res) => {
  const parts = [sql`SELECT id, lng, lat FROM institution WHERE true`]
  if (req.query.n)
    parts.push(sql` AND lat<=${req.query.n}`)
  if (req.query.s)
    parts.push(sql` AND lat>=${req.query.s}`)
  
  if (req.query.e)
    parts.push(sql` AND lng<=${req.query.e}`)
  if (req.query.w)
    parts.push(sql` AND lng>=${req.query.w}`)
  
  const {rows} = await query(...parts)

  if (req.query.cluster==='true' && rows.length > 15) {
    groups = []
    let mapSize = getDistance({lat:req.query.n, lng:req.query.w}, {lat:req.query.s, lng:req.query.e})
    let pixelSize = parseInt(req.query.size, 10)
    // minimum distance in pixels: 80
    let threshold = 50 * mapSize / pixelSize
    for (let item of rows)
    {
      let myMatch = null
      for (let match of groups)
      {
        if (getDistance(match, item) <= threshold)
        {
          match.count++
          myMatch = match
          break
        }
      }
      if (!myMatch)
        groups.push({lat: item.lat, lng: item.lng, count: 1, id: item.id})
    }
    res.send(groups)
    return
  }
  else
    res.send(rows)
})

router.get('/institution_summary/:id(\\d+)', cache('30 seconds'), async(req, res) => {
  const {rows: [ret]} = await query(sql`
    WITH foo AS (
      SELECT institution, SUM(contract_count) AS contracts, SUM(tender_count) AS tenders
      FROM statistics GROUP BY institution 
    )
    SELECT 
      i.id, i.name, COALESCE(foo.contracts, 0) AS contracts, COALESCE(foo.tenders, 0) AS tenders
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
