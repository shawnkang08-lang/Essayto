-- Create progress_snapshots table
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_essays INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(5,2),
  weekly_improvement DECIMAL(5,2),
  weaknesses JSONB DEFAULT '[]',
  rank VARCHAR(20) CHECK (rank IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Create indexes
CREATE INDEX idx_progress_user_date ON progress_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_progress_user_id ON progress_snapshots(user_id);
CREATE INDEX idx_progress_snapshot_date ON progress_snapshots(snapshot_date DESC);

-- Add comments
COMMENT ON TABLE progress_snapshots IS 'Daily snapshots of user progress and statistics';
COMMENT ON COLUMN progress_snapshots.id IS 'Unique snapshot identifier';
COMMENT ON COLUMN progress_snapshots.user_id IS 'Reference to user';
COMMENT ON COLUMN progress_snapshots.total_essays IS 'Total number of essays completed';
COMMENT ON COLUMN progress_snapshots.average_score IS 'Average score across all essays';
COMMENT ON COLUMN progress_snapshots.weekly_improvement IS 'Percentage improvement over past week';
COMMENT ON COLUMN progress_snapshots.weaknesses IS 'Array of weakness categories with counts';
COMMENT ON COLUMN progress_snapshots.rank IS 'User proficiency rank (bronze/silver/gold/platinum/diamond)';
COMMENT ON COLUMN progress_snapshots.snapshot_date IS 'Date of this snapshot';
