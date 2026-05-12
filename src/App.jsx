import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admins from './pages/Admins';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import BulkImport from './pages/BulkImport';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes inside DashboardLayout */}
        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/bulk-import" element={<BulkImport />} />
          
          <Route path="/admins" element={
            <RoleRoute allowedRoles={['super_admin']}>
              <Admins />
            </RoleRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
