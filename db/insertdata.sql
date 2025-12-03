-- =ʻ===============================================================
--         GIFTY PHARMACY - EXPANDED SAMPLE DATA SCRIPT
-- =================================================================
-- This script provides a richer dataset with at least three entries
-- for every major table, perfect for thorough testing.

-- STEP 1: Insert Core Entities (Users, Suppliers, Doctors, Products)

-- Passwords for all users are 'password123'
INSERT INTO users (username, email, phone, password_hash, role, status) VALUES
('admin', 'admin@giftypharmacy.com', '111-222-3333', '$2a$10$N9qo8uLOickgx2ZMRZoMye5v1zC5B6K2jOTuMb4h.H5.RT.OKdGas', ARRAY['admin'], 'active'),
('robel', 'robel@giftypharmacy.com', '444-555-6666', '$2a$10$N9qo8uLOickgx2ZMRZoMye5v1zC5B6K2jOTuMb4h.H5.RT.OKdGas', ARRAY['pharmacist', 'cashier'], 'active'),
('aisha', 'aisha@giftypharmacy.com', '777-888-9999', '$2a$10$N9qo8uLOickgx2ZMRZoMye5v1zC5B6K2jOTuMb4h.H5.RT.OKdGas', ARRAY['cashier'], 'active'),
('samuel', 'samuel@giftypharmacy.com', '123-123-1234', '$2a$10$N9qo8uLOickgx2ZMRZoMye5v1zC5B6K2jOTuMb4h.H5.RT.OKdGas', ARRAY['pharmacist'], 'active');

INSERT INTO suppliers (name, contact_person, email, phone) VALUES
('Global Pharma Inc.', 'John Smith', 'contact@globalpharma.com', '123-456-7890'),
('MedSupply Co.', 'Jane Doe', 'sales@medsupply.co', '098-765-4321'),
('Ethio-Generics PLC', 'Fatuma Ahmed', 'info@ethiogenerics.com', '251-911-123456');

INSERT INTO doctors (name, license_number, specialty) VALUES
('Dr. Abel Tesfaye', 'MD-12345', 'Cardiology'),
('Dr. Helen Meles', 'MD-67890', 'Pediatrics'),
('Dr. Keneni Lemma', 'MD-55555', 'General Practice');

INSERT INTO products (name, brand, category, description, requires_prescription) VALUES
('Paracetamol 500mg', 'Generic', 'Painkiller', 'For relief of mild to moderate pain and fever.', FALSE),
('Amoxicillin 250mg', 'Amoxil', 'Antibiotic', 'Treats a wide variety of bacterial infections.', TRUE),
('Vitamin C 1000mg', 'VitaBoost', 'Supplement', 'A high-dose Vitamin C supplement.', FALSE),
('Antacid Tablets', 'Tummy-Eze', 'Antacid', 'Chewable tablets for heartburn and indigestion relief.', FALSE),
('Ibuprofen 200mg', 'Generic', 'Painkiller', 'For relief of pain, fever, and inflammation.', FALSE),
('Band-Aids (Assorted)', 'FirstAid Co.', 'FirstAid', 'Box of 50 assorted sterile bandages.', FALSE),
('Cough Syrup DM', 'Cof-Ex', 'ColdAndFlu', 'Controls cough, loosens chest congestion.', FALSE),
('Loratadine 10mg', 'Clarityn', 'Allergy', 'Provides 24-hour relief from allergy symptoms.', FALSE);


-- STEP 2: Insert Inventory Data (At least 3 batches for multiple products)

INSERT INTO inventory_items (product_id, quantity_of_packages, purchase_price, selling_price, batch_number, expiry_date) VALUES
-- Paracetamol (ID: 1)
(1, 50, 80.00, 120.00, 'P-001', '2027-12-31'),
(1, 5, 82.50, 125.00, 'P-002', '2026-06-30'),
(1, 100, 78.00, 120.00, 'P-003', '2028-05-31'),

-- Amoxicillin (ID: 2)
(2, 20, 250.00, 400.00, 'AMX-EXP', '2024-10-01'), -- Expired
(2, 30, 260.00, 410.00, 'AMX-001', '2026-08-31'),
(2, 0, 260.00, 410.00, 'AMX-002', '2027-02-28'), -- Out of stock

-- Vitamin C (ID: 3)
(3, 15, 100.00, 180.00, 'VC-SOON', CURRENT_DATE + INTERVAL '15 days'), -- Expiring Soon
(3, 100, 95.00, 180.00, 'VC-001', '2026-10-31'),
(3, 8, 105.00, 190.00, 'VC-002', '2027-01-31'), -- Low stock

-- Ibuprofen (ID: 5)
(5, 40, 90.00, 150.00, 'IBU-001', '2028-01-31'),
(5, 30, 90.00, 150.00, 'IBU-002', '2028-03-31'),
(5, 25, 95.00, 160.00, 'IBU-003', '2029-01-31'),

-- Loratadine (ID: 8)
(8, 50, 120.00, 220.00, 'LOR-001', '2027-07-31'),
(8, 50, 120.00, 220.00, 'LOR-002', '2028-07-31'),
(8, 10, 125.00, 230.00, 'LOR-003', '2029-07-31'); -- Low Stock


-- STEP 3: Insert Transactional Data (Purchase Orders, Sales)

INSERT INTO purchase_orders (supplier_id, created_by, status, total_value) VALUES
(1, 1, 'Received', 9250.00), -- From Global Pharma
(2, 1, 'Pending', 11000.00), -- From MedSupply Co. (Changed created_by to 1)
(3, 1, 'Pending', 28500.00); -- From Ethio-Generics

INSERT INTO purchase_order_items (po_id, product_id, quantity, price_per_item) VALUES
(1, 1, 50, 80.00),
(1, 3, 15, 100.00),
(2, 7, 100, 110.00),
(3, 5, 300, 95.00);

-- Sales
INSERT INTO sales (user_id, total_amount, tax_amount, sale_date) VALUES
(2, 275.00, 25.00, NOW() - INTERVAL '1 day'),
(3, 618.21, 56.20, NOW() - INTERVAL '2 days'),
(2, 134.20, 12.20, NOW());

INSERT INTO sale_items (sale_id, inventory_item_id, product_name, quantity_sold, price_at_time_of_sale) VALUES
-- Sale #1
(1, 1, 'Paracetamol 500mg', 1, 120.00),
(1, 9, 'Vitamin C 1000mg', 1, 155.00), -- Assuming ID 9 is a Vitamin C batch
-- Sale #2
(2, 11, 'Ibuprofen 200mg', 3, 150.00),
(2, 8, 'Vitamin C 1000mg', 1, 180.00),
-- Sale #3
(3, 13, 'Loratadine 10mg', 1, 220.00);

-- Activity Log
INSERT INTO activity_log (user_id, username, action, details) VALUES
(1, 'admin', 'user_created', '{"key":"user_created", "username":"robel"}'),
(2, 'robel', 'user_login', '{"key":"user_login", "username":"robel"}'),
(3, 'aisha', 'sale_completed', '{"key":"sale_completed", "id": 2, "total": "618.21"}');

-- Notifications
INSERT INTO notifications (user_id, type, message, link) VALUES
(1, 'expiring_soon', '{"key":"notifications.messages.expiring_soon","name":"Vitamin C 1000mg","batch":"VC-SOON","days":15}', '/products/3?batch=VC-SOON'),
(4, 'expired', '{"key":"notifications.messages.expired","name":"Amoxicillin 250mg","batch":"AMX-EXP"}', '/products/2?batch=AMX-EXP'),
(1, 'low_stock', '{"key":"notifications.messages.low_stock","name":"Paracetamol 500mg","quantity":5}', '/inventory?status=low_stock&productId=1');

-- =================================================================
--              END OF SAMPLE DATA
-- =================================================================