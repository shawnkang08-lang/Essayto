import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary-600">PAPERPAL</h1>
              <div className="flex space-x-4">
                <button className="text-primary-600 font-medium">Dashboard</button>
                <button
                  onClick={() => navigate('/essays')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  My Essays
                </button>
                <button
                  onClick={() => navigate('/progress')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Progress
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}!</span>
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
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to PAPERPAL! 🎉
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Your AI Essay Coach & Corrector
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-semibold mb-2">Write Essays</h3>
                <p className="text-gray-600 text-sm">
                  Get instant AI-powered corrections and feedback
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
                <p className="text-gray-600 text-sm">
                  Monitor your improvement with detailed analytics
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-lg font-semibold mb-2">Multi-Language</h3>
                <p className="text-gray-600 text-sm">
                  Support for Indonesian, Chinese, and English
                </p>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={() => navigate('/editor')}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-lg"
              >
                Start Writing
              </button>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> AI correction features require an OpenAI API key. 
                Add your key in the backend .env file to enable AI-powered corrections.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
