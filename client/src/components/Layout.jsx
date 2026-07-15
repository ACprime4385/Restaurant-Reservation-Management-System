import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2 hover:opacity-80 transition">
              <span className="text-2xl">🍽️</span>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">
                Restaurant Reservations
              </span>
            </Link>

            {/* Navigation and User */}
            {user && (
              <div className="flex items-center gap-3 sm:gap-6">
                {/* Admin Navigation */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/"
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        !isAdminPage
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin"
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        isAdminPage
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Admin Panel
                    </Link>
                  </div>
                )}

                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <span className="hidden sm:inline text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {user.role}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Restaurant Reservation System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
