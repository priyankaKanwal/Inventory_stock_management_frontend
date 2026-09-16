-- Clean PostgreSQL script for Inventory Stock Management
-- Compatible with PostgreSQL 18 and easy to run in pgAdmin Query Tool.
-- This version avoids pg_dump COPY/psql-specific commands such as \restrict,
-- \unrestrict, and COPY ... FROM stdin.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables so this script can be run on a fresh/reset database.
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.revoked_tokens CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.alembic_version CASCADE;

CREATE TABLE public.alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

CREATE TABLE public.categories (
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_name_key UNIQUE (name)
);

CREATE TABLE public.suppliers (
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

CREATE TABLE public.users (
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    id UUID NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

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
    supplier_id UUID NOT NULL,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_sku_key UNIQUE (sku)
);

CREATE TABLE public.revoked_tokens (
    id VARCHAR(36) NOT NULL,
    jti VARCHAR(36) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_type VARCHAR(20) NOT NULL,
    CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT revoked_tokens_jti_key UNIQUE (jti)
);

-- Alembic version
INSERT INTO public.alembic_version (version_num)
VALUES ('9f15a6a3363d');

-- Categories
INSERT INTO public.categories (name, description, created_at, id, is_deleted)
VALUES
('electronic appliances', NULL, '2026-08-25 10:49:34.322885', '03d644b2-c214-48f3-9863-bb77aa3ab55b', FALSE),
('Footwear', NULL, '2026-08-26 17:19:19.253331', '533a15dd-5c2d-4037-81f4-de00b87e68a2', FALSE),
('Clothes', 'Things to wear on your body', '2026-08-27 10:07:08.978267', 'ff848db9-35d3-4085-a45f-95aa4aee11bb', FALSE),
('Cosmetics', 'such as lipstck,foundation, concealor ,and skincare items.', '2026-08-27 10:11:05.528518', '6227c031-67ac-497d-9c8a-8caf5f6f6e5a', FALSE),
('Automobile', 'vehicles', '2026-09-15 14:39:09.361024', '4ab8dfaf-9e32-43c1-8803-6ccda8eabe0e', FALSE);

-- Suppliers
INSERT INTO public.suppliers
(name, contact_email, phone, address, created_at, id, is_deleted)
VALUES
('ABC_pvt_ltd', 'abc@example.com', '3746282382', 'london', '2026-08-25 10:55:22.170831', '8ff19537-9752-4646-8a4f-bc947fed6ce0', FALSE),
('Nike', 'user123@example.com', '7364878233', 'America', '2026-08-27 10:12:55.247957', 'dae3c283-d7bc-4871-9d4d-dab61892619a', FALSE),
('samsung', 'sanr@example.com', '8268899944', 'kolkata', '2026-08-27 11:15:50.450422', '25121ee8-0cf4-4e0b-acb0-a2b32fbc9f5b', FALSE),
('H & M', 'HM@example.com', '4762787122', 'UK', '2026-08-27 11:21:41.007726', 'c66934cb-26bd-4762-9561-0e39fb912518', FALSE),
('DIOR', 'DIOR@example.com', '4762783322', 'FRANCE', '2026-08-27 11:24:06.946668', '59d630ec-3ef8-4ab3-a347-61a9207ce32a', FALSE),
('Chanel', 'ch@example.com', '4762783002', 'paris', '2026-08-27 11:29:03.398177', 'd1b5bd18-55f3-4434-994c-e58f1112087a', FALSE),
('Volchok', 'vikchk@example.com', '47628882', 'Russia', '2026-08-27 11:33:57.708053', '5c49dc7f-dea3-4382-9b4f-06a0f2c825c2', FALSE),
('jakson', 'jakson@gmail.com', '5973053809', 'nsez', '2026-09-08 13:30:39.605071', 'bf18376c-50bf-4a24-b24c-17ebad34f565', FALSE);

-- Users
INSERT INTO public.users (username, email, password_hash, role, id)
VALUES
('Bhavya', 'bhavi@gmail.com', '$2b$12$iDvow9FVVkqOlo/2gVjm2OKTYbMr8F6EMspRsIwx.f4lL.N8CfXu.', 'ADMIN', '149d6492-ba9d-47bf-b160-06f4358b2c01'),
('ishu', 'ishika@yahoo.com', '$2b$12$UrS/faqclRNgFNbIrPMo/eAvnq4px/HQ07bkEaaxa4qAOWdbZpiz6', 'STAFF', 'f81f263a-76f8-44bf-a08c-be87f930fcd7'),
('yuvi', 'yuvi@gmail.com', '$2b$12$Cgu4Y9oq4aIII4qgzTsWQO7Iwle5rwJAks0yv7CHN1S7ikM9gNVAO', 'ADMIN', 'c328e63a-9c64-4cab-a9a1-100d9e07c0b0');

-- Products
INSERT INTO public.products
(name, sku, unit_price, quantity_in_stock, reorder_level, is_active,
 created_at, updated_at, id, category_id, supplier_id)
VALUES
('fridge', 'sam928', 199222.00, 3, 2, TRUE,
 '2026-08-27 11:19:09.319970', '2026-08-27 11:19:09.319973',
 '733784bb-7a4b-45fa-a9c8-f23677d3a141',
 '03d644b2-c214-48f3-9863-bb77aa3ab55b',
 '8ff19537-9752-4646-8a4f-bc947fed6ce0'),

('SHIRT', 'HM928', 1321.00, 10, 0, TRUE,
 '2026-08-27 11:23:27.918025', '2026-08-27 11:23:27.918028',
 '942c6859-3af0-451b-a7d7-f21111d25b34',
 'ff848db9-35d3-4085-a45f-95aa4aee11bb',
 'c66934cb-26bd-4762-9561-0e39fb912518'),

('Perfume', 'perf28', 90000.00, 0, 0, TRUE,
 '2026-08-27 11:26:53.694581', '2026-08-27 11:26:53.694585',
 '2ff6766a-79cd-4561-87f7-963ff83db300',
 '6227c031-67ac-497d-9c8a-8caf5f6f6e5a',
 '59d630ec-3ef8-4ab3-a347-61a9207ce32a'),

('Chic bowler bag', 'hiz-09', 9000999.00, 90000, 1000, TRUE,
 '2026-08-27 11:30:18.334830', '2026-08-27 11:30:18.334834',
 'd8281ad9-3f59-4476-885c-81602bb7d46d',
 '6227c031-67ac-497d-9c8a-8caf5f6f6e5a',
 'd1b5bd18-55f3-4434-994c-e58f1112087a'),

('Voltas', 'Voltas-12', 10000.00, 88, 10, TRUE,
 '2026-08-25 10:56:19.715955', '2026-09-03 15:58:59.537589',
 '795403a1-d553-4e05-bf3b-b0c2b426d723',
 '03d644b2-c214-48f3-9863-bb77aa3ab55b',
 '8ff19537-9752-4646-8a4f-bc947fed6ce0'),

('Nike AF1', 'AF-1uy7', 10099.00, 32, 100000, FALSE,
 '2026-08-27 10:16:39.613873', '2026-09-10 15:46:08.275383',
 '202249e5-827c-471d-af48-b6c6c78da763',
 '533a15dd-5c2d-4037-81f4-de00b87e68a2',
 'dae3c283-d7bc-4871-9d4d-dab61892619a'),

('Lip tint', 'tint28', 13378.00, 19, 237, FALSE,
 '2026-08-27 11:25:02.325454', '2026-09-10 15:47:16.901686',
 '2ecc8361-85df-4d55-b4e2-e71a69c14fb9',
 '6227c031-67ac-497d-9c8a-8caf5f6f6e5a',
 '59d630ec-3ef8-4ab3-a347-61a9207ce32a'),

('Skirt', 'sgh-0', 9009.00, 200, 10, FALSE,
 '2026-08-27 11:35:54.218813', '2026-09-10 15:49:03.056586',
 'e1b116a4-e272-4e22-9e8c-7b098d72b062',
 'ff848db9-35d3-4085-a45f-95aa4aee11bb',
 '5c49dc7f-dea3-4382-9b4f-06a0f2c825c2');

-- Revoked tokens
INSERT INTO public.revoked_tokens (id, jti, expires_at, token_type)
VALUES
('0023e4b0-dfd1-4e96-ae8d-7478a6852d6a',
 'e0566861-944f-4102-bd82-e3423b72c233',
 '2026-09-15 15:38:15+05:30',
 'access'),
('14dbb0e2-c1c7-42b5-b6d8-61aa39f3de89',
 '593d289c-4125-4407-9d27-691d575d0f4b',
 '2026-09-22 14:38:15+05:30',
 'refresh');

-- Foreign keys
ALTER TABLE public.products
    ADD CONSTRAINT products_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES public.categories(id);

ALTER TABLE public.products
    ADD CONSTRAINT products_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

-- Indexes
CREATE INDEX ix_categories_id ON public.categories USING btree (id);
CREATE INDEX ix_products_id ON public.products USING btree (id);
CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);
CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);
CREATE INDEX ix_users_id ON public.users USING btree (id);
CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);

-- Verify
SELECT 'categories' AS table_name, COUNT(*) AS row_count FROM public.categories
UNION ALL
SELECT 'suppliers', COUNT(*) FROM public.suppliers
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
UNION ALL
SELECT 'revoked_tokens', COUNT(*) FROM public.revoked_tokens;
