'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

// =============================================================================
// Inline Clean SVG Icons (Zero External Dependencies)
// =============================================================================

function IconOverview({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function IconServices({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
      />
    </svg>
  );
}

function IconKeys({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}

function IconPlayground({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconLogs({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function IconAudit({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function IconPlus({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconCopy({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconCheck({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconRefresh({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function IconExternal({ className = 'w-3 h-3' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function IconTrash({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function IconClose({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// =============================================================================
// Navigation Config
// =============================================================================

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: IconOverview },
  { id: 'services', label: 'Services', icon: IconServices },
  { id: 'keys', label: 'API Keys', icon: IconKeys },
  { id: 'playground', label: 'Playground', icon: IconPlayground },
  { id: 'logs', label: 'Request Logs', icon: IconLogs },
  { id: 'audit', label: 'Audit Trail', icon: IconAudit },
];

const emptyService = { name: '', prefix: '', base_url: '', enabled: true };
const emptyFilters = { status: '', client: '', service: '', path: '' };
const jsonHeaders = { 'Content-Type': 'application/json' };

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function MethodBadge({ method }) {
  const m = (method || 'GET').toUpperCase();
  const cls =
    m === 'GET' ? 'badge-get' : m === 'POST' ? 'badge-post' : m === 'DELETE' ? 'badge-delete' : 'badge-put';
  return <span className={`badge ${cls}`}>{m}</span>;
}

function StatusBadge({ status }) {
  const code = Number(status || 200);
  let cls = 'badge-success';
  if (code === 429) cls = 'badge-warning';
  else if (code >= 400) cls = 'badge-danger';
  return <span className={`badge ${cls}`}>{code}</span>;
}

export default function PlatformDashboard() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Credentials for login
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' });

  // Core Data
  const [health, setHealth] = useState(null);
  const [services, setServices] = useState([]);
  const [keys, setKeys] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Modals & Panels
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [deletingServiceId, setDeletingServiceId] = useState(null);

  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', rate_limit: 60, window_seconds: 60 });
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [newKeySecret, setNewKeySecret] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Request Playground
  const [apiKey, setApiKey] = useState('');
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/users');
  const [body, setBody] = useState('{\n  "name": "Jane Doe",\n  "role": "Staff Engineer"\n}');
  const [result, setResult] = useState(null);
  const [burstSummary, setBurstSummary] = useState(null);

  // Telemetry Logs & Audit
  const [logs, setLogs] = useState({ logs: [], total: 0, offset: 0, limit: 20 });
  const [audit, setAudit] = useState({ logs: [], total: 0, offset: 0, limit: 20 });
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // API Client Bridge
  const api = useCallback(async (route, options = {}) => {
    const response = await fetch(`/api/platform${route}`, { cache: 'no-store', ...options });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && route !== '/admin/login') {
        setUser(null);
        setNewKeySecret('');
        setApiKey('');
      }
      throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/platform/system/health', { cache: 'no-store' });
      const data = await response.json();
      if (data.components) setHealth(data);
    } catch {
      // Keep existing health state
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [serviceData, keyData, stats] = await Promise.all([
        api('/admin/services'),
        api('/admin/keys'),
        api('/admin/analytics'),
      ]);
      setServices(serviceData.services || []);
      setKeys(keyData.keys || []);
      setAnalytics(stats);
      await loadHealth();
    } catch (e) {
      setError(e.message);
    }
  }, [api, loadHealth]);

  useEffect(() => {
    api('/admin/me')
      .then(setUser)
      .catch(() => {})
      .finally(() => setBooting(false));
  }, [api]);

  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  async function action(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  }

  async function loadLogs(offset = 0, values = appliedFilters) {
    const query = new URLSearchParams({ offset: String(offset), limit: '20' });
    for (const [name, value] of Object.entries(values)) {
      if (value) query.set(name, value);
    }
    const data = await api(`/admin/logs?${query}`);
    setLogs(data);
  }

  async function loadAudit(offset = 0) {
    const data = await api(`/admin/audit?offset=${offset}&limit=20`);
    setAudit(data);
  }

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setError('');
    setNotice('');
    if (nextTab === 'logs') action(() => loadLogs(0, appliedFilters));
    if (nextTab === 'audit') action(() => loadAudit(0));
    if (nextTab === 'overview') action(refreshAll);
  }

  async function handleLogin(e) {
    e.preventDefault();
    await action(async () => {
      const res = await api('/admin/login', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(credentials),
      });
      setUser(res);
      setCredentials({ username: 'admin', password: '' });
      setNotice('Signed in successfully.');
    });
  }

  async function handleLogout() {
    await action(async () => {
      await api('/admin/logout', { method: 'POST' });
      setUser(null);
      setApiKey('');
      setNewKeySecret('');
      setResult(null);
      setTab('overview');
    });
  }

  async function handleSaveService(e) {
    e.preventDefault();
    await action(async () => {
      await api(`/admin/services${editingServiceId ? `/${editingServiceId}` : ''}`, {
        method: editingServiceId ? 'PUT' : 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(serviceForm),
      });
      setServiceModalOpen(false);
      setEditingServiceId(null);
      setServiceForm(emptyService);
      await refreshAll();
      setNotice(editingServiceId ? 'Service configuration updated.' : 'Service registered successfully.');
    });
  }

  async function handleDeleteService(id) {
    await action(async () => {
      await api(`/admin/services/${id}`, { method: 'DELETE' });
      setDeletingServiceId(null);
      await refreshAll();
      setNotice('Service route removed. Historical logs preserved.');
    });
  }

  async function handleCreateKey(e) {
    e.preventDefault();
    await action(async () => {
      const created = await api('/admin/keys', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          name: keyForm.name,
          rate_limit: Number(keyForm.rate_limit),
          window_seconds: Number(keyForm.window_seconds),
        }),
      });
      setNewKeySecret(created.key);
      setApiKey(created.key);
      setKeyForm({ name: '', rate_limit: 60, window_seconds: 60 });
      setKeyModalOpen(false);
      await refreshAll();
      setNotice('New API key issued. Copy and save it now.');
    });
  }

  async function handleUpdatePolicy(e) {
    e.preventDefault();
    await action(async () => {
      await api(`/admin/keys/${editingPolicy.id}`, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify({
          rate_limit: Number(editingPolicy.rate_limit),
          window_seconds: Number(editingPolicy.window_seconds),
        }),
      });
      setEditingPolicy(null);
      await refreshAll();
      setNotice('Rate limit policy updated.');
    });
  }

  async function handleRevokeKey(id) {
    await action(async () => {
      await api(`/admin/keys/${id}/revoke`, { method: 'POST' });
      await refreshAll();
      setNotice('API key revoked. Traffic with this key will now be rejected.');
    });
  }

  async function executeSinglePlaygroundRequest() {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('..')) {
      throw new Error('Please enter a valid route starting with a single slash (e.g. /users).');
    }
    const payload = ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(JSON.parse(body)) : undefined;
    const start = performance.now();
    const res = await fetch(`/api/platform/proxy${path}`, {
      method,
      headers: { ...jsonHeaders, 'X-API-Key': apiKey },
      body: payload,
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return {
      status: res.status,
      duration: Math.round(performance.now() - start),
      remaining: res.headers.get('x-ratelimit-remaining'),
      limit: res.headers.get('x-ratelimit-limit'),
      retryAfter: res.headers.get('retry-after'),
      data: parsed,
    };
  }

  function handlePlaygroundSend(burst = false) {
    action(async () => {
      setBurstSummary(null);
      if (burst) {
        if (method !== 'GET') throw new Error('Burst testing is available for GET requests only.');
        const batch = await Promise.all(Array.from({ length: 10 }, () => executeSinglePlaygroundRequest()));
        setResult(batch[batch.length - 1]);
        setBurstSummary({
          accepted: batch.filter((r) => r.status < 400).length,
          limited: batch.filter((r) => r.status === 429).length,
          other: batch.filter((r) => r.status >= 400 && r.status !== 429).length,
        });
      } else {
        setResult(await executeSinglePlaygroundRequest());
      }
      setAnalytics(await api('/admin/analytics'));
    });
  }

  // Active microservices list for quick jump
  const activeServices = useMemo(() => services.filter((s) => s.enabled), [services]);

  // Loading Screen
  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 text-sm">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4" />
        <span className="font-medium text-slate-700">Connecting to API Gateway Control Plane…</span>
      </div>
    );
  }

  // Enterprise Authentication Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md mb-3">
              AP
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">API Gateway Control Plane</h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign in to manage services, keys and traffic policies
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {error && (
              <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                <span>✕</span> {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="form-input"
                  autoComplete="username"
                  required
                  placeholder="admin"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 mt-1" disabled={busy}>
                {busy ? 'Authenticating…' : 'Sign in to Dashboard →'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Secured with SHA-256 session tokens and Neon PostgreSQL
          </p>
        </div>
      </div>
    );
  }

  const dbOnline = health?.components.find((c) => c.id === 'database')?.status === 'online';
  const dbLatency = health?.components.find((c) => c.id === 'database')?.latencyMs;

  return (
    <div className="app-shell">
      {/* =====================================================================
          SIDEBAR NAVIGATION
          ===================================================================== */}
      <aside className="app-sidebar">
        {/* Workspace Brand */}
        <div className="app-sidebar-header">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              AP
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight text-slate-900">API Platform</span>
              <span className="text-[10px] text-slate-400 font-mono">v1.0 · Render</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="app-sidebar-nav">
          <span className="px-2.5 py-1.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
            Control Plane
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${active ? 'active' : ''}`}
                onClick={() => handleTabChange(item.id)}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Live DB Ping */}
        <div className="p-3 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className={`status-dot ${dbOnline ? 'status-dot-online' : 'status-dot-offline'}`} />
              <span className="text-[11px] font-medium text-slate-700">Neon Postgres</span>
            </div>
            <span className="text-[10.5px] font-mono text-slate-500">
              {dbLatency ? `${dbLatency}ms` : 'online'}
            </span>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN APPLICATION VIEW
          ===================================================================== */}
      <div className="app-main">
        {/* Global Topbar */}
        <header className="app-topbar">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="text-slate-400">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">{NAV_ITEMS.find((n) => n.id === tab)?.label}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Refresh */}
            <button
              className="btn-secondary text-xs py-1.5 px-2.5"
              disabled={busy}
              onClick={() => action(refreshAll)}
              title="Refresh telemetry"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            {/* Quick Add Buttons */}
            {tab === 'services' && (
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={() => {
                  setServiceForm(emptyService);
                  setEditingServiceId(null);
                  setServiceModalOpen(true);
                }}
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span>Register Service</span>
              </button>
            )}

            {tab === 'keys' && (
              <button className="btn-primary text-xs py-1.5 px-3" onClick={() => setKeyModalOpen(true)}>
                <IconPlus className="w-3.5 h-3.5" />
                <span>Issue API Key</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {user.username}
              </span>
              <button
                className="btn-ghost text-xs text-slate-500 hover:text-rose-600 py-1 px-2"
                onClick={handleLogout}
                disabled={busy}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="app-content">
          <div className="content-container">
            {/* Global Toasts / Feedback */}
            {notice && (
              <div className="toast-banner toast-success">
                <div className="flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-emerald-600" />
                  <span>{notice}</span>
                </div>
                <button className="btn-icon w-5 h-5 text-emerald-700" onClick={() => setNotice('')}>
                  <IconClose className="w-3 h-3" />
                </button>
              </div>
            )}

            {error && (
              <div className="toast-banner toast-error">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-600">✕</span>
                  <span>{error}</span>
                </div>
                <button className="btn-icon w-5 h-5 text-rose-700" onClick={() => setError('')}>
                  <IconClose className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* =================================================================
                TAB 1: OVERVIEW DASHBOARD
                ================================================================= */}
            {tab === 'overview' && (
              <div className="flex flex-col gap-5">
                {/* 4 Core KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="card p-4">
                    <div className="flex items-center justify-between text-caption mb-1">
                      <span>Total Requests</span>
                      <span className="badge badge-neutral">All time</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {analytics?.total?.toLocaleString() ?? '—'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Processed across all routes</div>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center justify-between text-caption mb-1">
                      <span>Success Rate</span>
                      <span className="badge badge-success">Healthy</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {analytics?.total
                        ? `${Math.round(((analytics.successful || 0) / analytics.total) * 100)}%`
                        : '100%'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {analytics?.successful ?? 0} successful requests
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center justify-between text-caption mb-1">
                      <span>Rate-Limited (429)</span>
                      <span className="badge badge-warning">Enforced</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {analytics?.blocked?.toLocaleString() ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Blocked by sliding window limits</div>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center justify-between text-caption mb-1">
                      <span>Average Latency</span>
                      <span className="badge badge-neutral">Gateway</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {analytics?.average_ms !== undefined ? `${analytics.average_ms} ms` : '—'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Round-trip proxy execution</div>
                  </div>
                </div>

                {/* Infrastructure Component Status Strip */}
                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <span className="text-title-md">Infrastructure Health</span>
                      <span className="badge badge-success">
                        {health?.components.filter((c) => c.status === 'online').length || 0}/
                        {health?.components.length || 0} Online
                      </span>
                    </div>
                    <span className="text-caption">Checked {formatDate(health?.checkedAt)}</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {health?.components.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-800 truncate">{comp.name}</span>
                          <span
                            className={`status-dot ${comp.status === 'online' ? 'status-dot-online' : 'status-dot-offline'}`}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {comp.latencyMs !== null ? `${comp.latencyMs} ms latency` : comp.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2-Column Split: Traffic by Service & Quick Shortcuts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Traffic Volume by Service Table */}
                  <div className="lg:col-span-2 card">
                    <div className="card-header">
                      <span className="text-title-md">Traffic Distribution by Service</span>
                      <span className="text-caption">All recorded calls</span>
                    </div>
                    {analytics?.services?.length ? (
                      <div className="table-container border-0 rounded-none shadow-none">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Microservice</th>
                              <th>Total Calls</th>
                              <th>Error / Blocked</th>
                              <th>Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.services.map((svc) => {
                              const share = analytics.total
                                ? Math.round((svc.requests / analytics.total) * 100)
                                : 0;
                              return (
                                <tr key={svc.name}>
                                  <td>
                                    <span className="font-semibold text-slate-800">{svc.name}</span>
                                  </td>
                                  <td className="tabular-nums font-mono text-slate-700">{svc.requests}</td>
                                  <td>
                                    {svc.errors > 0 ? (
                                      <span className="badge badge-warning">{svc.errors}</span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                  <td className="w-32">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-slate-800 rounded-full"
                                          style={{ width: `${share}%` }}
                                        />
                                      </div>
                                      <span className="text-[11px] font-mono text-slate-500">{share}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No traffic recorded yet. Issue a key and send a request in the Playground.
                      </div>
                    )}
                  </div>

                  {/* Gateway Quick Actions Card */}
                  <div className="card flex flex-col justify-between">
                    <div>
                      <div className="card-header">
                        <span className="text-title-md">Gateway Shortcuts</span>
                      </div>
                      <div className="p-4 flex flex-col gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1">
                            Public Gateway Route
                          </span>
                          <code className="text-xs font-mono font-semibold text-slate-800 break-all select-all">
                            /proxy/[prefix]/[path]
                          </code>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            Requires header <code className="font-mono text-slate-600">X-API-Key</code>
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 mt-1">
                          <button
                            className="btn-secondary w-full justify-start text-xs py-2"
                            onClick={() => handleTabChange('playground')}
                          >
                            <IconPlayground className="w-3.5 h-3.5 text-slate-500" />
                            <span>Open Request Playground</span>
                          </button>
                          <button
                            className="btn-secondary w-full justify-start text-xs py-2"
                            onClick={() => setKeyModalOpen(true)}
                          >
                            <IconKeys className="w-3.5 h-3.5 text-slate-500" />
                            <span>Issue New API Key</span>
                          </button>
                          <button
                            className="btn-secondary w-full justify-start text-xs py-2"
                            onClick={() => {
                              setServiceForm(emptyService);
                              setEditingServiceId(null);
                              setServiceModalOpen(true);
                            }}
                          >
                            <IconServices className="w-3.5 h-3.5 text-slate-500" />
                            <span>Register Microservice</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl text-[11.5px] text-slate-500">
                      Active Services: <strong>{activeServices.length}</strong> · Active Keys:{' '}
                      <strong>{keys.filter((k) => !k.revoked).length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 2: MICROSERVICES DIRECTORY
                ================================================================= */}
            {tab === 'services' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-title-lg">Registered Microservices</h2>
                    <p className="text-body-sm">
                      Reverse-proxied routes mapped by longest-matching path prefix.
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setServiceForm(emptyService);
                      setEditingServiceId(null);
                      setServiceModalOpen(true);
                    }}
                  >
                    <IconPlus className="w-4 h-4" />
                    <span>Register Service</span>
                  </button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Service Name</th>
                        <th>Gateway Route Prefix</th>
                        <th>Upstream Target Address</th>
                        <th>Routing Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((svc) => (
                        <tr key={svc.id}>
                          <td>
                            <div className="font-semibold text-slate-900">{svc.name}</div>
                            <div className="text-caption font-mono text-slate-400">{svc.id.slice(0, 8)}…</div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                                /proxy{svc.prefix}
                              </code>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                              <span>{svc.base_url}</span>
                              {svc.base_url.startsWith('https://') && (
                                <IconExternal className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${svc.enabled ? 'badge-success' : 'badge-danger'}`}>
                              <span
                                className={`status-dot ${svc.enabled ? 'status-dot-online' : 'status-dot-offline'}`}
                              />
                              {svc.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="btn-ghost text-xs py-1 px-2"
                                onClick={() => {
                                  setPath(svc.prefix);
                                  handleTabChange('playground');
                                }}
                                title="Test in playground"
                              >
                                Test ↗
                              </button>
                              <button
                                className="btn-ghost text-xs py-1 px-2"
                                onClick={() => {
                                  setServiceForm({
                                    name: svc.name,
                                    prefix: svc.prefix,
                                    base_url: svc.base_url,
                                    enabled: svc.enabled,
                                  });
                                  setEditingServiceId(svc.id);
                                  setServiceModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-ghost text-xs py-1 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => setDeletingServiceId(svc.id)}
                              >
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 3: CLIENT API KEYS & POLICIES
                ================================================================= */}
            {tab === 'keys' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-title-lg">API Keys & Access Policies</h2>
                    <p className="text-body-sm">
                      Manage cryptographic client credentials and sliding-window rate limit tiers.
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => setKeyModalOpen(true)}>
                    <IconPlus className="w-4 h-4" />
                    <span>Issue API Key</span>
                  </button>
                </div>

                {/* Secret Key Alert (Shown once upon key creation) */}
                {newKeySecret && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-success text-[10.5px]">New Key Generated</span>
                        <span className="text-xs text-slate-300">
                          Copy this key now. For security, raw keys are never stored or displayed again.
                        </span>
                      </div>
                      <code className="text-xs font-mono font-bold text-emerald-400 select-all bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60 mt-1">
                        {newKeySecret}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs py-1.5 px-3"
                        onClick={async () => {
                          await navigator.clipboard.writeText(newKeySecret);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                      >
                        {copiedKey ? (
                          <IconCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <IconCopy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                      </button>
                      <button
                        className="btn-ghost text-slate-400 hover:text-white text-xs py-1.5 px-2"
                        onClick={() => setNewKeySecret('')}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Keys Data Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client Application</th>
                        <th>Key Token Hint</th>
                        <th>Rate Limit Policy</th>
                        <th>Created Date</th>
                        <th>Status</th>
                        <th className="text-right">Policy Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr key={k.id}>
                          <td>
                            <div className="font-semibold text-slate-900">{k.name}</div>
                            <div className="text-caption font-mono text-slate-400">{k.id.slice(0, 8)}…</div>
                          </td>
                          <td>
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              ••••{k.hint}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-neutral font-mono font-medium">
                              {k.rate_limit} req / {k.window_seconds}s
                            </span>
                          </td>
                          <td className="text-xs text-slate-500">{formatDate(k.created_at)}</td>
                          <td>
                            <span className={`badge ${!k.revoked ? 'badge-success' : 'badge-danger'}`}>
                              {!k.revoked ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="text-right">
                            {!k.revoked ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  className="btn-ghost text-xs py-1 px-2"
                                  onClick={() => setEditingPolicy(k)}
                                >
                                  Edit Policy
                                </button>
                                <button
                                  className="btn-ghost text-xs py-1 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => handleRevokeKey(k.id)}
                                >
                                  Revoke
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Access blocked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 4: INTERACTIVE REQUEST PLAYGROUND
                ================================================================= */}
            {tab === 'playground' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Request Composer (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="card">
                    <div className="card-header">
                      <span className="text-title-md">HTTP Request Composer</span>
                      <span className="badge badge-neutral">Live Gateway Proxy</span>
                    </div>

                    <div className="p-4 flex flex-col gap-4">
                      {/* URL & Method Bar */}
                      <div className="flex items-center gap-2">
                        <select
                          className="form-select w-28 font-mono font-bold text-xs"
                          value={method}
                          onChange={(e) => setMethod(e.target.value)}
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>

                        <div className="flex-1 flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                          <span className="px-2.5 py-1.5 bg-slate-100 text-slate-500 font-mono text-xs border-r border-slate-200 select-none">
                            /proxy
                          </span>
                          <input
                            className="w-full px-2.5 py-1.5 text-xs font-mono outline-none border-0"
                            placeholder="/users"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                handlePlaygroundSend(false);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick Route Shortcuts */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-caption mr-1">Available Routes:</span>
                        {services.map((s) => (
                          <button
                            key={s.id}
                            className={`badge ${path === s.prefix ? 'badge-neutral bg-slate-200 font-bold' : 'badge-neutral hover:bg-slate-200 cursor-pointer'}`}
                            onClick={() => setPath(s.prefix)}
                          >
                            {s.prefix}
                          </button>
                        ))}
                      </div>

                      {/* API Key Header Injection */}
                      <div className="form-group">
                        <div className="flex items-center justify-between">
                          <label className="form-label" htmlFor="apiKeyInput">
                            Client Authentication Header (<code className="font-mono">X-API-Key</code>)
                          </label>
                          {keys.filter((k) => !k.revoked).length > 0 && (
                            <select
                              className="text-[11px] font-medium text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50"
                              onChange={(e) => {
                                if (e.target.value) setApiKey(e.target.value);
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Choose active key preset…
                              </option>
                              {keys
                                .filter((k) => !k.revoked)
                                .map((k) => (
                                  <option
                                    key={k.id}
                                    value={
                                      k.name.includes('Free')
                                        ? 'cap_free_tier_demo_client_9948271'
                                        : k.name.includes('Pro')
                                          ? 'cap_pro_tier_web_client_8837192'
                                          : k.name.includes('Enterprise')
                                            ? 'cap_enterprise_partner_b2b_7726183'
                                            : ''
                                    }
                                  >
                                    {k.name} ({k.rate_limit} req/min)
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                        <input
                          id="apiKeyInput"
                          type="password"
                          className="form-input font-mono text-xs"
                          placeholder="Paste API Key (e.g. cap_...) or leave empty to test 401 Unauthorized"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                      </div>

                      {/* Request Body Editor (for POST/PUT) */}
                      {['POST', 'PUT', 'PATCH'].includes(method) && (
                        <div className="form-group">
                          <label className="form-label">JSON Request Payload</label>
                          <textarea
                            className="form-textarea font-mono text-xs"
                            rows={6}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="text-caption">
                          Press{' '}
                          <kbd className="bg-slate-100 border border-slate-300 rounded px-1 py-0.5">Ctrl</kbd>{' '}
                          +{' '}
                          <kbd className="bg-slate-100 border border-slate-300 rounded px-1 py-0.5">
                            Enter
                          </kbd>{' '}
                          to execute
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn-secondary text-xs"
                            disabled={busy || method !== 'GET'}
                            onClick={() => handlePlaygroundSend(true)}
                            title="Sends 10 concurrent requests to test rate limit enforcement"
                          >
                            <span>Send 10 Burst</span>
                          </button>
                          <button
                            className="btn-primary text-xs"
                            disabled={busy}
                            onClick={() => handlePlaygroundSend(false)}
                          >
                            <span>{busy ? 'Dispatching…' : 'Send Request →'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Burst Test Summary Banner */}
                  {burstSummary && (
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800">
                          Burst Completed:
                        </span>
                        <span>
                          <strong className="text-emerald-700">{burstSummary.accepted} Allowed (200)</strong>{' '}
                          ·{' '}
                          <strong className="text-amber-700">
                            {burstSummary.limited} Rate Limited (429)
                          </strong>{' '}
                          · <strong>{burstSummary.other} Other</strong>
                        </span>
                      </div>
                      <span className="text-caption text-amber-700 font-mono">10 concurrent calls</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Live HTTP Response Inspector (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="card h-full flex flex-col">
                    <div className="card-header">
                      <div className="flex items-center gap-2">
                        <span className="text-title-md">Response Output</span>
                        {result && <StatusBadge status={result.status} />}
                      </div>
                      {result && (
                        <div className="flex items-center gap-2 text-caption">
                          <span className="font-mono">{result.duration} ms</span>
                        </div>
                      )}
                    </div>

                    {result ? (
                      <div className="flex-1 flex flex-col">
                        {/* Response Metadata Bar */}
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3 font-mono text-[11.5px] text-slate-600">
                            <span>
                              Remaining:{' '}
                              <strong
                                className={
                                  Number(result.remaining) === 0 ? 'text-amber-600' : 'text-slate-900'
                                }
                              >
                                {result.remaining ?? '—'}
                              </strong>
                              {result.limit && ` / ${result.limit}`}
                            </span>
                            {result.retryAfter && (
                              <span className="text-amber-600 font-semibold">
                                Retry-After: {result.retryAfter}s
                              </span>
                            )}
                          </div>
                          <button
                            className="btn-ghost text-[11px] py-1 px-2"
                            onClick={async () => {
                              await navigator.clipboard.writeText(
                                typeof result.data === 'string'
                                  ? result.data
                                  : JSON.stringify(result.data, null, 2),
                              );
                              setNotice('Response body copied to clipboard.');
                            }}
                          >
                            <IconCopy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {/* JSON / Text Payload */}
                        <pre className="p-4 flex-1 text-xs font-mono bg-white text-slate-800 overflow-auto max-h-[500px] leading-relaxed">
                          {typeof result.data === 'string'
                            ? result.data
                            : JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                        <IconPlayground className="w-8 h-8 text-slate-300 mb-2" />
                        <span>Ready to proxy. Send a request to inspect the live response.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 5: REAL-TIME REQUEST TELEMETRY LOGS
                ================================================================= */}
            {tab === 'logs' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-title-lg">Request Telemetry Logs</h2>
                    <p className="text-body-sm">
                      Inspect proxy latencies, client identities, and traffic status codes in real time.
                    </p>
                  </div>
                  <span className="text-caption font-mono">Total recorded: {logs.total}</span>
                </div>

                {/* Filter Toolbar */}
                <form
                  className="card p-3 flex flex-wrap items-center gap-3 bg-white"
                  onSubmit={(e) => {
                    e.preventDefault();
                    action(async () => {
                      setAppliedFilters(filters);
                      await loadLogs(0, filters);
                    });
                  }}
                >
                  <div className="w-32">
                    <select
                      className="form-select text-xs py-1.5"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                      <option value="">All Statuses</option>
                      <option value="200">200 OK</option>
                      <option value="201">201 Created</option>
                      <option value="400">400 Bad Request</option>
                      <option value="401">401 Unauthorized</option>
                      <option value="404">404 Not Found</option>
                      <option value="429">429 Rate Limited</option>
                      <option value="502">502 Bad Gateway</option>
                      <option value="504">504 Gateway Timeout</option>
                    </select>
                  </div>

                  <div className="w-44">
                    <select
                      className="form-select text-xs py-1.5"
                      value={filters.client}
                      onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                    >
                      <option value="">All Clients</option>
                      {keys.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-44">
                    <select
                      className="form-select text-xs py-1.5"
                      value={filters.service}
                      onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                    >
                      <option value="">All Services</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <input
                      className="form-input text-xs py-1.5"
                      placeholder="Filter path (e.g. /users)..."
                      value={filters.path}
                      onChange={(e) => setFilters({ ...filters, path: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="submit" className="btn-primary text-xs py-1.5 px-3" disabled={busy}>
                      Apply Filters
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs py-1.5 px-2"
                      onClick={() => {
                        setFilters(emptyFilters);
                        setAppliedFilters(emptyFilters);
                        action(() => loadLogs(0, emptyFilters));
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </form>

                {/* Logs Data Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Client Application</th>
                        <th>Target Route</th>
                        <th>Service Destination</th>
                        <th>Status</th>
                        <th>Latency</th>
                        <th className="text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.logs.length > 0 ? (
                        logs.logs.map((log) => (
                          <tr
                            key={log.id}
                            className="cursor-pointer hover:bg-slate-50/80"
                            onClick={() => setSelectedLogDetail(log)}
                          >
                            <td className="text-xs text-slate-500 whitespace-nowrap">
                              {formatDate(log.created_at)}
                            </td>
                            <td>
                              <span className="font-semibold text-slate-900 text-xs">
                                {log.client_name || 'Unauthenticated'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <MethodBadge method={log.method} />
                                <code className="text-xs font-mono font-medium text-slate-800">
                                  {log.path}
                                </code>
                              </div>
                            </td>
                            <td>
                              <span className="text-xs text-slate-600 font-medium">
                                {log.service_name || <span className="text-slate-400 italic">Unmatched</span>}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={log.status} />
                            </td>
                            <td className="tabular-nums font-mono text-xs text-slate-600">
                              {log.duration_ms} ms
                            </td>
                            <td className="text-right">
                              <button
                                className="btn-ghost text-xs py-1 px-2 text-slate-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLogDetail(log);
                                }}
                              >
                                View →
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-slate-400 text-xs">
                            No request telemetry logs found matching the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Toolbar */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Showing{' '}
                    {logs.total > 0
                      ? `${logs.offset + 1}–${Math.min(logs.offset + logs.limit, logs.total)}`
                      : '0'}{' '}
                    of {logs.total} logs
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="btn-secondary text-xs py-1 px-3"
                      disabled={busy || logs.offset === 0}
                      onClick={() => action(() => loadLogs(Math.max(0, logs.offset - logs.limit)))}
                    >
                      Previous
                    </button>
                    <button
                      className="btn-secondary text-xs py-1 px-3"
                      disabled={busy || logs.offset + logs.limit >= logs.total}
                      onClick={() => action(() => loadLogs(logs.offset + logs.limit))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 6: SECURITY AUDIT TRAIL
                ================================================================= */}
            {tab === 'audit' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-title-lg">Security & Governance Audit Trail</h2>
                    <p className="text-body-sm">
                      Immutable record of administrative logins, service mutations, and credential lifecycles.
                    </p>
                  </div>
                  <span className="text-caption font-mono">Total events: {audit.total}</span>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Administrator</th>
                        <th>Action Event</th>
                        <th>Payload & Configuration Parameters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.logs.length > 0 ? (
                        audit.logs.map((item) => (
                          <tr key={item.id}>
                            <td className="text-xs text-slate-500 whitespace-nowrap">
                              {formatDate(item.created_at)}
                            </td>
                            <td>
                              <span className="badge badge-neutral font-semibold text-slate-800">
                                {item.actor}
                              </span>
                            </td>
                            <td>
                              <code className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {item.action}
                              </code>
                            </td>
                            <td>
                              <code className="text-xs font-mono text-slate-600 break-all select-all">
                                {JSON.stringify(item.details)}
                              </code>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center p-8 text-slate-400 text-xs">
                            No audit trail events recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Showing{' '}
                    {audit.total > 0
                      ? `${audit.offset + 1}–${Math.min(audit.offset + audit.limit, audit.total)}`
                      : '0'}{' '}
                    of {audit.total} events
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="btn-secondary text-xs py-1 px-3"
                      disabled={busy || audit.offset === 0}
                      onClick={() => action(() => loadAudit(Math.max(0, audit.offset - audit.limit)))}
                    >
                      Previous
                    </button>
                    <button
                      className="btn-secondary text-xs py-1 px-3"
                      disabled={busy || audit.offset + audit.limit >= audit.total}
                      onClick={() => action(() => loadAudit(audit.offset + audit.limit))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =====================================================================
          MODAL: REGISTER / EDIT SERVICE
          ===================================================================== */}
      {serviceModalOpen && (
        <div className="modal-backdrop" onClick={() => setServiceModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <span className="text-title-md">
                {editingServiceId ? 'Edit Microservice' : 'Register New Microservice'}
              </span>
              <button className="btn-icon" onClick={() => setServiceModalOpen(false)}>
                <IconClose />
              </button>
            </div>

            <form onSubmit={handleSaveService}>
              <div className="card-body flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="svcName">
                    Microservice Display Name
                  </label>
                  <input
                    id="svcName"
                    required
                    maxLength={80}
                    className="form-input"
                    placeholder="e.g. Payments Microservice"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="svcPrefix">
                    Routing Path Prefix
                  </label>
                  <input
                    id="svcPrefix"
                    required
                    pattern="^/[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_-]+)*$"
                    className="form-input font-mono"
                    placeholder="e.g. /payments"
                    value={serviceForm.prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, prefix: e.target.value })}
                  />
                  <span className="form-helper">
                    Traffic reaching <code className="text-slate-800">/proxy[prefix]</code> will forward here.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="svcUrl">
                    Upstream Target Base URL
                  </label>
                  <input
                    id="svcUrl"
                    type="url"
                    required
                    className="form-input font-mono"
                    placeholder="e.g. https://api.mybackend.com"
                    value={serviceForm.base_url}
                    onChange={(e) => setServiceForm({ ...serviceForm, base_url: e.target.value })}
                  />
                  <span className="form-helper">
                    Provide the host origin only without subpaths. Gateway preserves request paths.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="svcEnabled"
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    checked={serviceForm.enabled}
                    onChange={(e) => setServiceForm({ ...serviceForm, enabled: e.target.checked })}
                  />
                  <label htmlFor="svcEnabled" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Enable routing immediately upon save
                  </label>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setServiceModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={busy}>
                  {busy ? 'Saving…' : editingServiceId ? 'Save Changes' : 'Register Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ISSUE API KEY
          ===================================================================== */}
      {keyModalOpen && (
        <div className="modal-backdrop" onClick={() => setKeyModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <span className="text-title-md">Issue Client API Key</span>
              <button className="btn-icon" onClick={() => setKeyModalOpen(false)}>
                <IconClose />
              </button>
            </div>

            <form onSubmit={handleCreateKey}>
              <div className="card-body flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="keyName">
                    Client Application / Consumer Name
                  </label>
                  <input
                    id="keyName"
                    required
                    maxLength={80}
                    className="form-input"
                    placeholder="e.g. iOS Mobile Production"
                    value={keyForm.name}
                    onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                  />
                </div>

                {/* Preset Tier Pills */}
                <div className="form-group">
                  <label className="form-label">Rate Limiting Tier Presets</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`btn-secondary text-xs flex-col py-2 ${keyForm.rate_limit === 10 ? 'border-slate-800 bg-slate-50 font-bold' : ''}`}
                      onClick={() => setKeyForm({ ...keyForm, rate_limit: 10, window_seconds: 60 })}
                    >
                      <span className="font-semibold text-slate-900">Free Tier</span>
                      <span className="text-[10.5px] text-slate-500 font-mono">10 req / min</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-secondary text-xs flex-col py-2 ${keyForm.rate_limit === 60 ? 'border-slate-800 bg-slate-50 font-bold' : ''}`}
                      onClick={() => setKeyForm({ ...keyForm, rate_limit: 60, window_seconds: 60 })}
                    >
                      <span className="font-semibold text-slate-900">Pro Tier</span>
                      <span className="text-[10.5px] text-slate-500 font-mono">60 req / min</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-secondary text-xs flex-col py-2 ${keyForm.rate_limit === 500 ? 'border-slate-800 bg-slate-50 font-bold' : ''}`}
                      onClick={() => setKeyForm({ ...keyForm, rate_limit: 500, window_seconds: 60 })}
                    >
                      <span className="font-semibold text-slate-900">Enterprise</span>
                      <span className="text-[10.5px] text-slate-500 font-mono">500 req / min</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="rateLimit">
                      Requests Allowed
                    </label>
                    <input
                      id="rateLimit"
                      type="number"
                      min={1}
                      max={10000}
                      required
                      className="form-input"
                      value={keyForm.rate_limit}
                      onChange={(e) => setKeyForm({ ...keyForm, rate_limit: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="windowSec">
                      Sliding Window (seconds)
                    </label>
                    <input
                      id="windowSec"
                      type="number"
                      min={1}
                      max={3600}
                      required
                      className="form-input"
                      value={keyForm.window_seconds}
                      onChange={(e) => setKeyForm({ ...keyForm, window_seconds: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setKeyModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={busy}>
                  {busy ? 'Generating…' : 'Issue API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT POLICY
          ===================================================================== */}
      {editingPolicy && (
        <div className="modal-backdrop" onClick={() => setEditingPolicy(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <span className="text-title-md">Edit Policy: {editingPolicy.name}</span>
              <button className="btn-icon" onClick={() => setEditingPolicy(null)}>
                <IconClose />
              </button>
            </div>

            <form onSubmit={handleUpdatePolicy}>
              <div className="card-body flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Requests Allowed</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      required
                      className="form-input"
                      value={editingPolicy.rate_limit}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, rate_limit: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sliding Window (seconds)</label>
                    <input
                      type="number"
                      min={1}
                      max={3600}
                      required
                      className="form-input"
                      value={editingPolicy.window_seconds}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, window_seconds: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setEditingPolicy(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={busy}>
                  {busy ? 'Saving…' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          CONFIRM DELETE SERVICE MODAL
          ===================================================================== */}
      {deletingServiceId && (
        <div className="modal-backdrop" onClick={() => setDeletingServiceId(null)}>
          <div className="modal-dialog max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <span className="text-title-md text-rose-600">Delete Route</span>
              <button className="btn-icon" onClick={() => setDeletingServiceId(null)}>
                <IconClose />
              </button>
            </div>
            <div className="card-body text-xs text-slate-600">
              Are you sure you want to remove this microservice route? Clients calling this prefix will
              immediately receive 404 Not Found. Historical logs are preserved.
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button className="btn-secondary text-xs" onClick={() => setDeletingServiceId(null)}>
                Cancel
              </button>
              <button
                className="btn-danger text-xs py-1.5 px-3"
                disabled={busy}
                onClick={() => handleDeleteService(deletingServiceId)}
              >
                Delete Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER: REQUEST LOG INSPECTOR
          ===================================================================== */}
      {selectedLogDetail && (
        <div className="drawer-backdrop" onClick={() => setSelectedLogDetail(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MethodBadge method={selectedLogDetail.method} />
                <span className="font-mono text-xs font-bold text-slate-900 truncate">
                  {selectedLogDetail.path}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedLogDetail(null)}>
                <IconClose />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">HTTP Status</span>
                <StatusBadge status={selectedLogDetail.status} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10.5px]">
                  Execution Details
                </span>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedLogDetail.duration_ms} ms
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Timestamp</span>
                  <span className="text-slate-800">{formatDate(selectedLogDetail.created_at)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Log ID</span>
                  <span className="font-mono text-slate-800">#{selectedLogDetail.id}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10.5px]">
                  Client Consumer
                </span>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Client Name</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLogDetail.client_name || 'Unauthenticated'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Client ID</span>
                  <span className="font-mono text-slate-600 truncate max-w-[200px]">
                    {selectedLogDetail.client_id || '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10.5px]">
                  Target Microservice
                </span>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Service Name</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLogDetail.service_name || 'Unmatched'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Service ID</span>
                  <span className="font-mono text-slate-600 truncate max-w-[200px]">
                    {selectedLogDetail.service_id || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button className="btn-secondary text-xs" onClick={() => setSelectedLogDetail(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
