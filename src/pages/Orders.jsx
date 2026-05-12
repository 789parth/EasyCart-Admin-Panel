import { useState, useEffect } from 'react';
import { rtdb } from '../firebase';
import { ref, get, update } from 'firebase/database';

const STATUS_FLOW = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed:        'bg-blue-100 text-blue-800 border-blue-200',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered:        'bg-green-100 text-green-800 border-green-200',
  cancelled:        'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABEL = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

function parseDate(raw) {
  if (!raw) return null;
  if (typeof raw === 'number') return new Date(raw);
  if (typeof raw === 'string' && raw.includes(',')) {
    const parts = raw.replace(',', '').split(' ').filter(Boolean);
    if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(raw) {
  const d = parseDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(rtdb, 'orders'));
      if (snap.exists()) {
        const data = [];
        snap.forEach(c => data.push({ id: c.key, ...c.val() }));
        // newest first
        data.sort((a, b) => {
          const da = parseDate(a.date || a.created_at || a.createdAt || a.timestamp);
          const db2 = parseDate(b.date || b.created_at || b.createdAt || b.timestamp);
          return (db2?.getTime() || 0) - (da?.getTime() || 0);
        });
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await update(ref(rtdb, 'orders/' + orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:    orders.length,
    pending:  orders.filter(o => (o.status || 'pending') === 'pending').length,
    confirmed:orders.filter(o => o.status === 'confirmed').length,
    out:      orders.filter(o => o.status === 'out_for_delivery').length,
    delivered:orders.filter(o => o.status === 'delivered').length,
    revenue:  orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (Number(o.total) || 0), 0),
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const visible = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      String(o.user_id || '').toLowerCase().includes(q) ||
      String(o.user_name || o.userName || '').toLowerCase().includes(q) ||
      String(o.phone || '').includes(q);
    const matchStatus = !filterStatus || (o.status || 'pending') === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getItems = (order) => {
    // items can be an object map or array
    if (!order.items) return [];
    if (Array.isArray(order.items)) return order.items;
    return Object.values(order.items);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage all customer orders.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Orders',    value: stats.total,     color: 'text-gray-800',   bg: 'bg-gray-50'   },
          { label: 'Pending',         value: stats.pending,   color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Confirmed',       value: stats.confirmed, color: 'text-blue-700',   bg: 'bg-blue-50'   },
          { label: 'Out for Delivery',value: stats.out,       color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Delivered',       value: stats.delivered, color: 'text-green-700',  bg: 'bg-green-50'  },
          { label: 'Delivered Revenue', value: `₹${stats.revenue.toFixed(2)}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-4 shadow-sm`}>
            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{loading ? '…' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Order ID, User ID or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white w-full sm:w-48"
        >
          <option value="">All Statuses</option>
          {STATUS_FLOW.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2563EB] rounded-full animate-spin mr-3" />
            Loading orders…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-sm font-medium">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map(order => {
                  const status   = order.status || 'pending';
                  const items    = getItems(order);
                  const isExpanded = expandedId === order.id;
                  const dateRaw  = order.date || order.created_at || order.createdAt || order.timestamp;
                  const customer = order.user_name || order.userName || order.user_id || '—';

                  return (
                    <>
                      <tr
                        key={order.id}
                        className={`transition-colors ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                      >
                        {/* Expand toggle */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            className="text-gray-400 hover:text-[#2563EB] transition-colors"
                            title={isExpanded ? 'Collapse' : 'View items'}
                          >
                            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>

                        {/* Order ID */}
                        <td className="px-4 py-4 font-mono text-xs text-gray-500 max-w-[140px] truncate">
                          {order.id}
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900 text-sm">{customer}</p>
                          {order.phone && <p className="text-xs text-gray-400 mt-0.5">{order.phone}</p>}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {fmtDate(dateRaw)}
                        </td>

                        {/* Items count */}
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {items.length > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {items.length} item{items.length !== 1 ? 's' : ''}
                            </span>
                          ) : '—'}
                        </td>

                        {/* Total */}
                        <td className="px-4 py-4 font-semibold text-gray-900">
                          ₹{Number(order.total || 0).toFixed(2)}
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                            {STATUS_LABEL[status] || status}
                          </span>
                        </td>

                        {/* Update status */}
                        <td className="px-4 py-4">
                          <select
                            value={status}
                            disabled={updatingId === order.id}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className="block w-44 border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] disabled:opacity-50"
                          >
                            {STATUS_FLOW.map(s => (
                              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                          {updatingId === order.id && (
                            <span className="text-xs text-gray-400 mt-1 block">Saving…</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded: items + address */}
                      {isExpanded && (
                        <tr key={order.id + '_exp'} className="bg-blue-50/30">
                          <td colSpan={8} className="px-8 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                              {/* Order Items */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Items</p>
                                {items.length === 0 ? (
                                  <p className="text-xs text-gray-400">No item details available.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {items.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3">
                                        {item.product_image || item.image ? (
                                          <img
                                            src={item.product_image || item.image}
                                            alt={item.product_name || item.name}
                                            className="w-10 h-10 rounded-md object-cover border border-gray-100 flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">{item.product_name || item.name || 'Product'}</p>
                                          <p className="text-xs text-gray-400">
                                            Qty: {item.quantity || item.qty || 1}
                                            {item.product_unit || item.unit ? ` · ${item.product_unit || item.unit}` : ''}
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                                          ₹{Number(item.product_price || item.price || 0).toFixed(2)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Delivery Info */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Delivery Details</p>
                                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
                                  {order.address || order.delivery_address ? (
                                    <div className="flex gap-2">
                                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span className="text-gray-700">{order.address || order.delivery_address}</span>
                                    </div>
                                  ) : null}
                                  {order.phone && (
                                    <div className="flex gap-2">
                                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      <span className="text-gray-700">{order.phone}</span>
                                    </div>
                                  )}
                                  {order.payment_method && (
                                    <div className="flex gap-2">
                                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                      </svg>
                                      <span className="text-gray-700 capitalize">{order.payment_method}</span>
                                    </div>
                                  )}
                                  {!order.address && !order.delivery_address && !order.phone && !order.payment_method && (
                                    <p className="text-gray-400 text-xs">No delivery details stored.</p>
                                  )}
                                  <div className="pt-2 border-t border-gray-100 mt-2">
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Order Total</span>
                                      <span className="font-semibold text-gray-800">₹{Number(order.total || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && visible.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Showing {visible.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
