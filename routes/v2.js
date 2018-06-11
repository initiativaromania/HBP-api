const Router = require('express-promise-router')
const moment = require('moment')
const {query, sql} = require('../db')

const router = new Router()

const limits = require('./limits')

const {cache} = require('./cache')

const csv = require('csv-express')

module.exports = router

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
  const {rows: [details]} = await query(sql`
    SELECT i.id, i.name, 
      i.county,
      i.reg_no,
      i.name,
      i.locality,
      i.address,
      longitude(i.geo) AS long,
      latitude(i.geo) AS lat,
      COALESCE(SUM(s.contract_count), 0) AS contract_count, COALESCE(SUM(s.tender_count), 0) AS tender_count,
      COALESCE(SUM(s.contract_total_ron), 0) AS contract_total_ron,
      COALESCE(SUM(s.tender_total_ron), 0) AS tender_total_ron
    FROM institution i
    LEFT JOIN statistics s ON s.institution = i.id
    WHERE i.id = ${req.params.id}
    GROUP BY i.id;`)
    
  res.send(details)
})

router.get('/institution_stats/:id(\\d+)', cache('30 seconds'), async(req, res) => {
  let start = req.query.start || '2007-01-01'
  let end = moment(req.query.end).local() || moment().local()
  let diff = moment.duration(end.diff(moment(start).local()))
  let unitMul = 1
  let thresholdMin = 32
  let thresholdMax = 64
  units = Math.round(diff.asDays())
  while (units / unitMul > thresholdMax) { unitMul++ }

  const {rows: [details]} = await query(sql`
    SELECT i.id, i.name, 
      i.county,
      i.reg_no,
      i.name,
      i.locality,
      i.address,
      longitude(i.geo) AS long,
      latitude(i.geo) AS lat,
      COALESCE(SUM(s.contract_count), 0) AS contract_count, COALESCE(SUM(s.tender_count), 0) AS tender_count,
      COALESCE(SUM(s.contract_total_ron), 0) AS contract_total_ron,
      COALESCE(SUM(s.tender_total_ron), 0) AS tender_total_ron
    FROM institution i
    LEFT JOIN statistics s ON s.institution = i.id
    WHERE i.id = ${req.params.id}
    GROUP BY i.id;`)
  
  const {rows: hist} = await query(sql`
    WITH d AS (
      SELECT 
      ser,
      ${start}::date + ser + ${Math.floor(unitMul/2)}::int AS date,
      ${start}::date + ser AS start_date,
      ${start}::date + ser + ${unitMul-1}::int AS end_date
      FROM generate_series(0, ${units}-1, ${unitMul}) ser
    ), cx AS (
      SELECT
        ser,
        COALESCE(SUM(c.price_ron), 0) AS total_ron,
        COALESCE(SUM(c.price_eur), 0) AS total_eur,
        COALESCE(COUNT(c.id)) AS count
      FROM d
      LEFT JOIN contract c ON c.contract_date BETWEEN d.start_date AND d.end_date
        AND c.institution = ${req.params.id}
      GROUP BY ser
    ), tx AS (
      SELECT
        ser,
        COALESCE(SUM(c.price_ron), 0) AS total_ron,
        COALESCE(SUM(c.price_eur), 0) AS total_eur,
        COALESCE(COUNT(c.id)) AS count
      FROM d
      LEFT JOIN tender c ON c.contract_date BETWEEN d.start_date AND d.end_date
        AND c.institution = ${req.params.id}
      GROUP BY ser
    )
    SELECT 
      d.date, d.start_date, d.end_date, 
      cx.total_ron AS contract_total_ron, cx.total_eur AS contract_total_eur, cx.count AS contract_count,
      tx.total_ron AS tender_total_ron, tx.total_eur AS tender_total_eur, tx.count AS tender_count
    FROM d INNER JOIN cx ON cx.ser=d.ser INNER JOIN tx ON tx.ser=d.ser
  `)

  const {rows: cpv} = await query(sql`
    WITH cg AS ( SELECT category, SUM(price_ron) AS total FROM (
      SELECT substring(cpvcode, 1, 2) AS category, price_ron
      FROM contract c WHERE c.institution=${req.params.id} 
        AND contract_date BETWEEN ${start}::date AND ${end}::date
      UNION ALL
      SELECT SUBSTRING(cpvcode, 1, 2) AS category, price_ron
      FROM tender t WHERE t.institution=${req.params.id}
        AND contract_date BETWEEN ${start}::date AND ${end}::date
    ) cx GROUP BY 1)
    SELECT * FROM (SELECT * FROM cg ORDER BY total DESC LIMIT 20) fin
      UNION ALL
    SELECT 'xx' AS category, SUM(total) AS total FROM 
    (SELECT total FROM cg ORDER BY total DESC OFFSET 20) fin;
  `)

  res.send({details, hist, cpv})
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
      x.institution, COALESCE(x.requests, 0) AS requests, x.company,
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

router.get('/stats', cache('3 days'), async (req, res) => {
  const ret = await query(sql`
    -- 0: general stats
    SELECT 
      sum(contract_count) as contracts,
      sum(tender_count) as tenders,
      count(distinct institution) as active_institutions,
      (SELECT count(*) FROM institution) as institutions,
      count(distinct company) as companies
    FROM statistics;

    -- 1: top contracts EUR
    SELECT
      x.id, x.title, 
      x.price_ron, x.price_eur, x.contract_date::text,
      c.name as company,
      i.name as institution
    FROM contract x 
    INNER JOIN company c ON x.company=c.id
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY x.price_eur DESC 
    LIMIT 10;

    -- 2: top tenders EUR
    SELECT
      x.id, x.title,
      x.price_ron, x.price_eur, x.contract_date::text,
      c.name as company,
      i.name as institution
    FROM tender x 
    INNER JOIN company c ON x.company=c.id
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY x.price_eur DESC 
    LIMIT 10;

    -- 3: top institutions by no of contracts
    SELECT
      x.count,
      i.id,
      i.name,
      i.reg_no,
      count
    FROM (
      SELECT institution, SUM(contract_count) AS count
      FROM statistics WHERE contract_count IS NOT NULL 
      GROUP BY institution ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY x.count DESC;

    -- 4: top institutions by no of tenders
    SELECT
      x.count,
      i.id,
      i.name,
      i.reg_no
    FROM (
      SELECT institution, SUM(tender_count) AS count
      FROM statistics WHERE tender_count IS NOT NULL 
      GROUP BY institution ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY x.count DESC;

    -- 5: top companies by no of contracts
    SELECT
      x.count,
      c.id,
      c.name,
      c.reg_no
    FROM (
      SELECT company, SUM(contract_count) AS count
      FROM statistics WHERE contract_count IS NOT NULL 
      GROUP BY company ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN company c ON x.company=c.id
    ORDER BY COUNT DESC;

    -- 6: top companies as no of tenders
    SELECT
      x.count,
      c.id,
      c.name,
      c.reg_no
    FROM (
      SELECT company, SUM(tender_count) AS count
      FROM statistics WHERE tender_count IS NOT NULL 
      GROUP BY company ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN company c ON x.company=c.id
    ORDER BY COUNT DESC;
  `)
  res.send({
    general: ret[0].rows[0],
    contracts: ret[1].rows,
    tenders: ret[2].rows,
    institutions: {
      by_contract: ret[3].rows,
      by_tender: ret[4].rows
    },
    companies: {
      by_contract: ret[5].rows,
      by_tender: ret[6].rows
    }
  })
})

router.get('/institution/:id(\\d+)/contracts', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query
  let main_q = sql` FROM contract WHERE institution = ${req.params.id}`
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = ['SELECT id, title, contract_date, price_ron', main_q]

  if (['title', 'price_ron', 'contract_date'].includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
    items_q.push(' NULLS LAST ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/institution/:id(\\d+)/tenders', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query
  let main_q = sql` FROM tender WHERE institution = ${req.params.id}`
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = ['SELECT id, title, contract_date, price_ron', main_q]

  if (['title', 'price_ron', 'contract_date'].includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/institution/:id(\\d+)/companies', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query
  let main_q = sql` 
    FROM company c 
    INNER JOIN statistics s ON s.company=c.id
    WHERE s.institution = ${req.params.id}`
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = [`SELECT c.id, c.name, COALESCE(s.contract_count, 0) AS contract_count, s.contract_total_eur, 
      s.contract_total_ron, COALESCE(s.tender_count, 0) AS tender_count, s.tender_total_eur, s.tender_total_ron `, main_q]

  const allowed_fields = ['name', 'contract_count', 'contract_total_eur', 
    'contract_total_ron', 'tender_count', 'tender_total_eur', 'tender_total_ron']
  
  if (allowed_fields.includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/company_stats/:id(\\d+)', cache('30 seconds'), async(req, res) => {
  let start = req.query.start || '2007-01-01'
  let end = moment(req.query.end).local() || moment().local()
  let diff = moment.duration(end.diff(moment(start).local()))
  let unitMul = 1
  let thresholdMin = 32
  let thresholdMax = 64
  units = Math.round(diff.asDays())
  while (units / unitMul > thresholdMax) { unitMul++ }

  const {rows: [details]} = await query(sql`
    SELECT c.id, c.name, 
      c.country,
      c.reg_no,
      c.name,
      c.locality,
      c.address,
      COALESCE(SUM(s.contract_count), 0) AS contract_count, COALESCE(SUM(s.tender_count), 0) AS tender_count,
      COALESCE(SUM(s.contract_total_ron), 0) AS contract_total_ron,
      COALESCE(SUM(s.tender_total_ron), 0) AS tender_total_ron
    FROM company c
    LEFT JOIN statistics s ON s.company = c.id AND s.institution IS NOT NULL
    WHERE c.id = ${req.params.id}
    GROUP BY c.id;`)
  
  const {rows: hist} = await query(sql`
    WITH d AS (
      SELECT 
      ser,
      ${start}::date + ser + ${Math.floor(unitMul/2)}::int AS date,
      ${start}::date + ser AS start_date,
      ${start}::date + ser + ${unitMul-1}::int AS end_date
      FROM generate_series(0, ${units}-1, ${unitMul}) ser
    ), cx AS (
      SELECT
        ser,
        COALESCE(SUM(c.price_ron), 0) AS total_ron,
        COALESCE(SUM(c.price_eur), 0) AS total_eur,
        COALESCE(COUNT(c.id)) AS count
      FROM d
      LEFT JOIN contract c ON c.contract_date BETWEEN d.start_date AND d.end_date
        AND c.company = ${req.params.id}
      GROUP BY ser
    ), tx AS (
      SELECT
        ser,
        COALESCE(SUM(c.price_ron), 0) AS total_ron,
        COALESCE(SUM(c.price_eur), 0) AS total_eur,
        COALESCE(COUNT(c.id)) AS count
      FROM d
      LEFT JOIN tender c ON c.contract_date BETWEEN d.start_date AND d.end_date
        AND c.company = ${req.params.id}
      GROUP BY ser
    )
    SELECT 
      d.date, d.start_date, d.end_date, 
      cx.total_ron AS contract_total_ron, cx.total_eur AS contract_total_eur, cx.count AS contract_count,
      tx.total_ron AS tender_total_ron, tx.total_eur AS tender_total_eur, tx.count AS tender_count
    FROM d INNER JOIN cx ON cx.ser=d.ser INNER JOIN tx ON tx.ser=d.ser
  `)

  const {rows: cpv} = await query(sql`
    WITH cg AS ( SELECT category, SUM(price_ron) AS total FROM (
      SELECT substring(cpvcode, 1, 2) AS category, price_ron
      FROM contract c WHERE c.company=${req.params.id} 
        AND contract_date BETWEEN ${start}::date AND ${end}::date
      UNION ALL
      SELECT SUBSTRING(cpvcode, 1, 2) AS category, price_ron
      FROM tender t WHERE t.company=${req.params.id}
        AND contract_date BETWEEN ${start}::date AND ${end}::date
    ) cx GROUP BY 1)
    SELECT * FROM (SELECT * FROM cg ORDER BY total DESC LIMIT 20) fin
      UNION ALL
    SELECT 'others' AS category, SUM(total) AS total FROM 
    (SELECT total FROM cg ORDER BY total DESC OFFSET 20) fin;
  `)

  const {rows: map} = await query(sql`
    SELECT county, SUM(price_ron) AS total FROM (
      SELECT i.county, price_ron
      FROM contract c INNER JOIN institution i ON i.id=c.institution
      WHERE c.company=${req.params.id}
      AND contract_date BETWEEN ${start}::date AND ${end}::date
      UNION ALL
      SELECT i.county, price_ron
      FROM tender t INNER JOIN institution i ON i.id=t.institution
      WHERE t.company=${req.params.id}
      AND contract_date BETWEEN ${start}::date AND ${end}::date
    ) subq GROUP BY subq.county
  `)

  res.send({details, hist, cpv, map})
})

router.get('/company/:id(\\d+)/contracts', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query
  let main_q = sql` FROM contract WHERE company = ${req.params.id}`
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = ['SELECT id, title, contract_date, price_ron', main_q]

  if (['title', 'price_ron', 'contract_date'].includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/company/:id(\\d+)/tenders', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query
  let main_q = sql` FROM tender WHERE company = ${req.params.id} AND institution IS NOT NULL `
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = ['SELECT id, title, contract_date, price_ron', main_q]

  if (['title', 'price_ron', 'contract_date'].includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/company/:id(\\d+)/institutions', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query
  let main_q = sql` 
    FROM institution i 
    INNER JOIN statistics s ON s.institution=i.id
    WHERE s.company = ${req.params.id}`
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = [`SELECT i.id, i.name, COALESCE(s.contract_count, 0) AS contract_count, s.contract_total_eur, 
      s.contract_total_ron, COALESCE(s.tender_count, 0) AS tender_count, s.tender_total_eur, s.tender_total_ron `, main_q]

  const allowed_fields = ['name', 'contract_count', 'contract_total_eur', 
    'contract_total_ron', 'tender_count', 'tender_total_eur', 'tender_total_ron']
  
  if (allowed_fields.includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
    items_q.push(' NULLS LAST ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/search/contract/:pattern', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query

  let main_q = sql `
    FROM contract x
    WHERE to_tsvector('romanian', x.title) @@ plainto_tsquery('romanian', ${req.params.pattern})
  `
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = [
    `SELECT
      x.id,
      x.title,
      x.price_ron,
      x.contract_date `,
    main_q]
  
  const allowed_fields = ['title', 'price_ron', 'contract_date']

  if (allowed_fields.includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
    items_q.push(' NULLS LAST ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/search/tender/:pattern', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query

  let main_q = sql `
    FROM tender x
    WHERE to_tsvector('romanian', x.title) @@ plainto_tsquery('romanian', ${req.params.pattern})
  `
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = [
    `SELECT
      x.id,
      x.title,
      x.price_ron,
      x.contract_date `,
    main_q]
  
  const allowed_fields = ['title', 'price_ron', 'contract_date']

  if (allowed_fields.includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
    items_q.push(' NULLS LAST ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/search/company/:pattern', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query

  let main_q = sql `
    FROM company x
    WHERE to_tsvector('romanian', x.name) @@ plainto_tsquery('romanian', ${req.params.pattern})
  `
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = [
    `SELECT 
      x.id,
      x.name,
      x.reg_no,
      x.country,
      x.locality,
      x.address`,
    main_q]
  
  const allowed_fields = ['name', 'reg_no', 'country', 'locality']

  if (allowed_fields.includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
    items_q.push(' NULLS LAST ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/search/institution/:pattern', cache('30 seconds'), async (req, res) => {
  const {page=1, perPage=10, sortBy, sortDesc=false} = req.query

  let main_q = sql `
    FROM institution x
    WHERE to_tsvector('romanian', x.name) @@ plainto_tsquery('romanian', ${req.params.pattern})
  `
  let count_q = ['SELECT COUNT(*) ', main_q]
  let items_q = [
    `SELECT 
      x.id,
      x.name,
      x.reg_no,
      x.county,
      x.locality,
      x.address,
      longitude(geo) as long,
      latitude(geo) as lat,
      x.version
      `,
    main_q]
  
  const allowed_fields = ['name', 'reg_no', 'county', 'locality']

  if (allowed_fields.includes(sortBy)) {
    items_q.push(` ORDER BY ${sortBy} `)
    if (sortDesc==="true") items_q.push(' DESC ')
    items_q.push(' NULLS LAST ')
  }
  items_q.push(sql` LIMIT ${perPage} OFFSET ${(page-1)*perPage};`)

  const {rows: [{count}]} = await query(...count_q)
  const {rows: items} = await query(...items_q)

  res.send({items, count})
})

router.get('/search/reg_no/:reg_no', cache('30 seconds'), async (req, res) => {
  let main_q = sql `
    SELECT * FROM (
      SELECT id, true as is_company 
      FROM company WHERE reg_no=${req.params.reg_no}
      UNION
      SELECT id, false as is_company
      FROM institution WHERE reg_no=${req.params.reg_no}
    ) foo LIMIT 1
  `
  let {rows: [ret]} = await query(main_q)
  if (!ret) res.status(404).send({message:"Resource cannot be found"})
  res.send(ret)
})

router.get('/institution/:id(\\d+)/contracts.csv', cache('30 seconds'), async (req, res) => {
  let {rows} = await query(sql`
    SELECT 
          x.procedure as "Tip procedură", 
          x.application_no as "Nr anunț participare",
          x.application_date as "Dată anunț participare", 
          x.closing_type as "Tip încheiere contract",
          x.contract_no AS "Nr contract",
          x.contract_date AS "Dată contract",
          x.title AS "Titlu contract",
          x.price AS "Valoare",
          x.currency AS "Monedă",
          x.price_eur AS "Valoare EUR",
          x.price_ron AS "Valoare RON",
          x.cpvcode AS "Cod CPV",
          i.name AS "Nume instituție",
          i.reg_no AS "CUI Instituție",
          c.name AS "Nume companie",
          c.reg_no AS "CUI Companie"
    FROM contract x
    INNER JOIN institution i ON i.id=x.institution
    INNER JOIN company c ON c.id=x.company
    WHERE institution = ${req.params.id}
  `)

  res.csv(rows, true)
})

router.get('/company/:id(\\d+)/contracts.csv', cache('30 seconds'), async (req, res) => {
  let {rows} = await query(sql`
    SELECT 
          x.procedure as "Tip procedură", 
          x.application_no as "Nr anunț participare",
          x.application_date as "Dată anunț participare", 
          x.closing_type as "Tip încheiere contract",
          x.contract_no AS "Nr contract",
          x.contract_date AS "Dată contract",
          x.title AS "Titlu contract",
          x.price AS "Valoare",
          x.currency AS "Monedă",
          x.price_eur AS "Valoare EUR",
          x.price_ron AS "Valoare RON",
          x.cpvcode AS "Cod CPV",
          i.name AS "Nume instituție",
          i.reg_no AS "CUI Instituție",
          c.name AS "Nume companie",
          c.reg_no AS "CUI Companie"
    FROM contract x
    INNER JOIN institution i ON i.id=x.institution
    INNER JOIN company c ON c.id=x.company
    WHERE company = ${req.params.id}
  `)

  res.csv(rows, true)
})

router.get('/institution/:id(\\d+)/tenders.csv', cache('30 seconds'), async (req, res) => {
  let {rows} = await query(sql`
    SELECT 
          x.type AS "Tip",
          x.contract_type AS "Tip contract",
          x.procedure as "Tip procedură", 
          x.activity_type AS "Tip activitate AC",
          x.awarding_no AS "Număr anunț atribuire",
          x.awarding_date AS "Dată anunț atribuire",
          x.closing_type as "Tip încheiere contract",
          x.awarding_criteria AS "Tip criterii atribuire",
          x.is_electronic AS "Licitație electronică",
          x.bids AS "Număr oferte primite",
          x.is_subcontracted AS "Subcontractat",
          x.contract_no AS "Nr contract",
          x.contract_date AS "Dată contract",
          x.title AS "Titlu contract",
          x.price AS "Valoare",
          x.currency AS "Monedă",
          x.price_eur AS "Valoare EUR",
          x.price_ron AS "Valoare RON",
          x.cpvcode AS "Cod CPV",

          x.bid_no as "Nr anunț participare",
          x.bid_date as "Dată anunț participare", 
          
          x.estimated_bid_price AS "Valoare estimată participare",
          x.estimated_bid_price_currency AS "Monedă valoare estimată participare",
          x.deposits_guarantees AS "Depozite și garanții",
          x.financing_notes AS "Modalități finanțare",
          
          i.name AS "Nume instituție",
          i.reg_no AS "CUI Instituție",
          c.name AS "Nume companie",
          c.reg_no AS "CUI Companie"
    FROM tender x
    INNER JOIN institution i ON i.id=x.institution
    INNER JOIN company c ON c.id=x.company
    WHERE institution = ${req.params.id}
  `)

  res.csv(rows, true)
})

router.get('/company/:id(\\d+)/tenders.csv', cache('30 seconds'), async (req, res) => {
  let {rows} = await query(sql`
    SELECT 
          x.type AS "Tip",
          x.contract_type AS "Tip contract",
          x.procedure as "Tip procedură", 
          x.activity_type AS "Tip activitate AC",
          x.awarding_no AS "Număr anunț atribuire",
          x.awarding_date AS "Dată anunț atribuire",
          x.closing_type as "Tip încheiere contract",
          x.awarding_criteria AS "Tip criterii atribuire",
          x.is_electronic AS "Licitație electronică",
          x.bids AS "Număr oferte primite",
          x.is_subcontracted AS "Subcontractat",
          x.contract_no AS "Nr contract",
          x.contract_date AS "Dată contract",
          x.title AS "Titlu contract",
          x.price AS "Valoare",
          x.currency AS "Monedă",
          x.price_eur AS "Valoare EUR",
          x.price_ron AS "Valoare RON",
          x.cpvcode AS "Cod CPV",

          x.bid_no as "Nr anunț participare",
          x.bid_date as "Dată anunț participare", 
          
          x.estimated_bid_price AS "Valoare estimată participare",
          x.estimated_bid_price_currency AS "Monedă valoare estimată participare",
          x.deposits_guarantees AS "Depozite și garanții",
          x.financing_notes AS "Modalități finanțare",
          
          i.name AS "Nume instituție",
          i.reg_no AS "CUI Instituție",
          c.name AS "Nume companie",
          c.reg_no AS "CUI Companie"
    FROM tender x
    INNER JOIN institution i ON i.id=x.institution
    INNER JOIN company c ON c.id=x.company
    WHERE x.company = ${req.params.id}
  `)

  res.csv(rows, true)
})

router.get('/institution/:id(\\d+)/companies.csv', cache('30 seconds'), async (req, res) => {
  let {rows} = await query(sql`
  SELECT 
    c.name AS "Nume companie", 
    c.reg_no AS "CUI companie",
    c.country AS "Țară",
    c.locality AS "Localitate",
    c.address AS "Adresă",
    COALESCE(s.contract_count, 0) AS "Număr achiziții directe",
    COALESCE(s.contract_total_eur, 0) AS "Total EUR achiziții directe",
    COALESCE(s.contract_total_ron, 0) AS "Total RON achiziții directe",
    COALESCE(s.tender_count, 0) AS "Număr licitații",
    COALESCE(s.tender_total_eur, 0) AS "Total EUR licitații",
    COALESCE(s.tender_total_ron, 0) AS "Total RON licitații"
  FROM company c 
  INNER JOIN statistics s ON s.company=c.id
  WHERE s.institution = ${req.params.id}
  `)
  res.csv(rows, true)
})

router.get('/company/:id(\\d+)/institutions.csv', cache('30 seconds'), async (req, res) => {
  let {rows} = await query(sql`
  SELECT 
    i.name AS "Nume instituție", 
    i.reg_no AS "CUI instituție",
    i.county AS "Județ",
    i.locality AS "Localitate",
    i.address AS "Adresă",
    COALESCE(s.contract_count, 0) AS "Număr achiziții directe",
    COALESCE(s.contract_total_eur, 0) AS "Total EUR achiziții directe",
    COALESCE(s.contract_total_ron, 0) AS "Total RON achiziții directe",
    COALESCE(s.tender_count, 0) AS "Număr licitații",
    COALESCE(s.tender_total_eur, 0) AS "Total EUR licitații",
    COALESCE(s.tender_total_ron, 0) AS "Total RON licitații"
  FROM institution i
  INNER JOIN statistics s ON s.institution=i.id
  WHERE s.company = ${req.params.id}
  `)
  res.csv(rows, true)
})