-- Add email to users (nullable, for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Discount codes table
CREATE TABLE discount_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  assigned_username VARCHAR(255),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
