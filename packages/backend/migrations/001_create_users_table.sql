-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  preferred_language VARCHAR(2) DEFAULT 'en' CHECK (preferred_language IN ('id', 'zh', 'en')),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  settings JSONB DEFAULT '{"uiLanguage": "en", "emailNotifications": true, "theme": "light"}',
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Add comments
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON COLUMN users.id IS 'Unique user identifier';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.preferred_language IS 'User preferred language for content (id/zh/en)';
COMMENT ON COLUMN users.settings IS 'User preferences and settings as JSON';
