import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface Essay {
  id: string;
  originalText: string;
  polishedVersion: string;
  corrections: any[];
  score: {
    overall: number;
    grammar: number;
    vocabulary: number;
    structure: number;
    fluency: number;
    coherence: number;
  };
  status: 'draft' | 'processing' | 'completed' | 'failed';
  language: string;
}

export default function EssayResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEssay();
  }, [id]);

  // Separate effect for polling
  useEffect(() => {
    if (essay?.status === 'processing') {
      const interval = setInterval(() => {
        fetchEssay();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [essay?.status]);

  const fetchEssay = async () => {
    try {
      const response = await api.get(`/api/essays/${id}`);
      setEssay(response.data.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load essay');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading essay...</p>
        </div>
      </div>
    );
  }

  if (error || !essay) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Essay not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (essay.status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-900 mb-2">Processing your essay...</p>
          <p className="text-gray-600">This usually takes 10-30 seconds</p>
        </div>
      </div>
    );
  }

  if (essay.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to process essay. Please try again.</p>
          <button
            onClick={() => navigate('/editor')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Write New Essay
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold text-primary-600 hover:text-primary-700"
              >
                PAPERPAL
              </button>
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
          {/* Overall Score */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Essay Results</h2>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div
                  className={`text-6xl font-bold ${getScoreColor(
                    essay.score?.overall || 0
                  )} mb-2`}
                >
                  {essay.score?.overall || 0}
                </div>
                <p className="text-gray-600">Overall Score</p>
              </div>
            </div>
          </div>

          {/* Detailed Scores */}
          {essay.score && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(essay.score)
                  .filter(([key]) => key !== 'overall' && key !== 'timestamp')
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg ${getScoreBg(value as number)}`}
                    >
                      <div className={`text-2xl font-bold ${getScoreColor(value as number)}`}>
                        {value}
                      </div>
                      <div className="text-sm text-gray-700 capitalize">{key}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Original vs Corrected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Essay</h3>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{essay.originalText}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Corrected Essay</h3>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">
                  {essay.polishedVersion || 'No corrections needed!'}
                </p>
              </div>
            </div>
          </div>

          {/* Corrections */}
          {essay.corrections && essay.corrections.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Corrections ({essay.corrections.length})
              </h3>
              <div className="space-y-4">
                {essay.corrections.map((correction: any, index: number) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-semibold text-primary-600 uppercase">
                            {correction.type}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              correction.severity === 'error'
                                ? 'bg-red-100 text-red-800'
                                : correction.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {correction.severity}
                          </span>
                        </div>
                        <div className="text-sm mb-2">
                          <span className="line-through text-red-600">
                            {correction.originalText}
                          </span>
                          {' → '}
                          <span className="text-green-600">{correction.correctedText}</span>
                        </div>
                        <p className="text-sm text-gray-600">{correction.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/editor')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Write Another Essay
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
