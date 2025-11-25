export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface UserProgress {
  totalEssays: number;
  averageScore: number;
  weeklyImprovement: number;
  weaknesses: Array<{
    category: string;
    count: number;
  }>;
  rank: Rank;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface ProgressSnapshot {
  id: string;
  userId: string;
  totalEssays: number;
  averageScore: number;
  weeklyImprovement: number;
  weaknesses: Array<{
    category: string;
    count: number;
  }>;
  rank: Rank;
  snapshotDate: Date;
  createdAt: Date;
}

export interface ScoreTrend {
  date: Date;
  score: number;
  essayCount: number;
}
