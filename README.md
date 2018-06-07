# HBP-api
## New API calls
* /apiV2/institutions
  
  Returns a list of institutiions for displaying pins on a map. The call can perform nearest-neighbour clustering (50 pixels threshold)
  #### query parameters
  * n=`float` - limit to institutions bound to north
  * s=`float` - limit to institutions bound to south
  * e=`float` - limit to institutions bound to east
  * w=`float` - limit to institutions bound to west
  * cluster=`bool` - perform server-side clustering
  * size=`int`|`float` - size of screen in pixels (required if clustering)
  
  When clustering all parameters are mandatory. Screen size should be measured on the diagonal; send $\sqrt(w^2 + h^2)$. Clustering is automatically disabled when the lsit of results is shorter than 15 pins.
  #### result structure
  * with clustering:

  ```json
  [
    {
    "lat": 47.0423924,
    "lng": 23.0417557,
    "count": 261,
    "id": 1208
    },
    {
    "lat": 46.2076817,
    "lng": 26.6168243,
    "count": 181,
    "id": 1324
    },
    {
    "lat": 47.2779386,
    "lng": 24.5954338,
    "count": 332,
    "id": 1867
    },
    ....
  ]
  ```
  When entry $count$ is 1 the pin did not require clustering. Otherwise $count$ is the size of the cluster. $id$ is the identifier of the institution around which the cluster was formed.
  * when not clustering
  ```json
  [
    {
    "id": 7915,
    "lng": 27.5785079,
    "lat": 46.9201617
    },
    {
    "id": 8066,
    "lng": 27.5785079,
    "lat": 46.9201617
    },
    {
    "id": 8421,
    "lng": 27.5781946,
    "lat": 46.9214742
    },
    ...
  ]
  ``` 

* /apiV2/institution_summary/$id$
  
  Returns information about the institution identified by $id$
  #### result structure
  ```json
  {
    "id": 10,
    "name": "ORAS CIMPENI",
    "county": "Alba",
    "reg_no": "4331112",
    "locality": "Orasul Cimpeni",
    "address": "Alba, Orasul Cimpeni, STRADA Avram Iancu, Numar 5, Bloc/Scara , Sector , Cod postal 515500",
    "long": 23.0459729,
    "lat": 46.3628153,
    "contract_count": "34",
    "tender_count": "19",
    "contract_total_ron": "697335.40",
    "tender_total_ron": "10204049.68"
  }
  ```

* /apiV2/institution_stats/$id$
  
  Returns basic information about the institution identified by $id$ as well as histogram information and totals by _cpv_ (Common Procurement Vocabulary)
  #### query parameters
  * start=`date` - optional start date for histograms and totals by _cpv_, defaults to `2007-01-01`
  * end=`date` - optional end date, for same purposes, defaults to current date

  Histogram is scaled to contain at most 64 data points for equal intervals in days. Totals by _cpv_ will show aggregate figures grouped by the first two digits of the _cpv_ code; the result only includes the top 20 entries, as well as the sum for the remaining (if any). The latter entry's `category` field contains the value `"others"`.
  #### result structure
  ```json
  {
    "details": {
      "id": 10,
      "name": "ORAS CIMPENI",
      "county": "Alba",
      "reg_no": "4331112",
      "locality": "Orasul Cimpeni",
      "address": "Alba, Orasul Cimpeni, STRADA Avram Iancu, Numar 5, Bloc/Scara , Sector , Cod postal 515500",
      "long": 23.0459729,
      "lat": 46.3628153,
      "contract_count": "34",
      "tender_count": "19",
      "contract_total_ron": "697335.40",
      "tender_total_ron": "10204049.68"
    },
    "hist": [
      {
      "date": "2007-02-03",
      "start_date": "2007-01-01",
      "end_date": "2007-03-07",
      "contract_total_ron": "0",
      "contract_total_eur": "0",
      "contract_count": "0",
      "tender_total_ron": "0",
      "tender_total_eur": "0",
      "tender_count": "0"
      },
      ...
    ],
    "cpv": [
      {
      "category": "45",
      "total": "9682822.48"
      },
      ...
      {
      "category": "others",
      "total": null
      }
    ]
  }
  ```
  The `date` field in the histogram represents the interval median date.
  The cummulative amounts in the _cpv_ stats are calcualted for the `start`-`end` interval provided or implied.

* /apiV2/company_stats/$id$
  
  Returns basic information about the company identified by $id$, histogram information and totals by _cpv_ (Common Procurement Vocabulary) as well as totals by county for choropleth map displays.
  #### query parameters
  * start=`date` - optional start date for histograms and totals by _cpv_, defaults to `2007-01-01`
  * end=`date` - optional end date, for same purposes, defaults to current date

  Histogram is scaled to contain at most 64 data points for equal intervals in days. Totals by _cpv_ will show aggregate figures grouped by the first two digits of the _cpv_ code; the result only includes the top 20 entries, as well as the sum for the remaining (if any). The latter entry's `category` field contains the value `"others"`.
  #### result structure
  ```json
  {
    "details": {
      "id": 99,
      "name": "Ernst&Young Assurance Services SRL",
      "country": "Romania                       ",
      "reg_no": "11909783",
      "locality": "Bucuresti",
      "address": "Bv. Ion Mihalache Blvd, nr. 15-17, Bucharest Tower Center Building",
      "contract_count": "0",
      "tender_count": "5",
      "contract_total_ron": "0",
      "tender_total_ron": "2655000.00"
    },
    "hist": [
      {
      "date": "2007-02-03",
      "start_date": "2007-01-01",
      "end_date": "2007-03-07",
      "contract_total_ron": "0",
      "contract_total_eur": "0",
      "contract_count": "0",
      "tender_total_ron": "0",
      "tender_total_eur": "0",
      "tender_count": "0"
      },
      ...
    ],
    "cpv": [
      {
      "category": "45",
      "total": "9682822.48"
      },
      ...
      {
      "category": "others",
      "total": null
      }
    ],
    "map": [
      {
      "county": "Bucuresti",
      "total": "1845000.00"
      }
    ]
  }
  ```
  The `date` field in the histogram represents the interval median date.
  The cummulative amounts in the _cpv_ stats and choropleth figures are calcualted for the `start`-`end` interval provided or implied.

* /apiV2/institution/$id$/contracts
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of direct procurement contracts for the institution identified by $id$.
  
  ### sorting keys
  * title
  * price_ron
  * contract_date

  #### result item structure
  ```json
  {
    "id": 4415747,
    "title": "Materiale constructii diverse ",
    "contract_date": "2016-03-07",
    "price_ron": "3760.68"
  }
  ```

* /apiV2/institution/$id$/tenders
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of tender contracts for the institution identified by $id$.
  
  ### sorting keys
  * title
  * price_ron
  * contract_date

  #### result item structure
  ```json
  {
    "id": 24713,
    "title": "Lucrari de reparatii generale si renovare corp V",
    "contract_date": "2007-11-27",
    "price_ron": "518840.00"
  }
  ```
  The `date` field in the histogram represents the interval median date.
  The cummulative amounts in the _cpv_ stats and choropleth figures are calcualted for the `start`-`end` interval provided or implied.

* /apiV2/institution/$id$/companies
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of companies that have had contracts with the instiuttion identified by $id$
  
  ### sorting keys
  * name
  * contract_count
  * contract_total_eur
  * contract_total_ron
  * tender_count
  * tender_total_eur
  * tender_total_ron

  #### result item structure
  ```json
  {
    "id": 2486,
    "name": "UNIVERSITATEA TRANSILVANIA BRASOV",
    "contract_count": "6",
    "contract_total_eur": "8434.60",
    "contract_total_ron": "34980.00",
    "tender_count": "25",
    "tender_total_eur": "937992.49",
    "tender_total_ron": "3575599.51"
  }
  ```

* /apiV2/company/$id$/contracts
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of direct procurement contracts for the company identified by $id$.
  
  ### sorting keys
  * title
  * price_ron
  * contract_date

  #### result item structure
  ```json
  {
    "id": 4415747,
    "title": "Materiale constructii diverse ",
    "contract_date": "2016-03-07",
    "price_ron": "3760.68"
  }
  ```

* /apiV2/company/$id$/tenders
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of tender contracts for the company identified by $id$.
  
  ### sorting keys
  * title
  * price_ron
  * contract_date

  #### result item structure
  ```json
  {
    "id": 24713,
    "title": "Lucrari de reparatii generale si renovare corp V",
    "contract_date": "2007-11-27",
    "price_ron": "518840.00"
  }
  ```
  The `date` field in the histogram represents the interval median date.
  The cummulative amounts in the _cpv_ stats and choropleth figures are calcualted for the `start`-`end` interval provided or implied.

* /apiV2/company/$id$/institutions
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of institutions that have had contracts with the company identified by $id$
  
  ### sorting keys
  * name
  * contract_count
  * contract_total_eur
  * contract_total_ron
  * tender_count
  * tender_total_eur
  * tender_total_ron

  #### result item structure
  ```json
  {
    "id": 2486,
    "name": "UNIVERSITATEA TRANSILVANIA BRASOV",
    "contract_count": "6",
    "contract_total_eur": "8434.60",
    "contract_total_ron": "34980.00",
    "tender_count": "25",
    "tender_total_eur": "937992.49",
    "tender_total_ron": "3575599.51"
  }
  ```

* /apiV2/search/institution/$pattern$
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of institutions with name matching $pattern$ (full text search)
  
  ### sorting keys
  * name
  * reg_no
  * county 
  * locality

  #### result item structure
  ```json
  {
    "id": 11,
    "name": "Primaria MUNICIPIUL SEBES",
    "reg_no": "4331201",
    "county": "Alba",
    "locality": "Municipiul Sebes",
    "address": "Alba, Municipiul Sebes, PIATA PRIMARIEI, Numar 1, Bloc/Scara , Sector 1, Cod postal 515800",
    "long": 23.5663758,
    "lat": 45.9595588,
    "version": 0
  }
  ```

* /apiV2/search/company/$pattern$
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of companies with name matching $pattern$ (full text search)
  
  ### sorting keys
  * name
  * reg_no
  * country
  * locality

  #### result item structure
  ```json
  {
    "id": 622,
    "name": "MEDICA VITA TEST S.R.L",
    "reg_no": "16500665",
    "country": "Romania                       ",
    "locality": "Pitesti",
    "address": "PITESTI , STR. VASILE LUPU , NR. 9 , ARGES"
  }
  ```

* /apiV2/search/contract/$pattern$
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of direct procurement contracts with title matching $pattern$ (full text search)
  
  ### sorting keys
  * title
  * price_ron
  * contract_date

  #### result item structure
  ```json
  {
    "id": 4665411,
    "title": " HIV 1-2 Anticorp Test rapid Casete Test imunocromatografic ",
    "price_ron": "87.50",
    "contract_date": "2014-05-14"
  }
  ```

* /apiV2/search/tender/$pattern$
  
  This endpoint implements <a href="#ssp">server-side pagination and sorting</a>.

  Returns the list of tender contracts with title matching $pattern$ (full text search)
  
  ### sorting keys
  * title
  * price_ron
  * contract_date

  #### result item structure
  ```json
  {
    "id": 66816,
    "title": "CONTRACT FURNIZARE ,,TESTE PENTRU DETERMINAREA MARKERILOR CARDIACI\"",
    "price_ron": "129600.00",
    "contract_date": "2008-03-25"
  }
  ```

* /apiV2/search/reg_no/$reg\_no$

  Returns the first matching company or institution by registration number ($reg\_no$)

  #### result structure
  ```json
  {
    "id": 1208,
    "is_company": false
  }
  ```


## <a name="ssp">Server-side pagination and sorting</a>
When an API endpoint is designed with server-side pagination and sorting the following rules apply.
### Query parameters
The following query parameters are always valid:
* page=`int` - the page number, defaults to 1
* perPage=`int` - the page size, defaults to 10
* sortBy=`column name` - optionally apply sorting expression; we will provide a list of valid sorting expressions for applicable calls
* sortDesc=`boolean` - when sorting, this specifies that the sorting direction is descending; defaults to `false` (ascending order)

### Result structure
The result structure for such endoints is always the following:
```json
{
  "items": [
    {
      ...
    },
    ...
  ],
  "count": "128"
}
```
For such endpoints we will only provide the result structure of an individual item.