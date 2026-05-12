import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-6">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{currentUser?.email || 'User'}</div>
          <div className="text-xs text-gray-500 capitalize">{userRole?.replace('_', ' ') || 'Loading role...'}</div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-[#DC2626] hover:text-red-800 font-medium transition-colors border border-[#DC2626] hover:bg-red-50 px-3 py-1.5 rounded-md"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
