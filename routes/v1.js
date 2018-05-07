const Router = require('express-promise-router');
const db = require('../db');

const router = new Router();

const paginationWindow = 100;

module.exports = router;

router.get('/yo',  (req, res) => {
  res.send(yo);
});

router.get('/Contract/:id(\\d+)', async (req, res) => {
  const {id} = req.params
  const {rows} = await db.query(`
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
    WHERE x.id=:id`, {id})
  res.send(rows)
});

router.get('/Tender/:id(\\d+)', async (req, res) => {
  const {id} = req.params
  const {rows} = await db.query(`
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
    WHERE x.id=:id`, {id})
  res.send(rows)
});

router.get('/InstitutionByCUI/:reg_no', async (req, res) => {
  const {rows} = await db.query(`
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
    FROM institution where reg_no=:reg_no
    `, req.params)
  res.send(rows)
});

router.get('/InstitutionById/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
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
    FROM institution where id=:id
    `, req.params)
  res.send(rows)
});

router.get('/InstitutionByCity/:str', async (req, res) => {
  const {rows} = await db.query(`
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
    FROM institution where locality ilike '%' || :str || '%'
    `, req.params)
  res.send(rows)
});

router.get('/InstitutionsByADCompany/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
    SELECT DISTINCT ON (i.id)
      i.id as "Id",
      i.reg_no AS "CUI",
      i.name AS "Nume"
    FROM contract c
    INNER JOIN institution as i ON i.id = c.institution
    WHERE c.company = :id
  `, req.params)
  res.send(rows)
});

router.get('/InstitutionsByTenderCompany/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
    SELECT DISTINCT ON (i.id)
      i.id as "Id",
      i.reg_no AS "CUI",
      i.name AS "Nume"
    FROM tender t
    INNER JOIN institution as i ON i.id = t.institution
    WHERE t.company = :id
  `, req.params)
  res.send(rows)
});

router.get('/ADCompaniesByInstitution/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
    SELECT DISTINCT ON (x.id)
      x.id as "CompanieId",
      x.name AS "Nume"
    FROM contract c
    INNER JOIN company x ON x.id = c.company
    WHERE c.institution = :id
  `, req.params)
  res.send(rows)
});

router.get('/TenderCompaniesByInstitution/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
    SELECT DISTINCT ON (x.id)
      x.id as "CompanieId",
      x.name AS "Nume"
    FROM tender t
    INNER JOIN company x ON x.id = t.company
    WHERE t.institution = :id
  `, req.params)
  res.send(rows)
});

router.get('/InstitutionContracts/:id(\\d+)/:page(\\d+)?', async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;
  var params = {id: req.params.id}

  var query = `
    SELECT
      x.id AS "ContracteId", 
      x.contract_no AS "NumarContract",
      substring(x.title, 0, 100) as "TitluContract", 
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode"
    FROM contract x 
    where institution = :id::int
    ORDER BY x.contract_date DESC
  `

  if (!fetchAll) {
    query += "LIMIT :pageSize OFFSET :pageStart"
    params["pageSize"] = paginationWindow
    params["pageStart"] = paginationWindow * (page-1)
  }

  const {rows} = await db.query(query, params)
  res.send(rows)
});

router.get('/InstitutionTenders/:id(\\d+)/:page(\\d+)?', async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;
  var params = {id: req.params.id}

  var query = `
    SELECT
      x.id AS "LicitatieID", 
      x.contract_no AS "NumarContract",
      substring(x.title, 0, 100) as "TitluContract", 
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode"
    FROM tender x 
    where institution = :id::int
    ORDER BY x.contract_date DESC
  `

  if (!fetchAll) {
    query += "LIMIT :pageSize OFFSET :pageStart"
    params["pageSize"] = paginationWindow
    params["pageStart"] = paginationWindow * (page-1)
  }

  const {rows} = await db.query(query, params)
  res.send(rows)
});

router.get('/PublicInstitutionSummary/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
  SELECT
  ( SELECT name FROM institution where id = :id ) as nume_institutie,
  ( SELECT COUNT(*)::int FROM contract where institution = :id ) as nr_achizitii,
  ( SELECT COUNT(*)::int FROM tender where institution = :id) as nr_licitatii
  `, req.params)
  res.send(rows)
})

router.get('/CountAD/:company_id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
    SELECT count(*)::int AS "ADcontracts" FROM contract WHERE company=:company_id
  `, req.params)
  res.send(rows)
})

router.get('/CountTender/:company_id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
    SELECT count(*)::int AS "TenderContracts" FROM tender WHERE company=:company_id
  `, req.params)
  res.send(rows)
});

router.get('/CompanyContracts/:reg_no', async (req, res) => {
  const {rows} = await db.query(`
    SELECT 
      x.id AS "ContractID", 
      x.contract_no AS "NumarContract", 
      x.title AS "TitluContract",
      x.price_ron AS "ValoareRON" 
    FROM contract x 
    INNER JOIN company c ON x.company=c.id
    WHERE c.reg_no = :reg_no
    ORDER BY x.contract_date DESC
  `, req.params)
  res.send(rows)
});

router.get('/ADCompanyContracts/:id(\\d+)/:page(\\d+)?', async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;
  var params = {id: req.params.id}

  var query = `
    SELECT
      x.id AS "ID",
      substring(x.title, 0, 100) as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode",
      i.county AS "Judet"
    FROM contract x 
    INNER JOIN institution i ON i.id = x.institution
    where company = :id
    ORDER BY x.contract_date DESC
  `

  if (!fetchAll) {
    query += "LIMIT :pageSize OFFSET :pageStart"
    params["pageSize"] = paginationWindow
    params["pageStart"] = paginationWindow * (page-1)
  }

  const {rows} = await db.query(query, params)
  res.send(rows)
});

router.get('/TenderCompanyTenders/:id(\\d+)/:page(\\d+)?', async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;
  var params = {id: req.params.id}

  var query = `
    SELECT
      x.id AS "ID",
      substring(x.title, 0, 100) as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract", 
      x.cpvcode AS "CPVCode",
      i.county AS "Judet"
    FROM tender x 
    INNER JOIN institution i ON i.id = x.institution
    where company = :id
    ORDER BY x.contract_date DESC
  `

  if (!fetchAll) {
    query += "LIMIT :pageSize OFFSET :pageStart"
    params["pageSize"] = paginationWindow
    params["pageStart"] = paginationWindow * (page-1)
  }

  const {rows} = await db.query(query, params)
  res.send(rows)
})

router.get('/CompanyTenders/:reg_no', async (req, res) => {
  const {rows} = await db.query(`
    SELECT 
      x.id AS "TenderId", 
      x.contract_no AS "NumarContract", 
      x.title AS "TitluContract",
      x.price_ron AS "ValoareRON" 
    FROM tender x 
    INNER JOIN company c ON x.company=c.id
    WHERE c.reg_no = :reg_no
    ORDER BY x.contract_date DESC
  `, req.params)
  res.send(rows)
});

router.get('/ADCompanyByCUI/:reg_no$|/TenderCompanyByCUI/:reg_no$', async (req, res) => {
  const {rows} = await db.query(`
    SELECT 
      x.id AS "CompanieId",
      x.name AS "Nume",
      x.reg_no AS "CUI",
      x.country AS "Tara",
      x.locality AS "Localitate",
      x.address AS "Adresa"
    FROM company x
    WHERE x.reg_no = :reg_no
  `, req.params)
  res.send(rows)
});

router.get('/ADCompany/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
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
    WHERE x.id = :id
    GROUP BY x.id
  `, req.params)
  res.send(rows)
});

router.get('/TenderCompany/:id(\\d+)', async (req, res) => {
  const {rows} = await db.query(`
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
    WHERE x.id = :id
    GROUP BY x.id
  `, req.params)
  res.send(rows)
});

router.get('/SearchInstitution/:pattern', async (req, res) => {
  const {rows} = await db.query(`
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
    FROM institution WHERE name ilike '%' || :pattern || '%'
  `, req.params)
  res.send(rows)
});

router.get('/SearchADCompany/:pattern$|/SearchTenderCompany/:pattern$', async (req, res) => {
  const {rows} = await db.query(`
    SELECT 
      x.id AS "CompanieId",
      x.name AS "Nume",
      x.reg_no AS "CUI",
      x.country AS "Tara",
      x.locality AS "Localitate",
      x.address AS "Adresa"
    FROM company x
    WHERE x.name ilike '%' || :pattern || '%'
  `, req.params)
  res.send(rows)
});

router.get('/SearchAD/:pattern/:page?', async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;
  var params = {pattern: req.params.pattern}

  var query = `
    SELECT
      x.id AS "ContracteId",
      x.title as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract"
    FROM contract x
    WHERE to_tsvector('romanian', x.title) @@ to_tsquery('romanian', :pattern)
    ORDER BY x.contract_date DESC
  `

  if (!fetchAll) {
    query += "LIMIT :pageSize OFFSET :pageStart"
    params["pageSize"] = paginationWindow
    params["pageStart"] = paginationWindow * (page-1)
  }

  const {rows} = await db.query(query, params)
  res.send(rows)
});

router.get('/SearchTender/:pattern/:page?', async (req, res) => {
  var fetchAll = req.query.fetchAll === 'true'
  var page = parseInt(req.params.page) || 1;
  var params = {pattern: req.params.pattern}

  var query = `
    SELECT
      x.id AS "LicitatieId",
      x.title as "TitluContract",
      x.price_ron AS "ValoareRON", 
      x.contract_date::text AS "DataContract"
    FROM tender x
    WHERE to_tsvector('romanian', x.title) @@ to_tsquery('romanian', :pattern)
    ORDER BY x.contract_date DESC
  `

  if (!fetchAll) {
    query += "LIMIT :pageSize OFFSET :pageStart"
    params["pageSize"] = paginationWindow
    params["pageStart"] = paginationWindow * (page-1)
  }

  const {rows} = await db.query(query, params)
  res.send(rows)
});

router.get('/TopADcompaniesByInstitution/:id$', async (req, res) => {
  const {rows} = await db.query(`
    WITH main AS (
      SELECT company, sum(price_ron) AS total FROM contract
      WHERE institution=:id
      GROUP by company
    )
    SELECT 
      c.id AS "CompanieId",
      c.name AS "Nume",
      total
    FROM main INNER JOIN company c ON main.company = c.id
    ORDER BY total DESC
    LIMIT 10
  `, req.params)
  res.send(rows)
});

router.get('/TopTendercompaniesByInstitution/:id$', async (req, res) => {
  const {rows} = await db.query(`
    WITH main AS (
      SELECT company, sum(price_ron) AS total FROM tender
      WHERE institution=:id
      GROUP by company
    )
    SELECT 
      c.id AS "CompanieId",
      c.name AS "Nume",
      total
    FROM main INNER JOIN company c ON main.company = c.id
    ORDER BY total DESC
    LIMIT 10
  `, req.params)
  res.send(rows)
});
