# tabela `company`

Lista de companii și informații asociate de la registrul comerțului

## Structure

~~~ sql
create table company
(
	id serial not null
		constraint company_pkey
			primary key,
	name varchar(400),
	reg_no varchar(70),
	country char(30),
	locality varchar(80),
	address varchar(500),
	contract_company integer
		constraint company_contract_company_fkey
			references contract_company,
	tender_company integer
		constraint company_tender_company_fkey
			references tender_company
);

alter table company owner to hbp;

create unique index company_reg_no_idx
	on company (reg_no);

create index company_to_tsvector_idx
	on company (to_tsvector('romanian'::regconfig, name::text));
~~~

## semnificație coloane

|column|purpose|example
|---|---|---
|id|primary key / auto incremented|123456
|name|Denumire oficială|S.C. SOME COMPANY S.R.L
|reg_no|numarul de înregistrare la registrul comertului|10016586
|country|Țara de înregistrare|Romania                       
|locality|Localitate|București
|address|Adresa companiei|STRADA LIBERTATII, NR 350 A
|contract_company|legătura cu tabela `contract_company` - De clarificat
|tender_company|legătura cu tabela `tender_company` - De clarificat
