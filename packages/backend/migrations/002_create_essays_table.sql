-- Create essays table
CREATE TABLE IF NOT EXISTS essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  language VARCHAR(2) NOT NULL CHECK (language IN ('id', 'zh', 'en')),
  corrections JSONB DEFAULT '[]',
  polished_version TEXT,
  score JSONB,
  topic JSONB,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT text_length CHECK (char_length(original_text) <= 10000)
);

-- Create indexes
CREATE INDEX idx_essays_user_id ON essays(user_id);
CREATE INDEX idx_essays_status ON essays(status);
CREATE INDEX idx_essays_created_at ON essays(created_at DESC);
CREATE INDEX idx_essays_language ON essays(language);
CREATE INDEX idx_essays_user_created ON essays(user_id, created_at DESC);

-- Add comments
COMMENT ON TABLE essays IS 'User submitted essays with corrections and scores';
COMMENT ON COLUMN essays.id IS 'Unique essay identifier';
COMMENT ON COLUMN essays.user_id IS 'Reference to user who submitted the essay';
COMMENT ON COLUMN essays.original_text IS 'Original essay text (max 10,000 characters)';
COMMENT ON COLUMN essays.language IS 'Essay language (id/zh/en)';
COMMENT ON COLUMN essays.corrections IS 'Array of correction objects as JSON';
COMMENT ON COLUMN essays.polished_version IS 'Final corrected version of the essay';
COMMENT ON COLUMN essays.score IS 'Score breakdown as JSON (overall, grammar, vocabulary, etc.)';
COMMENT ON COLUMN essays.topic IS 'Associated topic information as JSON';
COMMENT ON COLUMN essays.status IS 'Processing status (draft/processing/completed/failed)';
