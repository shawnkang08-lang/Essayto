import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function EditorPage() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'id' | 'zh' | 'en'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (text.trim().length < 10) {
      setError('Essay must be at least 10 characters long');
      return;
    }

    if (text.length > 10000) {
      setError('Essay cannot exceed 10,000 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save draft first
      const draftResponse = await api.post('/api/essays/draft', {
        text,
        language,
      });

      const essayId = draftResponse.data.data.id;

      // Submit for correction
      await api.post(`/api/essays/${essayId}/submit`);

      // Navigate to results page
      navigate(`/essay/${essayId}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit essay');
    } finally {
      setLoading(false);
    }
  };

  const charCount = text.length;
  const charLimit = 10000;
  const charPercentage = (charCount / charLimit) * 100;

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

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Write Your Essay</h2>

            {/* Language Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-md ${
                    language === 'en'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-4 py-2 rounded-md ${
                    language === 'id'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Indonesian
                </button>
                <button
                  onClick={() => setLanguage('zh')}
                  className={`px-4 py-2 rounded-md ${
                    language === 'zh'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Chinese
                </button>
              </div>
            </div>

            {/* Text Editor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Essay
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder="Start writing your essay here..."
              />
            </div>

            {/* Character Count */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Character Count</span>
                <span>
                  {charCount} / {charLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    charPercentage > 90
                      ? 'bg-red-500'
                      : charPercentage > 70
                      ? 'bg-yellow-500'
                      : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || charCount < 10}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit for Correction'}
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your essay will be analyzed for grammar, vocabulary,
                structure, and style. You'll receive a detailed score and corrections.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
