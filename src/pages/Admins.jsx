import { useState, useEffect } from 'react';
import { rtdb, secondaryAuth } from '../firebase';
import { ref, get, set, update, remove, serverTimestamp } from 'firebase/database';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const snapshot = await get(ref(rtdb, 'admins'));
      if (snapshot.exists()) {
        const adminData = [];
        snapshot.forEach((child) => {
          adminData.push({ id: child.key, ...child.val() });
        });
        setAdmins(adminData);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (editingId) {
        await update(ref(rtdb, 'admins/' + editingId), { name, role });
      } else {
        if (!password) { setFormError('Password is required'); setFormLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await set(ref(rtdb, 'admins/' + cred.user.uid), {
          name, email, role,
          isActive: true,
          created_at: serverTimestamp()
        });
        await signOut(secondaryAuth);
      }
      resetForm();
      fetchAdmins();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin.id);
    setName(admin.name || '');
    setEmail(admin.email || '');
    setRole(admin.role || 'admin');
    setPassword('');
    setShowForm(true);
  };

  const handleToggleActive = async (admin) => {
    try {
      await update(ref(rtdb, 'admins/' + admin.id), { isActive: !(admin.isActive !== false) });
      fetchAdmins();
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently remove this admin?")) {
      try {
        await remove(ref(rtdb, 'admins/' + id));
        fetchAdmins();
      } catch (error) {
        alert("Failed to remove admin.");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false); setEditingId(null); setName('');
    setEmail(''); setPassword(''); setRole('admin'); setFormError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all admins who have access to the store dashboard.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          Add New Admin
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4 text-[#111827]">{editingId ? 'Edit Admin' : 'Add New Admin'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="text-[#DC2626] bg-red-50 p-2 rounded text-sm">{formError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required disabled={!!editingId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] disabled:bg-gray-100 disabled:text-gray-500"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t mt-4 border-gray-100">
              <button type="button" onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={formLoading}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                {formLoading ? 'Saving...' : 'Save Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">No admins found.</td></tr>
            ) : (
              admins.map((admin) => {
                const isActive = admin.isActive !== false;
                return (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {admin.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        admin.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Clicking toggles Active ↔ Inactive */}
                      <button
                        onClick={() => handleToggleActive(admin)}
                        title="Click to toggle status"
                        className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full transition-all ${
                          isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => handleEdit(admin)} className="text-[#2563EB] hover:text-blue-900 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(admin.id)} className="text-[#DC2626] hover:text-red-900 transition-colors">Remove</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
