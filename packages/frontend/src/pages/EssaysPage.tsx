import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface Essay {
  id: string;
  originalText: string;
  language: string;
  score: { overall: number } | null;
  status: string;
  createdAt: string;
}

export default function EssaysPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing'>('all');

  useEffect(() => {
    fetchEssays();
  }, [filter]);

  const fetchEssays = async () => {
    try {
      const params: any = { page: 1, limit: 50 };
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/api/essays', { params });
      setEssays(response.data.data);
    } catch (error) {
      console.error('Failed to fetch essays:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEssay = async (id: string) => {
    if (!confirm('Are you sure you want to delete this essay?')) return;

    try {
      await api.delete(`/api/essays/${id}`);
      setEssays(essays.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Failed to delete essay:', error);
      alert('Failed to delete essay');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading essays...</div>
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
                PAPERPAL
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </button>
                <button className="text-primary-600 font-medium">My Essays</button>
                <button
                  onClick={() => navigate('/progress')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Progress
                </button>
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Essays</h1>
            <button
              onClick={() => navigate('/editor')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + New Essay
            </button>
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'processing'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Processing
            </button>
          </div>

          {/* Essays List */}
          {essays.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Essays Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? "You haven't written any essays yet. Start writing to see them here!"
                  : `No ${filter} essays found. Try a different filter.`}
              </p>
              <button
                onClick={() => navigate('/editor')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Write Your First Essay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {essays.map((essay) => (
                <div
                  key={essay.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            essay.status
                          )}`}
                        >
                          {essay.status}
                        </span>
                        <span className="text-sm text-gray-500 uppercase">{essay.language}</span>
                        {essay.score && (
                          <span className={`text-lg font-bold ${getScoreColor(essay.score.overall)}`}>
                            Score: {essay.score.overall}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 line-clamp-2 mb-2">
                        {essay.originalText.substring(0, 200)}
                        {essay.originalText.length > 200 ? '...' : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(essay.createdAt).toLocaleDateString()} at{' '}
                        {new Date(essay.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {essay.status === 'completed' && (
                        <button
                          onClick={() => navigate(`/essay/${essay.id}`)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                        >
                          View Results
                        </button>
                      )}
                      {essay.status === 'processing' && (
                        <button
                          onClick={() => navigate(`/essay/${essay.id}`)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          Check Status
                        </button>
                      )}
                      <button
                        onClick={() => deleteEssay(essay.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                      >
                        Delete
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
