const Router = require('express-promise-router')
const {query, sql} = require('../db')

const router = new Router()

const paginationWindow = 100;
const limits = require('./limits')

const {cache} = require('./cache')

module.exports = router;

router.get('/Contract/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {id} = req.params
  const {rows} = await query(sql`
    SELECT 
      x.id AS "ContracteId",
      c.reg_no AS "CompanieCUI",
      x.procedure AS "TipProcedura",
      i.reg_no AS "InstitutiePublicaCUI",
      x.application_no AS "NumarAnuntParticipare",
      x.application_date::text AS "DataAnuntParticipare",
      x.closing_type AS "TipIncheiereContract",
      x.contract_no AS "NumarContract",
      x.contract_date::text AS "DataContract",
      x.title AS "TitluContract",
      x.price AS "Valoare",
      x.currency AS "Moneda",
      x.price_eur AS "ValoareEUR",
      x.price_ron AS "ValoareRON",
      x.cpvcode AS "CPVCode",
      x.institution AS "InstitutiePublicaID",
      x.requests AS "NumarJustificari",
      x.company AS "CompanieId",
      c.name AS "NumeCompanie",
      i.name AS "NumeInstitutie"
    FROM contract x
    INNER JOIN company c ON c.id=x.company
    INNER JOIN institution i ON i.id=x.institution
    WHERE x.id=${id}`)
  res.send(rows)
})

router.get('/Tender/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {id} = req.params
  const {rows} = await query(sql`
    SELECT 
      x.id AS "LicitatiiId",
      c.reg_no AS "CompanieCUI",
      x.type AS "Tip",
      x.contract_type AS "TipContract",
      x.procedure AS "TipProcedura",
      i.reg_no AS "InstitutiePublicaCUI",
      x.activity_type AS "TipActivitateAC",
      x.awarding_no AS "NumarAnuntAtribuire",
      x.awarding_date AS "DataAnuntAtribuire",
      x.closing_type AS "TipIncheiereContract",
      x.awarding_criteria AS "TipCriteriiAtribuire",
      x.is_electronic AS "CUILicitatieElectronica",
      x.bids AS "NumarOfertePrimite",
      x.is_subcontracted AS "Subcontractat",
      x.contract_no AS "NumarContract",
      x.contract_date::text AS "DataContract",
      x.title AS "TitluContract",
      x.price AS "Valoare",
      x.currency AS "Moneda",
      x.price_eur AS "ValoareEUR",
      x.price_ron AS "ValoareRON",
      x.cpvcode AS "CPVCode",
      x.cpvcode_id AS "CPVCodeId",
      x.bid_no AS "NumarAnuntParticipare",
      x.bid_date::text as "DataAnuntParticipare",
      x.estimated_bid_price AS "ValoareEstimataParticipare",
      x.estimated_bid_price_currency AS "MonedaValoareEstimataParticipare",
      x.deposits_guarantees AS "DepoziteGarantii",
      x.financing_notes AS "ModalitatiFinantare",
      x.institution AS "InstitutiePublicaID",
      x.requests AS "NumarJustificari",
      x.company AS "CompanieId",
      c.name AS "NumeCompanie",
      i.name AS "NumeInstitutie"
    FROM tender x
    INNER JOIN company c ON c.id=x.company
    INNER JOIN institution i ON i.id=x.institution
    WHERE x.id=${id}`)
  res.send(rows)
})

router.get('/InstitutionByCUI/:reg_no', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      id AS "InstitutiePublicaId",
      county AS "Judet",
      reg_no AS "CUI",
      name AS "Nume",
      locality AS "UAT",
      address AS "Adresa",
      longitude(geo) AS long,
      latitude(geo) AS lat,
      version
    FROM institution where reg_no=${req.params.reg_no}
    `)
  res.send(rows)
})

router.get('/InstitutionById/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      id AS "InstitutiePublicaId",
      county AS "Judet",
      reg_no AS "CUI",
      name AS "Nume",
      locality AS "UAT",
      address AS "Adresa",
      longitude(geo) AS long,
      latitude(geo) AS lat,
      version
    FROM institution where id=${req.params.id}
    `)
  res.send(rows)
})

router.get('/InstitutionByCity/:str', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      id AS "InstitutiePublicaId",
      county AS "Judet",
      reg_no AS "CUI",
      name AS "Nume",
      locality AS "UAT",
      address AS "Adresa",
      longitude(geo) AS long,
      latitude(geo) AS lat,
      version
    FROM institution where locality ilike ${'%' + req.params.str + '%'}
    `, req.params)
  res.send(rows)
})

router.get('/InstitutionsByADCompany/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT DISTINCT ON (i.id)
      i.id as "Id",
      i.reg_no AS "CUI",
      i.name AS "Nume"
    FROM contract c
    INNER JOIN institution as i ON i.id = c.institution
    WHERE c.company = ${req.params.id}
  `)
  res.send(rows)
})

router.get('/InstitutionsByTenderCompany/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT DISTINCT ON (i.id)
      i.id as "Id",
      i.reg_no AS "CUI",
      i.name AS "Nume"
    FROM tender t
    INNER JOIN institution as i ON i.id = t.institution
    WHERE t.company = ${req.params.id}
  `)
  res.send(rows)
})

router.get('/InstitutionsByCompany/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT DISTINCT ON (i.id)
      i.id as "Id",
      i.reg_no AS "CUI",
      i.name AS "Nume"
    FROM tender t
    INNER JOIN institution as i ON i.id = t.institution
    WHERE t.company = ${req.params.id}
    
    UNION

    SELECT DISTINCT ON (i.id)
      i.id as "Id",
      i.reg_no AS "CUI",
      i.name AS "Nume"
    FROM contract c
    INNER JOIN institution as i ON i.id = c.institution
    WHERE c.company = ${req.params.id}
  `)
  res.send(rows)
})

router.get('/ADCompaniesByInstitution/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT DISTINCT ON (x.id)
      x.id as "CompanieId",
      x.name AS "Nume"
    FROM contract c
    INNER JOIN company x ON x.id = c.company
    WHERE c.institution = ${req.params.id}
  `)
  res.send(rows)
})

router.get('/TenderCompaniesByInstitution/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT DISTINCT ON (x.id)
      x.id as "CompanieId",
      x.name AS "Nume"
    FROM tender t
    INNER JOIN company x ON x.id = t.company
    WHERE t.institution = ${req.params.id}
  `)
  res.send(rows)
})

router.get('/AllCompaniesByInstitution/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT DISTINCT ON (x.id)
      x.id as "CompanieId",
      x.name AS "Nume"
    FROM tender t
    INNER JOIN company x ON x.id = t.company
    WHERE t.institution = ${req.params.id}

    UNION
  
    SELECT DISTINCT ON (x.id)
      x.id as "CompanieId",
      x.name AS "Nume"
    FROM contract c
    INNER JOIN company x ON x.id = c.company
    WHERE c.institution = ${req.params.id}
  `)
  res.send(rows)
})

router.get('/InstitutionContracts/:id(\\d+)/:page(\\d+)?', cache('30 seconds'), async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;
  
  var q = sql`
    SELECT
      x.id AS "ContracteId", 
      x.contract_no AS "NumarContract",
      substring(x.title, 0, 100) as "TitluContract", 
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode"
    FROM contract x 
    where institution = ${req.params.id}::int
    ORDER BY x.contract_date DESC
  `
  var paging = sql` LIMIT ${paginationWindow} OFFSET ${paginationWindow * (page-1)}`

  const {rows} = fetchAll ? await query(q) : await query(q, paging)
  res.send(rows)
})

router.get('/InstitutionTenders/:id(\\d+)/:page(\\d+)?', cache('30 seconds'), async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;

  var q = sql`
    SELECT
      x.id AS "LicitatieID", 
      x.contract_no AS "NumarContract",
      substring(x.title, 0, 100) as "TitluContract", 
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode"
    FROM tender x 
    where institution = ${req.params.id}::int
    ORDER BY x.contract_date DESC
  `
  var paging = fetchAll ? null : sql` LIMIT ${paginationWindow} OFFSET ${paginationWindow * (page-1)}`

  const {rows} = await query(q, paging)
  res.send(rows)
})

router.get('/PublicInstitutionSummary/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
  SELECT
  ( SELECT name FROM institution where id = ${req.params.id} ) as nume_institutie,
  ( SELECT COUNT(*)::int FROM contract where institution = ${req.params.id} ) as nr_achizitii,
  ( SELECT COUNT(*)::int FROM tender where institution = ${req.params.id}) as nr_licitatii
  `)
  res.send(rows)
})

router.get('/CountAD/:company_id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT count(*)::int AS "ADcontracts" FROM contract WHERE company=${req.params.company_id}
  `)
  res.send(rows)
})

router.get('/CountTender/:company_id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT count(*)::int AS "TenderContracts" FROM tender WHERE company=${req.params.company_id}
  `, req.params)
  res.send(rows)
})

router.get('/CompanyContracts/:reg_no', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT 
      x.id AS "ContractID", 
      x.contract_no AS "NumarContract", 
      x.title AS "TitluContract",
      x.price_ron AS "ValoareRON" 
    FROM contract x 
    INNER JOIN company c ON x.company=c.id
    WHERE c.reg_no = ${req.params.reg_no}
    ORDER BY x.contract_date DESC
  `)
  res.send(rows)
})

router.get('/ADCompanyContracts/:id(\\d+)/:page(\\d+)?', cache('30 seconds'), async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;

  var q = sql`
    SELECT
      x.id AS "ID",
      substring(x.title, 0, 100) as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode",
      i.county AS "Judet"
    FROM contract x 
    INNER JOIN institution i ON i.id = x.institution
    where company = ${req.params.id}
    ORDER BY x.contract_date DESC
  `
  var paging = fetchAll ? null : sql` LIMIT ${paginationWindow} OFFSET ${paginationWindow * (page-1)}`

  const {rows} = await query(q, paging)
  res.send(rows)
})

router.get('/TenderCompanyTenders/:id(\\d+)/:page(\\d+)?', cache('30 seconds'), async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;

  var q = sql`
    SELECT
      x.id AS "ID",
      substring(x.title, 0, 100) as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode",
      i.county AS "Judet"
    FROM tender x 
    INNER JOIN institution i ON i.id = x.institution
    where company = ${req.params.id}
    ORDER BY x.contract_date DESC
  `

  const {rows} = await query(q, fetchAll ? null : sql` LIMIT ${paginationWindow} OFFSET ${paginationWindow * (page-1)}`)
  res.send(rows)
})

router.get('/CompanyTenders/:reg_no', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    SELECT 
      x.id AS "TenderId", 
      x.contract_no AS "NumarContract", 
      x.title AS "TitluContract",
      x.price_ron AS "ValoareRON" 
    FROM tender x 
    INNER JOIN company c ON x.company=c.id
    WHERE c.reg_no = ${req.params.reg_no}
    ORDER BY x.contract_date DESC
  `)
  res.send(rows)
})

router.get('/ADCompanyByCUI/:reg_no$|/TenderCompanyByCUI/:reg_no$', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    SELECT 
      x.id AS "CompanieId",
      x.name AS "Nume",
      x.reg_no AS "CUI",
      x.country AS "Tara",
      x.locality AS "Localitate",
      x.address AS "Adresa"
    FROM company x
    WHERE x.reg_no = ${req.params.reg_no}
  `)
  res.send(rows)
})

router.get('/ADCompany/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    SELECT 
      x.id AS "CompanieId",
      x.name AS "Nume",
      x.reg_no AS "CUI",
      x.country AS "Tara",
      x.locality AS "Localitate",
      x.address AS "Adresa",
      COUNT(c.id) AS "NrContracte"
    FROM company x
    LEFT JOIN contract c ON c.company=x.id
    WHERE x.id = ${req.params.id}
    GROUP BY x.id
  `)
  res.send(rows)
})

router.get('/TenderCompany/:id(\\d+)', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    SELECT 
      x.id AS "CompanieId",
      x.name AS "Nume",
      x.reg_no AS "CUI",
      x.country AS "Tara",
      x.locality AS "Localitate",
      x.address AS "Adresa",
      COUNT(c.id) AS "NrContracte"
    FROM company x
    LEFT JOIN tender c ON c.company=x.id
    WHERE x.id = ${req.params.id}
    GROUP BY x.id
  `)
  res.send(rows)
})

router.get('/SearchInstitution/:pattern', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    SELECT
      id AS "InstitutiePublicaId",
      county AS "Judet",
      reg_no AS "CUI",
      name AS "Nume",
      locality AS "UAT",
      address AS "Adresa",
      longitude(geo) AS long,
      latitude(geo) AS lat,
      version
    FROM institution WHERE name ilike '%' || ${req.params.pattern} || '%'
  `)
  res.send(rows)
})

router.get('/SearchADCompany/:pattern$|/SearchTenderCompany/:pattern$|/SearchCompany/:pattern$', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    SELECT 
      x.id AS "CompanieId",
      x.name AS "Nume",
      x.reg_no AS "CUI",
      x.country AS "Tara",
      x.locality AS "Localitate",
      x.address AS "Adresa"
    FROM company x
    WHERE x.name ilike '%' || ${req.params.pattern} || '%'
  `)
  res.send(rows)
})

router.get('/SearchAD/:pattern/:page?', cache('30 seconds'), async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;

  var q = sql `
    SELECT
      x.id AS "ContracteId",
      x.title as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract"
    FROM contract x
    WHERE to_tsvector('romanian', x.title) @@ to_tsquery('romanian', ${req.params.pattern})
    ORDER BY x.contract_date DESC
  `

  const {rows} = await query(q, fetchAll ? null : sql` LIMIT ${paginationWindow} OFFSET ${paginationWindow * (page-1)}`)

  res.send(rows)
})

router.get('/SearchTender/:pattern/:page?', cache('30 seconds'), async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;

  var q = sql`
    SELECT
      x.id AS "LicitatieId",
      x.title as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract"
    FROM tender x
    WHERE to_tsvector('romanian', x.title) @@ to_tsquery('romanian', ${req.params.pattern})
    ORDER BY x.contract_date DESC
  `

  const {rows} = await query(q, fetchAll ? null : sql` LIMIT ${paginationWindow} OFFSET ${paginationWindow * (page-1)}`)

  res.send(rows)
})

router.get('/TopADcompaniesByInstitution/:id$', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    WITH main AS (
      SELECT company, sum(price_ron) AS total FROM contract
      WHERE institution=${req.params.id}
      GROUP by company
    )
    SELECT 
      c.id AS "CompanieId",
      c.name AS "Nume",
      total
    FROM main INNER JOIN company c ON main.company = c.id
    ORDER BY total DESC
    LIMIT 10
  `)
  res.send(rows)
})

router.get('/TopTendercompaniesByInstitution/:id$', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql `
    WITH main AS (
      SELECT company, sum(price_ron) AS total FROM tender
      WHERE institution=${req.params.id}
      GROUP by company
    )
    SELECT 
      c.id AS "CompanieId",
      c.name AS "Nume",
      total
    FROM main INNER JOIN company c ON main.company = c.id
    ORDER BY total DESC
    LIMIT 10
  `)
  res.send(rows)
})

router.get('/report/Contracte_AD_ValoareEUR_top10', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      x.id AS "ContracteId",
      c.reg_no AS "CompanieCUI",
      x.procedure AS "TipProcedura",
      i.reg_no AS "InstitutiePublicaCUI",
      x.application_no AS "NumarAnuntParticipare",
      x.application_date::text AS "DataAnuntParticipare",
      x.closing_type AS "TipIncheiereContract",
      x.contract_no AS "NumarContract",
      x.contract_date::text AS "DataContract",
      x.title AS "TitluContract",
      x.price AS "Valoare",
      x.currency AS "Moneda",
      x.price_eur AS "ValoareEUR",
      x.price_ron AS "ValoareRON",
      x.cpvcode AS "CPVCode",
      x.institution AS "InstitutiePublicaID",
      x.requests AS "NumarJustificari",
      x.company AS "CompanieId",
      c.name AS "NumeCompanie",
      i.name AS "NumeInstitutie"
    FROM contract x 
    INNER JOIN company c ON x.company=c.id
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY x.price_eur DESC 
    LIMIT 10
  `)
  res.send(rows)
})


router.get('/report/Contracte_AD_ValoareEUR_top10', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      x.id AS "ContracteId",
      c.reg_no AS "CompanieCUI",
      x.procedure AS "TipProcedura",
      i.reg_no AS "InstitutiePublicaCUI",
      x.application_no AS "NumarAnuntParticipare",
      x.application_date::text AS "DataAnuntParticipare",
      x.closing_type AS "TipIncheiereContract",
      x.contract_no AS "NumarContract",
      x.contract_date::text AS "DataContract",
      x.title AS "TitluContract",
      x.price AS "Valoare",
      x.currency AS "Moneda",
      x.price_eur AS "ValoareEUR",
      x.price_ron AS "ValoareRON",
      x.cpvcode AS "CPVCode",
      x.institution AS "InstitutiePublicaID",
      x.requests AS "NumarJustificari",
      x.company AS "CompanieId",
      c.name AS "NumeCompanie",
      i.name AS "NumeInstitutie"
    FROM contract x 
    INNER JOIN company c ON x.company=c.id
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY x.price_eur DESC 
    LIMIT 10
  `)
  res.send(rows)
})

router.get('/report/Contracte_Tenders_ValoareEUR_top10', cache('30 seconds'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      x.id AS "LicitatiiId",
      c.reg_no AS "CompanieCUI",
      x.type AS "Tip",
      x.contract_type AS "TipContract",
      x.procedure AS "TipProcedura",
      i.reg_no AS "InstitutiePublicaCUI",
      x.activity_type AS "TipActivitateAC",
      x.awarding_no AS "NumarAnuntAtribuire",
      x.awarding_date AS "DataAnuntAtribuire",
      x.closing_type AS "TipIncheiereContract",
      x.awarding_criteria AS "TipCriteriiAtribuire",
      x.is_electronic AS "CUILicitatieElectronica",
      x.bids AS "NumarOfertePrimite",
      x.is_subcontracted AS "Subcontractat",
      x.contract_no AS "NumarContract",
      x.contract_date::text AS "DataContract",
      x.title AS "TitluContract",
      x.price AS "Valoare",
      x.currency AS "Moneda",
      x.price_eur AS "ValoareEUR",
      x.price_ron AS "ValoareRON",
      x.cpvcode AS "CPVCode",
      x.cpvcode_id AS "CPVCodeId",
      x.bid_no AS "NumarAnuntParticipare",
      x.bid_date::text as "DataAnuntParticipare",
      x.estimated_bid_price AS "ValoareEstimataParticipare",
      x.estimated_bid_price_currency AS "MonedaValoareEstimataParticipare",
      x.deposits_guarantees AS "DepoziteGarantii",
      x.financing_notes AS "ModalitatiFinantare",
      x.institution AS "InstitutiePublicaID",
      x.requests AS "NumarJustificari",
      x.company AS "CompanieId",
      c.name AS "NumeCompanie",
      i.name AS "NumeInstitutie"
    FROM tender x 
    INNER JOIN company c ON x.company=c.id
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY x.price_eur DESC 
    LIMIT 10
  `)
  res.send(rows)
})

router.get('/report/Institutii_AD_top10', cache('3 days'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      x.count AS "nrAD",
      x.institution AS "InstitutiePublicaId",
      i.name AS "Nume",
      i.reg_no AS "CUI"
    FROM (
      SELECT institution, SUM(contract_count) AS count
      FROM statistics WHERE contract_count IS NOT NULL 
      GROUP BY institution ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY COUNT DESC
  `)
  res.send(rows)
})

router.get('/report/Institutii_Tenders_top10', cache('3 days'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      x.count AS "nrTenders",
      x.institution AS "InstitutiePublicaId",
      i.name AS "Nume",
      i.reg_no AS "CUI"
    FROM (
      SELECT institution, SUM(tender_count) AS count
      FROM statistics WHERE tender_count IS NOT NULL 
      GROUP BY institution ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN institution i ON x.institution=i.id
    ORDER BY COUNT DESC
  `)
  res.send(rows)
})

router.get('/report/Company_AD_countAD_top10', cache('3 days'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      x.count AS "nrAD",
      x.company AS "CompanieId",
      c.name AS "Nume"
    FROM (
      SELECT company, SUM(contract_count) AS count
      FROM statistics WHERE contract_count IS NOT NULL 
      GROUP BY company ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN company c ON x.company=c.id
    ORDER BY COUNT DESC
  `)
  res.send(rows)
})

router.get('/report/Company_Tender_countTenders_top10', cache('3 days'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT
      x.count AS "nrTenders",
      x.company AS "CompanieId",
      c.name AS "Nume"
    FROM (
      SELECT company, SUM(tender_count) AS count
      FROM statistics WHERE tender_count IS NOT NULL 
      GROUP BY company ORDER BY count DESC LIMIT 10
    ) x
    INNER JOIN company c ON x.company=c.id
    ORDER BY COUNT DESC
  `)
  res.send(rows)
})

router.get('/report/general_stats', cache('3 days'), async (req, res) => {
  const {rows} = await query(sql`
    SELECT 
      sum(contract_count) as contracts,
      sum(tender_count) as tenders,
      count(distinct institution) as institutions,
      count(distinct company) as companies
    FROM statistics;
  `)
  res.send(rows[0])
})

router.post('/JustifyAD/:id(\\d+)', limits.JustifyContract, async (req, res) => {
  await query(sql`UPDATE contract SET requests = coalesce(requests, 0) + 1 WHERE id=${req.params.id}`)
  res.send("Counter was incremented")
})

router.post('/JustifyTender/:id(\\d+)', limits.JustifyTender, async (req, res) => {
  await query(sql`UPDATE tender SET requests = coalesce(requests, 0) + 1 WHERE id=${req.params.id}`)
  res.send("Counter was incremented")
})