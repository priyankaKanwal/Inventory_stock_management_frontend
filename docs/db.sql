--
-- PostgreSQL database dump
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Alembic version
--

CREATE TABLE public.alembic_version (
    version_num VARCHAR(32) NOT NULL
);

ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Categories
--

CREATE TABLE public.categories (
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    id UUID NOT NULL
);

ALTER TABLE public.categories OWNER TO postgres;

--
-- Products
--

CREATE TABLE public.products (
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(30) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity_in_stock INTEGER NOT NULL,
    reorder_level INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    id UUID NOT NULL,
    category_id UUID NOT NULL,
    supplier_id UUID NOT NULL
);

ALTER TABLE public.products OWNER TO postgres;

--
-- Revoked Tokens
--

CREATE TABLE public.revoked_tokens (
    id UUID NOT NULL,
    jti UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_type VARCHAR(20) NOT NULL
);

ALTER TABLE public.revoked_tokens OWNER TO postgres;

--
-- Suppliers
--

CREATE TABLE public.suppliers (
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    id UUID NOT NULL
);

ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Users
--

CREATE TABLE public.users (
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    id UUID NOT NULL
);

ALTER TABLE public.users OWNER TO postgres;

--
-- Alembic data
--

INSERT INTO public.alembic_version (version_num)
VALUES ('51da2109bb98');

--
-- Categories data
--

INSERT INTO public.categories
(name, description, created_at, id)
VALUES
('electronic appliances', '', '2026-08-25 10:49:34.322885',
 '03d644b2-c214-48f3-9863-bb77aa3ab55b'),

('Footwear', '', '2026-08-26 17:19:19.253331',
 '533a15dd-5c2d-4037-81f4-de00b87e68a2'),

('Clothes', 'Things to wear on your body',
 '2026-08-27 10:07:08.978267',
 'ff848db9-35d3-4085-a45f-95aa4aee11bb'),

('Cosmetics',
 'such as lipstck,foundation, concealor ,and skincare items.',
 '2026-08-27 10:11:05.528518',
 '6227c031-67ac-497d-9c8a-8caf5f6f6e5a');

--
-- Products data
--

INSERT INTO public.products
(name, sku, unit_price, quantity_in_stock, reorder_level,
 is_active, created_at, updated_at, id, category_id, supplier_id)
VALUES
(
'fridge',
'sam928',
199222.00,
3,
2,
TRUE,
'2026-08-27 11:19:09.31997',
'2026-08-27 11:19:09.319973',
'733784bb-7a4b-45fa-a9c8-f23677d3a141',
'03d644b2-c214-48f3-9863-bb77aa3ab55b',
'8ff19537-9752-4646-8a4f-bc947fed6ce0'
),
(
'SHIRT',
'HM928',
1321.00,
10,
0,
TRUE,
'2026-08-27 11:23:27.918025',
'2026-08-27 11:23:27.918028',
'942c6859-3af0-451b-a7d7-f21111d25b34',
'ff848db9-35d3-4085-a45f-95aa4aee11bb',
'c66934cb-26bd-4762-9561-0e39fb912518'
),
(
'Perfume',
'perf28',
90000.00,
0,
0,
TRUE,
'2026-08-27 11:26:53.694581',
'2026-08-27 11:26:53.694585',
'2ff6766a-79cd-4561-87f7-963ff83db300',
'6227c031-67ac-497d-9c8a-8caf5f6f6e5a',
'59d630ec-3ef8-4ab3-a347-61a9207ce32a'
),
(
'Chic bowler bag',
'hiz-09',
9000999.00,
90000,
1000,
TRUE,
'2026-08-27 11:30:18.33483',
'2026-08-27 11:30:18.334834',
'd8281ad9-3f59-4476-885c-81602bb7d46d',
'6227c031-67ac-497d-9c8a-8caf5f6f6e5a',
'd1b5bd18-55f3-4434-994c-e58f1112087a'
),
(
'Voltas',
'Voltas-12',
10000.00,
88,
10,
TRUE,
'2026-08-25 10:56:19.715955',
'2026-09-03 15:58:59.537589',
'795403a1-d553-4e05-bf3b-b0c2b426d723',
'03d644b2-c214-48f3-9863-bb77aa3ab55b',
'8ff19537-9752-4646-8a4f-bc947fed6ce0'
),
(
'Nike AF1',
'AF-1uy7',
10099.00,
32,
100000,
FALSE,
'2026-08-27 10:16:39.613873',
'2026-09-10 15:46:08.275383',
'202249e5-827c-471d-af48-b6c6c78da763',
'533a15dd-5c2d-4037-81f4-de00b87e68a2',
'dae3c283-d7bc-4871-9d4d-dab61892619a'
),
(
'Lip tint',
'tint28',
13378.00,
19,
237,
FALSE,
'2026-08-27 11:25:02.325454',
'2026-09-10 15:47:16.901686',
'2ecc8361-85df-4d55-b4e2-e71a69c14fb9',
'6227c031-67ac-497d-9c8a-8caf5f6f6e5a',
'59d630ec-3ef8-4ab3-a347-61a9207ce32a'
),
(
'Skirt',
'sgh-0',
9009.00,
200,
10,
FALSE,
'2026-08-27 11:35:54.218813',
'2026-09-10 15:49:03.056586',
'e1b116a4-e272-4e22-9e8c-7b098d72b062',
'ff848db9-35d3-4085-a45f-95aa4aee11bb',
'5c49dc7f-dea3-4382-9b4f-06a0f2c825c2'
);

--
-- Revoked tokens data
--

INSERT INTO public.revoked_tokens
(id, jti, expires_at, token_type)
VALUES
(
'43f1cf64-35a0-45a5-a954-e8f2b6a1ea10',
'7c36f781-514b-4dcd-bf90-168a579c1d81',
'2026-09-10 14:26:14+05:30',
'access'
),
(
'98a9eb45-9ac6-4ea5-a0f1-da083b695610',
'baa46c69-36ae-4488-8075-487b3663d8a7',
'2026-09-11 15:37:16+05:30',
'access'
),
(
'f3c76312-606f-4964-ad9b-fdfea302753d',
'9f90fdb6-323f-4a2f-8fb9-42268b6a9976',
'2026-09-14 13:40:56+05:30',
'access'
),
(
'c1ab4987-8e2b-436a-b860-4bcc8ed0cec4',
'db9d046a-fad7-4e78-a4ff-2cdc5eae75c5',
'2026-09-14 13:54:21+05:30',
'access'
),
(
'2a5ec763-abed-4a2a-be01-6c5e466fd98c',
'c93d798a-c987-4e9b-a54f-60ffbfb33ba9',
'2026-09-14 15:58:24+05:30',
'access'
),
(
'8c413d04-7ddd-43e2-8bbd-bd99aec8e894',
'949d045a-6a05-4ce8-a760-bd571bd51245',
'2026-09-21 14:57:50+05:30',
'access'
),
(
'030fd22d-90ca-4f0e-9c59-89a424a5b1d9',
'c82555f8-06a4-4398-bddf-7776b41eec20',
'2026-09-14 16:31:09+05:30',
'access'
),
(
'0210ef60-6a89-4194-bc73-37c8a8caa589',
'3c624c6e-ca69-4aca-bf78-3dc623746834',
'2026-09-21 15:30:14+05:30',
'refresh'
);

--
-- Suppliers data
--

INSERT INTO public.suppliers
(name, contact_email, phone, address, created_at, id)
VALUES
('ABC_pvt_ltd', 'abc@example.com', '3746282382', 'london',
 '2026-08-25 10:55:22.170831',
 '8ff19537-9752-4646-8a4f-bc947fed6ce0'),

('Nike', 'user123@example.com', '7364878233', 'America',
 '2026-08-27 10:12:55.247957',
 'dae3c283-d7bc-4871-9d4d-dab61892619a'),

('samsung', 'sanr@example.com', '8268899944', 'kolkata',
 '2026-08-27 11:15:50.450422',
 '25121ee8-0cf4-4e0b-acb0-a2b32fbc9f5b'),

('H & M', 'HM@example.com', '4762787122', 'UK',
 '2026-08-27 11:21:41.007726',
 'c66934cb-26bd-4762-9561-0e39fb912518'),

('DIOR', 'DIOR@example.com', '4762783322', 'FRANCE',
 '2026-08-27 11:24:06.946668',
 '59d630ec-3ef8-4ab3-a347-61a9207ce32a'),

('Chanel', 'ch@example.com', '4762783002', 'paris',
 '2026-08-27 11:29:03.398177',
 'd1b5bd18-55f3-4434-994c-e58f1112087a'),

('Volchok', 'vikchk@example.com', '476288882', 'Russia',
 '2026-08-27 11:33:57.708053',
 '5c49dc7f-dea3-4382-9b4f-06a0f2c825c2'),

('jakson', 'jakson@gmail.com', '5973053809', 'nsez',
 '2026-09-08 13:30:39.605071',
 'bf18376c-50bf-4a24-b24c-17ebad34f565');

--
-- Users data
--

INSERT INTO public.users
(username, email, password_hash, role, id)
VALUES
(
'ashish',
'ashish@example.com',
'$2b$12$LE9rm0aLB/x1a/w1xgn9e.P.VhvIzp710iix1Et2vcM1B67W7u46K',
'STAFF',
'ce55b388-2d9f-4ff8-8bec-87de33a9157a'
),
(
'Manya',
'manya@example.com',
'$2b$12$08FW0Oh.X6wvxVS0Gex5EODPMmLHm1NbLo/B5GU03OtV0Ad5qCWni',
'ADMIN',
'bccbae08-d440-442d-a3ed-8ca46c74b6be'
),
(
'Mana',
'mnya@example.com',
'$2b$12$5SGQcmxBU6BpTMoPIPfXle0nCLrVWVH03hcVAAaSaCEhv8yCXpSMS',
'AD',
'6679b03b-59ec-481b-bf0f-56d7d14d41ca'
),
(
'priyal',
'user@admin.com',
'$2b$12$jwfIP3UD4asG0JLqGefpPuCa1.sqKpyvxKLa1gQ4V6sxpFveaZNDK',
'ADMIN',
'63bbbd46-ff49-41bf-8ec3-32a08d62cc65'
),
(
'yug',
'yuvi@admin.com',
'$2b$12$tgwU.0s9lgwWXJ9HBwA9yOeqixDSIYT.3Cw29mI0h4YuRKmiazn7G',
'ADMIN',
'3a70ddab-d17b-479c-aa00-d87e159b9a42'
),
(
'ishu',
'ishu@staff.com',
'$2b$12$WOCO9WuHJERLmXt..lj1QeO6IRARAgjywMXw84YJc94WhytYziCqK',
'STAFF',
'9d10c710-9bf7-41f9-93e4-d8aadd089dd7'
),
(
'shivi',
'shivi@admin.com',
'$2b$12$HkNIfF/kznRJphQLM7Ou.OjmVM0WDpvbZYGHlyAxOoRTOSeyINC6u',
'ADMIN',
'bd2005ba-6eee-4f82-a0cb-736ad2f1ee70'
),
(
'dev',
'dev@admin.com',
'$2b$12$uI2uxcK6e8LIpaMCNnYJ7unmxDZ26JoUzclN9VWgkhC6qm7rUD7fu',
'ADMIN',
'a0498af7-257c-45f9-88cb-87b58c921bef'
),
(
'divyansh',
'devy@admin.com',
'$2b$12$IDvd59B3XWaz/0Bn/.L.cOim8YGcAf8n4Lf00bWDJUxi2YHqWQSce',
'ADMIN',
'0b8d71ed-4e5c-4b10-a5f9-7b2a416bd9d3'
),
(
'yumiko',
'yumiko@staff.com',
'$2b$12$MDLmbaFHFeyCTdNod5dvau.UbCHYWPD020I735UAyCjTbXTtn.Cg6',
'STAFF',
'caaf7bb4-b9fb-4019-9336-0801a1bd1e08'
);

--
-- Constraints
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc
    PRIMARY KEY (version_num);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key
    UNIQUE (name);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey
    PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey
    PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key
    UNIQUE (sku);

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_jti_key
    UNIQUE (jti);

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey
    PRIMARY KEY (id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey
    PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey
    PRIMARY KEY (id);

--
-- Indexes
--

CREATE INDEX ix_categories_id
ON public.categories USING btree (id);

CREATE INDEX ix_products_id
ON public.products USING btree (id);

CREATE INDEX ix_suppliers_id
ON public.suppliers USING btree (id);

CREATE UNIQUE INDEX ix_users_email
ON public.users USING btree (email);

CREATE INDEX ix_users_id
ON public.users USING btree (id);

CREATE UNIQUE INDEX ix_users_username
ON public.users USING btree (username);

--
-- Foreign keys
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey
    FOREIGN KEY (category_id)
    REFERENCES public.categories(id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey
    FOREIGN KEY (supplier_id)
    REFERENCES public.suppliers(id);