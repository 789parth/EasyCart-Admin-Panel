import { useState, useEffect, useMemo } from "react";
import { rtdb } from "../firebase";
import { ref, get } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDate(raw) {
  if (!raw) return null;
  if (typeof raw === "number") return new Date(raw);
  // "MM DD, YYYY"
  if (typeof raw === "string" && raw.includes(",")) {
    const cleaned = raw.replace(",", "").split(" ").filter(Boolean);
    if (cleaned.length === 3) {
      const [mm, dd, yyyy] = cleaned;
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function bucketKey(date, period) {
  if (period === "day") return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  if (period === "month")
    return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return String(date.getFullYear());
}

export default function Dashboard() {
  const { userRole } = useAuth();

  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    admins: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState([]); // [{total, date, status, ...}]
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    if (!userRole) return;

    const fetchAll = async () => {
      try {
        if (userRole === "super_admin") {
          const admSnap = await get(ref(rtdb, "admins"));
          setStats((s) => ({ ...s, admins: admSnap.size || 0 }));
        } else {
          const [prodSnap, ordSnap, custSnap] = await Promise.all([
            get(ref(rtdb, "products")),
            get(ref(rtdb, "orders")),
            get(ref(rtdb, "users")),
          ]);

          const orders = [];
          let revenue = 0;

          if (ordSnap.exists()) {
            ordSnap.forEach((child) => {
              const o = { id: child.key, ...child.val() };
              orders.push(o);
              // revenue = sum of each order's `total` field
              revenue += Number(o.total) || 0;
            });
          }

          setRawOrders(orders);
          setStats({
            products: prodSnap.size || 0,
            orders: orders.length,
            customers: custSnap.size || 0,
            revenue,
            admins: 0,
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userRole]);

  const chartData = useMemo(() => {
    if (!rawOrders.length) return [];

    const buckets = {};
    rawOrders.forEach((order) => {
      // try common date field names
      const dateRaw =
        order.date || order.created_at || order.createdAt || order.timestamp;
      const date = parseDate(dateRaw);
      if (!date) return;

      const key = bucketKey(date, period);
      if (!buckets[key])
        buckets[key] = {
          label: key,
          revenue: 0,
          orders: 0,
          _ts: date.getTime(),
        };
      buckets[key].revenue += Number(order.total) || 0;
      buckets[key].orders += 1;
    });

    return Object.values(buckets).sort((a, b) => a._ts - b._ts);
  }, [rawOrders, period]);

  const hasChart = !loading && chartData.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* ── SUPER ADMIN ── */}
      {userRole === "super_admin" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={<AdminIcon />}
            color="bg-purple-50 text-purple-600"
            label="Total Admins"
            value={loading ? "..." : stats.admins}
          />
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={<ProductIcon />}
              color="bg-blue-50 text-blue-600"
              label="Total Products"
              value={loading ? "..." : stats.products}
            />
            <StatCard
              icon={<OrderIcon />}
              color="bg-green-50 text-green-600"
              label="Total Orders"
              value={loading ? "..." : stats.orders}
            />
            <StatCard
              icon={<CustomerIcon />}
              color="bg-indigo-50 text-indigo-600"
              label="Total Customers"
              value={loading ? "..." : stats.customers}
            />
            <StatCard
              icon={<RevenueIcon />}
              color="bg-amber-50 text-amber-600"
              label="Total Revenue"
              value={loading ? "..." : `$${stats.revenue.toFixed(2)}`}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Sales Analytics
                </h2>
                <p className="text-sm text-gray-500">
                  Revenue &amp; order count over time
                </p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1 self-start sm:self-auto">
                {["day", "month", "year"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                      period === p
                        ? "bg-white shadow text-[#2563EB]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {p === "day"
                      ? "Daily"
                      : p === "month"
                        ? "Monthly"
                        : "Yearly"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Loading chart…
              </div>
            ) : !hasChart ? (
              <EmptyChart
                message="No order data available yet"
                sub="Charts will appear as orders come in"
              />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#2563EB"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#10B981"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                    }}
                    formatter={(value, name) => [
                      name === "revenue"
                        ? `$${Number(value).toFixed(2)}`
                        : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Legend
                    formatter={(v) => (v === "revenue" ? "Revenue" : "Orders")}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#ordGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {hasChart && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, color, label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center space-x-4 transition-shadow hover:shadow-md">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyChart({ message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <svg
        className="w-12 h-12 mb-3 opacity-40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p className="text-sm font-medium">{message}</p>
      {sub && <p className="text-xs mt-1 text-gray-400">{sub}</p>}
    </div>
  );
}

const ProductIcon = () => (
  <svg
    className="w-7 h-7"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);
const OrderIcon = () => (
  <svg
    className="w-7 h-7"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
    />
  </svg>
);
const CustomerIcon = () => (
  <svg
    className="w-7 h-7"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);
const RevenueIcon = () => (
  <svg
    className="w-7 h-7"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const AdminIcon = () => (
  <svg
    className="w-7 h-7"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
