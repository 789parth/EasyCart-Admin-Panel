import { useState, useEffect } from 'react';
import { rtdb } from '../firebase';
import { ref, get, push, set, update, remove } from 'firebase/database';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [trending, setTrending] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsSnap, categoriesSnap] = await Promise.all([
        get(ref(rtdb, 'products')),
        get(ref(rtdb, 'category'))
      ]);
      
      const catData = [];
      if (categoriesSnap.exists()) {
        categoriesSnap.forEach(child => {
          catData.push({ id: child.key, ...child.val() });
        });
      }
      setCategories(catData);

      const prodData = [];
      if (productsSnap.exists()) {
        productsSnap.forEach(child => {
          prodData.push({ id: child.key, ...child.val() });
        });
      }
      setProducts(prodData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.category_title : 'Unknown Category';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!categoryId) {
      setFormError('Please select a category for this product.');
      return;
    }

    setFormLoading(true);

    try {
      const productData = {
        product_name: name,
        product_description: description,
        product_price: Number(price),
        product_quantity: Number(stock),
        product_unit: unit,
        product_image: image || '',
        category_id: categoryId,
        category_name: getCategoryName(categoryId),
        trending_item: trending,
      };

      if (editingId) {
        // Update existing product
        await update(ref(rtdb, 'products/' + editingId), productData);
      } else {
        // Create new product
        const newProdRef = push(ref(rtdb, 'products'));
        await set(newProdRef, {
            ...productData,
            product_id: newProdRef.key
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      setFormError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.product_name || '');
    setPrice(product.product_price || '');
    setStock(product.product_quantity || '');
    setImage(product.product_image || '');
    setCategoryId(product.category_id || '');
    setDescription(product.product_description || '');
    setUnit(product.product_unit || '');
    setTrending(product.trending_item || false);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await remove(ref(rtdb, 'products/' + id));
        fetchData();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product.");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setPrice('');
    setStock('');
    setImage('');
    setCategoryId('');
    setDescription('');
    setUnit('');
    setTrending(false);
    setFormError('');
  };

  const filteredProducts = filterCategory 
    ? products.filter(p => p.category_id === filterCategory)
    : products;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4 text-[#111827]">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="text-[#DC2626] bg-red-50 p-2 rounded text-sm">{formError}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.category_title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit (e.g. 1 kg, 500g)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  placeholder="e.g. 1 kg"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                  placeholder="https://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] resize-none"
                  placeholder="Short product description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="trending"
                  type="checkbox"
                  className="h-4 w-4 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                  checked={trending}
                  onChange={(e) => setTrending(e.target.checked)}
                />
                <label htmlFor="trending" className="text-sm font-medium text-gray-700">Mark as Trending Item</label>
              </div>
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
                {formLoading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
            <select
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] bg-white w-48"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.category_title}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredProducts.length} product(s)
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">No products found for this category.</td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center space-x-3">
                    {product.product_image ? (
                      <img src={product.product_image} alt={product.product_name} className="h-10 w-10 rounded-md object-cover border border-gray-200 shadow-sm" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <span>{product.product_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {getCategoryName(product.category_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(product.product_price).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                      product.product_quantity > 10 ? 'bg-green-100 text-green-800' : product.product_quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-[#DC2626]'
                    }`}>
                      {product.product_quantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(product)} className="text-[#2563EB] hover:text-blue-900 mr-4 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-[#DC2626] hover:text-red-900 transition-colors">Delete</button>
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
