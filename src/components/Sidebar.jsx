import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { userRole } = useAuth();
  const location = useLocation();

  // Super admin only manages admins; regular admin manages the store
  const navigation = userRole === 'super_admin'
    ? [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Admins',    href: '/admins' },
      ]
    : [
        { name: 'Dashboard',   href: '/dashboard' },
        { name: 'Categories',  href: '/categories' },
        { name: 'Products',    href: '/products' },
        { name: 'Bulk Import', href: '/bulk-import' },
        { name: 'Customers',   href: '/customers' },
        { name: 'Orders',      href: '/orders' },
      ];

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-bold text-[#2563EB]">EasyBasket</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-[#2563EB]'
                    : 'text-gray-700 hover:bg-gray-50'
                } group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
