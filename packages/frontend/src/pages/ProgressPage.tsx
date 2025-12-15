import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface Progress {
  totalEssays: number;
  averageScore: number;
  weeklyImprovement: number;
  weaknesses: Array<{ category: string; count: number }>;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

export default function ProgressPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get('/api/progress');
      setProgress(response.data.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    const colors = {
      bronze: 'text-orange-700 bg-orange-100',
      silver: 'text-gray-700 bg-gray-200',
      gold: 'text-yellow-700 bg-yellow-100',
      platinum: 'text-blue-700 bg-blue-100',
      diamond: 'text-purple-700 bg-purple-100',
    };
    return colors[rank as keyof typeof colors] || colors.bronze;
  };

  const getRankEmoji = (rank: string) => {
    const emojis = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
      diamond: '💠',
    };
    return emojis[rank as keyof typeof emojis] || '🥉';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold text-primary-600 hover:text-primary-700"
              >
                ESSAYTO
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/essays')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  My Essays
                </button>
                <button className="text-primary-600 font-medium">Progress</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.username}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Progress</h1>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {progress?.totalEssays || 0}
              </div>
              <div className="text-sm text-gray-600">Total Essays</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {progress?.averageScore?.toFixed(1) || 0}
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {progress?.weeklyImprovement >= 0 ? '+' : ''}
                {progress?.weeklyImprovement?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-600">Weekly Improvement</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className={`text-3xl font-bold mb-2 ${getRankColor(progress?.rank || 'bronze')}`}>
                {getRankEmoji(progress?.rank || 'bronze')} {progress?.rank?.toUpperCase() || 'BRONZE'}
              </div>
              <div className="text-sm text-gray-600">Current Rank</div>
            </div>
          </div>

          {/* Weaknesses */}
          {progress?.weaknesses && progress.weaknesses.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas to Improve</h2>
              <div className="space-y-3">
                {progress.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold">
                        {index + 1}
                      </div>
                      <span className="text-gray-900 capitalize">{weakness.category}</span>
                    </div>
                    <span className="text-gray-600">{weakness.count} errors</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {progress?.achievements && progress.achievements.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Achievements ({progress.achievements.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {progress.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors"
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <div className="font-semibold text-gray-900 mb-1">{achievement.name}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {progress?.totalEssays === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Essays Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start writing essays to track your progress and see your improvement over time!
              </p>
              <button
                onClick={() => navigate('/editor')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Write Your First Essay
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
