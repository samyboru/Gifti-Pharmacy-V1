-- ==================================================
-- 1. DROP EXISTING TABLES (Clean Slate)
-- We use CASCADE to automatically handle dependencies
-- ==================================================
DROP TABLE IF EXISTS po_history CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS pending_sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS pending_sales CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==================================================
-- 2. RE-CREATE TABLES (With All New Features)
-- ==================================================

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    role TEXT[] NOT NULL, -- e.g. '{admin, pharmacist}'
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SUPPLIERS
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    requires_prescription BOOLEAN DEFAULT FALSE,
    min_stock_level INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INVENTORY ITEMS (Includes the Unique Batch Fix)
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    supplier_id INT REFERENCES suppliers(id),
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_of_packages INT DEFAULT 0,
    purchase_price DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- CRITICAL: This prevents duplicate batches for the same product
    CONSTRAINT unique_product_batch UNIQUE (product_id, batch_number)
);

-- PURCHASE ORDERS (Includes Audit Trail & Timestamps)
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(id),
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Received, Cancelled
    
    -- Audit Trail
    created_by INT REFERENCES users(id),
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    received_by INT REFERENCES users(id),
    received_at TIMESTAMP WITH TIME ZONE, -- Updated when status -> Received
    
    canceled_by INT REFERENCES users(id),
    canceled_at TIMESTAMP WITH TIME ZONE, -- Updated when status -> Cancelled
    
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE   -- Updated on Edit
);

-- PURCHASE ORDER ITEMS
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    price_per_item DECIMAL(12, 2) NOT NULL
);

-- PO HISTORY (The New Table for "Last 5 Actions")
CREATE TABLE po_history (
    id SERIAL PRIMARY KEY,
    po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'Created', 'Edited', 'Cancelled', 'Received'
    changed_by INT REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SALES & ACTIVITY LOGS (Standard)
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
    inventory_item_id INT REFERENCES inventory_items(id),
    quantity INT NOT NULL,
    price_at_sale DECIMAL(12, 2) NOT NULL
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    username VARCHAR(50),
    action VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- 3. SEED INITIAL ADMIN USER
-- Password is 'password123' (hashed)
-- ==================================================
INSERT INTO users (username, password_hash, role, status)
VALUES ('admin', '$2b$10$YourHashedPasswordHere', '{admin}', 'active');
-- Note: You should use your real bcrypt hash here, or register a new user via the app if you allow public registration.






-- 1. INVENTORY ITEMS (With Unique Batch Logic)
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    supplier_id INT REFERENCES suppliers(id),
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_of_packages INT DEFAULT 0,
    purchase_price DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_batch UNIQUE (product_id, batch_number)
);

-- 2. PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(id),
    status VARCHAR(20) DEFAULT 'Pending',
    created_by INT REFERENCES users(id),
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by INT REFERENCES users(id),
    received_at TIMESTAMP WITH TIME ZONE,
    canceled_by INT REFERENCES users(id),
    canceled_at TIMESTAMP WITH TIME ZONE,
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. PURCHASE ORDER ITEMS
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    price_per_item DECIMAL(12, 2) NOT NULL
);

-- 4. PO HISTORY
CREATE TABLE IF NOT EXISTS po_history (
    id SERIAL PRIMARY KEY,
    po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    changed_by INT REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SALES
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
    inventory_item_id INT REFERENCES inventory_items(id),
    quantity INT NOT NULL,
    price_at_sale DECIMAL(12, 2) NOT NULL
);

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    username VARCHAR(50),
    action VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;


CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- Optional (NULL allowed for system alerts)
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'expired', 'out_of_stock'
    message TEXT NOT NULL,     -- JSON string or text
    link TEXT,                 -- The smart link for clicking
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE if exists notifications;







