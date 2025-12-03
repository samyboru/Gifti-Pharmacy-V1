-- Command 1: Add the column to store the reset token
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255);

-- Command 2: Add the column to store the token's expiration time
INSERT INTO users (username, email, phone, password_hash, role)
VALUES (
    'cashier', 
    'cashier@gopharma.com', 
    '555-0199', 
    '$2b$10$5MozCIhCmj29aVyq.Ggr9O97eFFF5DdMrnN6.yT9cCezF.gu5sV2.', 
    'cashier'
);