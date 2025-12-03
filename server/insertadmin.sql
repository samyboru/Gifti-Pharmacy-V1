INSERT INTO users (username, email, phone, password_hash, role)
VALUES (
    'admin', 
    'admin@gopharma.com', 
    '123-456-7890', 
    '$2b$10$jRuiV0ywyXZ2Vg8DSwmP1O2HN.tTl3oe5ea.dorth9Eokb2/dasbK', -- Your unique hash will be here
    'admin'
);