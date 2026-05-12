import { useState, useEffect } from 'react';
import { rtdb } from '../firebase';
import { ref, get, push, set, update, remove } from 'firebase/database';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesRef = ref(rtdb, 'category');
      const snapshot = await get(categoriesRef);
      
      if (snapshot.exists()) {
        const categoryData = [];
        snapshot.forEach((childSnapshot) => {
          categoryData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        setCategories(categoryData);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
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
        // Update existing category
        await update(ref(rtdb, 'category/' + editingId), { 
            category_title: name 
        });
      } else {
        // Create new category
        const newCatRef = push(ref(rtdb, 'category'));
        await set(newCatRef, { 
            category_id: newCatRef.key,
            category_title: name,
            category_image: '',
            store_id: 's1'
        });
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      setFormError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.category_title || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? Products using this category might lose their association.")) {
      try {
        await remove(ref(rtdb, 'category/' + id));
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category.");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setFormError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
          <h2 className="text-lg font-medium mb-4 text-[#111827]">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="text-[#DC2626] bg-red-50 p-2 rounded text-sm">{formError}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Electronics, Clothing"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t mt-4 border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {formLoading ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-3xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-500">No categories found. Click "Add Category" to create one.</td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.category_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(category)} className="text-[#2563EB] hover:text-blue-900 mr-4 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(category.id)} className="text-[#DC2626] hover:text-red-900 transition-colors">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
