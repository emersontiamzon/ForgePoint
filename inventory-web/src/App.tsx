import { FormEvent, useEffect, useState } from 'react';
import Login from './components/Login';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  quantityOnHand: number;
  lowStockThreshold?: number;
  supplier?: string;
  location?: string;
}

interface ProductsResponse {
  items: Product[];
}

interface StockMovement {
  id: string;
  productId: string;
  kind: 'sale' | 'return' | 'purchase';
  quantity: number;
  createdAt: string;
}

interface LowStockAlert {
  id: string;
  productId: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  emailSent: boolean;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '0',
    quantityOnHand: '0',
    lowStockThreshold: '10',
  });

  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportType, setReportType] = useState<'inventory-value' | 'inventory-turnover'>('inventory-value');
  const [reportDays, setReportDays] = useState(30);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Check for existing auth tokens on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('authTokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      setAuthTokens(tokens);
      setIsAuthenticated(true);
      loadProducts();
    }
  }, []);

  const handleLogin = (tokens: AuthTokens) => {
    setAuthTokens(tokens);
    setIsAuthenticated(true);
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    loadProducts();
  };

  const handleLogout = () => {
    setAuthTokens(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authTokens');
    setProducts([]);
    setAlerts([]);
    setReportData(null);
  };

  const loadProducts = () => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:4000/api/products', {
      headers: {
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ProductsResponse>;
      })
      .then((data) => {
        setProducts(data.items ?? []);
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated]);

  const loadAlerts = () => {
    setAlertsLoading(true);
    fetch('http://localhost:4000/api/products/alerts/low-stock', {
      headers: {
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ items: LowStockAlert[] }>;
      })
      .then((data) => {
        setAlerts(data.items ?? []);
      })
      .catch((err) => {
        console.error('Failed to load alerts:', err);
      })
      .finally(() => setAlertsLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Load alerts every 30 seconds
      loadAlerts();
      const interval = setInterval(loadAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    fetch('http://localhost:4000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
      body: JSON.stringify({
        name: form.name,
        sku: form.sku,
        price: Number(form.price),
        quantityOnHand: Number(form.quantityOnHand),
        lowStockThreshold: Number(form.lowStockThreshold),
      }),
    })
      .then(async (res) => {
        if (res.status === 409) {
          throw new Error('SKU already exists');
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json() as Promise<Product>;
      })
      .then(() => {
        setForm({ name: '', sku: '', price: '0', quantityOnHand: '0', lowStockThreshold: '10' });
        loadProducts();
      })
      .catch((err) => {
        setError(String(err));
      });
  };

  const adjustStock = (productId: string, kind: 'sale' | 'return' | 'purchase') => {
    const raw = window.prompt(`Enter quantity for ${kind} (must be > 0)`);
    if (!raw) return;
    const quantity = Number(raw);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    setError(null);
    fetch(`http://localhost:4000/api/inventory/${kind}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
      body: JSON.stringify({ productId, quantity }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json() as Promise<Product>;
      })
      .then(() => loadProducts())
      .catch((err) => setError(String(err)));
  };

  const acknowledgeAlert = (alertId: string) => {
    setError(null);
    fetch(`http://localhost:4000/api/products/alerts/low-stock/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
      body: JSON.stringify({ userId: authTokens?.user.id }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then(() => loadAlerts())
      .catch((err) => setError(String(err)));
  };

  const setThreshold = (productId: string, threshold: number) => {
    setError(null);
    fetch(`http://localhost:4000/api/products/${productId}/low-stock-threshold`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
      body: JSON.stringify({ threshold }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then(() => loadProducts())
      .catch((err) => setError(String(err)));
  };

  const viewHistory = (p: Product) => {
    setHistoryProduct(p);
    setHistory([]);
    setHistoryLoading(true);
    setError(null);

    fetch(`http://localhost:4000/api/products/${p.id}/movements`, {
      headers: {
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json() as Promise<{ items: StockMovement[] }>;
      })
      .then((data) => setHistory(data.items ?? []))
      .catch((err) => setError(String(err)))
      .finally(() => setHistoryLoading(false));
  };

  const editProduct = (p: Product) => {
    const name = window.prompt('Name', p.name) ?? p.name;
    const priceRaw = window.prompt('Price', String(p.price)) ?? String(p.price);
    const qtyRaw = window.prompt('Quantity', String(p.quantityOnHand)) ?? String(p.quantityOnHand);
    const thresholdRaw = window.prompt('Low Stock Threshold', String(p.lowStockThreshold ?? 10)) ?? String(p.lowStockThreshold ?? 10);

    const price = Number(priceRaw);
    const quantityOnHand = Number(qtyRaw);
    const lowStockThreshold = Number(thresholdRaw);
    if (!Number.isFinite(price) || !Number.isFinite(quantityOnHand) || !Number.isFinite(lowStockThreshold)) {
      setError('Price, quantity, and threshold must be numbers');
      return;
    }

    setError(null);
    fetch(`http://localhost:4000/api/products/${p.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
      body: JSON.stringify({ name, price, quantityOnHand, lowStockThreshold }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json() as Promise<Product>;
      })
      .then(() => loadProducts())
      .catch((err) => setError(String(err)));
  };

  const deleteProduct = (p: Product) => {
    const confirmed = window.confirm(`Delete product "${p.name}" (SKU ${p.sku})?`);
    if (!confirmed) return;

    setError(null);
    fetch(`http://localhost:4000/api/products/${p.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok && res.status !== 204) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
      })
      .then(() => loadProducts())
      .catch((err) => setError(String(err)));
  };

  const loadReport = () => {
    setReportLoading(true);
    setError(null);
    
    let url = `http://localhost:4000/api/reports/${reportType}`;
    if (reportType === 'inventory-turnover') {
      url += `?days=${reportDays}`;
    }
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${authTokens?.accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setReportData(data);
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => setReportLoading(false));
  };

  const downloadReportCSV = () => {
    let url = `http://localhost:4000/api/reports/${reportType}/csv`;
    if (reportType === 'inventory-turnover') {
      url += `?days=${reportDays}`;
    }
    
    window.open(url, '_blank');
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-extrabold text-secondary-900">
            ForgePoint Inventory Management
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Please sign in to access your inventory
          </p>
          <Login onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // Main authenticated app
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      <header className="bg-white shadow-soft border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                  <span className="text-white font-bold">FP</span>
                </div>
                <h1 className="text-xl font-semibold text-secondary-900">ForgePoint Inventory</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {authTokens?.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-secondary-700">
                  {authTokens?.user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-danger text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <div className="bg-white rounded-lg shadow-soft p-4 mb-6">
            <p className="text-sm text-secondary-600">
              Product CRUD (Story 001.001), Low-Stock Alerts (Story 001.003), and Inventory Reporting (Story 001.004) backed by inventory-api.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-error-50 p-4 mb-6 animate-slide-down">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className={`btn relative ${
                showAlerts ? 'btn-warning' : 'btn-secondary'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="sm:hidden">Alerts</span>
              <span className="hidden sm:inline">Low Stock Alerts</span>
              {alerts.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-error-500 text-white text-xs flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowReports(!showReports)}
              className={`btn ${
                showReports ? 'btn-success' : 'btn-secondary'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="sm:hidden">Reports</span>
              <span className="hidden sm:inline">Inventory Reports</span>
            </button>
          </div>

        <section className="card mb-6 animate-scale-in">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Product
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Product Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="form-label">SKU</label>
                <input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="form-input"
                  placeholder="Enter SKU"
                />
              </div>
              <div>
                <label className="form-label">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="form-label">Initial Quantity</label>
                <input
                  type="number"
                  value={form.quantityOnHand}
                  onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })}
                  className="form-input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="form-label">Low Stock Threshold</label>
                <input
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  className="form-input"
                  placeholder="10"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="card animate-scale-in">
          <div className="card-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Products
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {products.length}
                </span>
              </h2>
            </div>
          </div>
          <div className="card-body overflow-x-auto">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="loading-spinner"></div>
                <span className="ml-2 text-secondary-600">Loading products…</span>
              </div>
            )}
            {!loading && products.length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-secondary-900">No products</h3>
                <p className="mt-1 text-sm text-secondary-500">Get started by creating a new product.</p>
              </div>
            )}
            {products.length > 0 && (
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Product</th>
                      <th className="table-header-cell hidden sm:table-cell">SKU</th>
                      <th className="table-header-cell text-right hidden md:table-cell">Price</th>
                      <th className="table-header-cell text-right">Stock</th>
                      <th className="table-header-cell text-right hidden lg:table-cell">Threshold</th>
                      <th className="table-header-cell text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {products.map((p) => (
                      <tr key={p.id} className="table-row">
                        <td className="table-cell font-medium">
                          <div>
                            <div className="font-medium text-secondary-900">{p.name}</div>
                            <div className="text-sm text-secondary-500 sm:hidden">{p.sku}</div>
                            <div className="text-sm text-secondary-500 md:hidden">${p.price.toFixed(2)}</div>
                          </div>
                        </td>
                        <td className="table-cell text-secondary-600 hidden sm:table-cell">{p.sku}</td>
                        <td className="table-cell text-right hidden md:table-cell">${p.price.toFixed(2)}</td>
                        <td className="table-cell text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.lowStockThreshold && p.quantityOnHand <= p.lowStockThreshold
                              ? 'status-danger'
                              : 'status-success'
                          }`}>
                            {p.quantityOnHand}
                            {p.lowStockThreshold && p.quantityOnHand <= p.lowStockThreshold && (
                              <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        </td>
                        <td className="table-cell text-right hidden lg:table-cell">{p.lowStockThreshold ?? 10}</td>
                        <td className="table-cell">
                          <div className="flex justify-center space-x-1">
                            <div className="flex flex-col sm:flex-row gap-1">
                              <button
                                onClick={() => adjustStock(p.id, 'sale')}
                                className="btn btn-danger text-xs py-1 px-2"
                                title="Record a sale"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span className="hidden sm:inline ml-1">Sale</span>
                              </button>
                              <button
                                onClick={() => adjustStock(p.id, 'return')}
                                className="btn btn-success text-xs py-1 px-2"
                                title="Record a return"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span className="hidden sm:inline ml-1">Return</span>
                              </button>
                              <button
                                onClick={() => adjustStock(p.id, 'purchase')}
                                className="btn btn-primary text-xs py-1 px-2"
                                title="Record a purchase"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="hidden sm:inline ml-1">Purchase</span>
                              </button>
                              <button
                                onClick={() => editProduct(p)}
                                className="btn btn-secondary text-xs py-1 px-2"
                                title="Edit product"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="hidden sm:inline ml-1">Edit</span>
                              </button>
                              <button
                                onClick={() => deleteProduct(p)}
                                className="btn btn-danger text-xs py-1 px-2"
                                title="Delete product"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="hidden sm:inline ml-1">Delete</span>
                              </button>
                              <button
                                onClick={() => viewHistory(p)}
                                className="btn btn-secondary text-xs py-1 px-2"
                                title="View history"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="hidden sm:inline ml-1">History</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {historyProduct && (
          <section className="card animate-scale-in">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History for {historyProduct.name} (SKU {historyProduct.sku})
              </h2>
            </div>
            <div className="card-body">
              {historyLoading && (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-secondary-600">Loading history…</span>
                </div>
              )}
              {!historyLoading && history.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-secondary-900">No movements yet</h3>
                  <p className="mt-1 text-sm text-secondary-500">Stock movements will appear here once recorded.</p>
                </div>
              )}
              {!historyLoading && history.length > 0 && (
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Time</th>
                        <th className="table-header-cell">Type</th>
                        <th className="table-header-cell text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {history.map((m) => (
                        <tr key={m.id} className="table-row">
                          <td className="table-cell">{new Date(m.createdAt).toLocaleString()}</td>
                          <td className="table-cell">
                            <span className={`status-badge ${
                              m.kind === 'sale' ? 'status-danger' :
                              m.kind === 'return' ? 'status-warning' :
                              'status-success'
                            }`}>
                              {m.kind}
                            </span>
                          </td>
                          <td className="table-cell text-right font-medium">{m.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {showAlerts && (
          <section className="card animate-scale-in border-l-4 border-warning-500">
            <div className="card-header bg-warning-50">
              <h2 className="text-lg font-semibold text-warning-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Low Stock Alerts
                {alerts.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                    {alerts.length}
                  </span>
                )}
              </h2>
            </div>
            <div className="card-body">
              {alertsLoading && (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-warning-700">Loading alerts…</span>
                </div>
              )}
              {!alertsLoading && alerts.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-secondary-900">No active alerts</h3>
                  <p className="mt-1 text-sm text-secondary-500">All products have sufficient stock levels.</p>
                </div>
              )}
              {!alertsLoading && alerts.length > 0 && (
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Product</th>
                        <th className="table-header-cell">Triggered At</th>
                        <th className="table-header-cell text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {alerts.map((alert) => {
                        const product = products.find(p => p.id === alert.productId);
                        return (
                          <tr key={alert.id} className="table-row">
                            <td className="table-cell font-medium">
                              {product ? `${product.name} (SKU: ${product.sku})` : 'Unknown Product'}
                            </td>
                            <td className="table-cell">{new Date(alert.triggeredAt).toLocaleString()}</td>
                            <td className="table-cell">
                              <div className="flex justify-center">
                                <button
                                  onClick={() => acknowledgeAlert(alert.id)}
                                  className="btn btn-warning text-xs py-1 px-2"
                                >
                                  Acknowledge
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {showReports && (
          <section className="card animate-scale-in border-l-4 border-success-500">
            <div className="card-header bg-success-50">
              <h2 className="text-lg font-semibold text-success-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Inventory Reports
              </h2>
            </div>
            <div className="card-body">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
                <div className="w-full sm:w-auto">
                  <label className="form-label">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'inventory-value' | 'inventory-turnover')}
                    className="form-input"
                  >
                    <option value="inventory-value">Inventory Value</option>
                    <option value="inventory-turnover">Inventory Turnover</option>
                  </select>
                </div>
                
                {reportType === 'inventory-turnover' && (
                  <div className="w-full sm:w-auto">
                    <label className="form-label">Period (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={reportDays}
                      onChange={(e) => setReportDays(Number(e.target.value))}
                      className="form-input w-20"
                    />
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={loadReport}
                    disabled={reportLoading}
                    className="btn btn-success"
                  >
                    {reportLoading ? (
                      <span className="flex items-center">
                        <div className="loading-spinner mr-2"></div>
                        Generating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Generate
                      </span>
                    )}
                  </button>
                  
                  {reportData && (
                    <button
                      onClick={downloadReportCSV}
                      className="btn btn-secondary"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Download CSV</span>
                      <span className="sm:hidden">CSV</span>
                    </button>
                  )}
                </div>
              </div>
              
              {reportLoading && (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-success-700">Generating report…</span>
                </div>
              )}
              
              {!reportLoading && reportData && (
                <div className="table-container">
                  {reportType === 'inventory-value' && (
                    <div>
                      <div className="bg-success-50 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-medium text-success-800">
                          Total Inventory Value: ${reportData.totalValue.toFixed(2)}
                        </h3>
                      </div>
                      <table className="table">
                        <thead className="table-header">
                          <tr>
                            <th className="table-header-cell">Product</th>
                            <th className="table-header-cell">SKU</th>
                            <th className="table-header-cell text-right">Quantity</th>
                            <th className="table-header-cell text-right">Price</th>
                            <th className="table-header-cell text-right">Total Value</th>
                            <th className="table-header-cell">Supplier</th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {reportData.breakdown.map((item: any) => (
                            <tr key={item.productId} className="table-row">
                              <td className="table-cell font-medium">{item.productName}</td>
                              <td className="table-cell text-secondary-600">{item.sku}</td>
                              <td className="table-cell text-right">{item.quantity}</td>
                              <td className="table-cell text-right">${item.price.toFixed(2)}</td>
                              <td className="table-cell text-right font-medium">${item.totalValue.toFixed(2)}</td>
                              <td className="table-cell">{item.supplier || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {reportType === 'inventory-turnover' && (
                    <div>
                      <div className="bg-success-50 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-medium text-success-800">
                          Turnover Report: {new Date(reportData.period.startDate).toLocaleDateString()} - {new Date(reportData.period.endDate).toLocaleDateString()}
                        </h3>
                      </div>
                      <table className="table">
                        <thead className="table-header">
                          <tr>
                            <th className="table-header-cell">Product</th>
                            <th className="table-header-cell">SKU</th>
                            <th className="table-header-cell text-right">Beginning Stock</th>
                            <th className="table-header-cell text-right">Purchases</th>
                            <th className="table-header-cell text-right">Sales</th>
                            <th className="table-header-cell text-right">Ending Stock</th>
                            <th className="table-header-cell text-right">Turnover Rate</th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {reportData.turnoverData.map((item: any) => (
                            <tr key={item.productId} className="table-row">
                              <td className="table-cell font-medium">{item.productName}</td>
                              <td className="table-cell text-secondary-600">{item.sku}</td>
                              <td className="table-cell text-right">{item.beginningStock}</td>
                              <td className="table-cell text-right">{item.purchases}</td>
                              <td className="table-cell text-right">{item.sales}</td>
                              <td className="table-cell text-right">{item.endingStock}</td>
                              <td className="table-cell text-right">{item.turnoverRate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
        </div>
      </main>
    </div>
  );
}

export default App;
