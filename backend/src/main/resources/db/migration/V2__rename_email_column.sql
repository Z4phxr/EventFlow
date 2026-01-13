-- Rename encrypted_email to email and change type to VARCHAR
ALTER TABLE users RENAME COLUMN encrypted_email TO email;
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(100);