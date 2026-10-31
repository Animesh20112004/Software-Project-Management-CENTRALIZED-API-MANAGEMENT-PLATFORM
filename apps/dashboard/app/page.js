'use client';
import { useCallback, useEffect, useState } from 'react';

const nav = [
  ['overview', 'Overview', '◫'],
  ['services', 'Services', '⇄'],
  ['keys', 'API keys', '⚿'],
  ['playground', 'Request playground', '↗'],
  ['logs', 'Request logs', '≡'],
  ['audit', 'Audit trail', '◷'],
  ['guide', 'Demo guide', '?'],
];
const descriptions = {
  overview: 'Your services, access policies and traffic in one place.',
  services: 'Register backends and choose how requests reach them.',
  keys: 'Issue client keys and set a request limit for each client.',
  playground: 'Send real requests through the same gateway your clients use.',
  logs: 'Inspect successful, failed and blocked client requests.',
  audit: 'See who changed the platform configuration and when.',
  guide: 'A short walkthrough for your academic project demo.',
};
const date = (value) => new Date(value).toLocaleString();
const emptyService = { name: '', prefix: '', base_url: '', enabled: true };
const emptyFilters = { status: '', client: '', service: '', path: '' };
const jsonHeaders = { 'Content-Type': 'application/json' };

function Badge({ children, good = true }) {
  return <span className={`badge ${good ? 'good' : 'warn'}`}>{children}</span>;
}
function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
function Pager({ data, onPage, busy }) {
  return (
    <div className="pager">
      <span>
        {data.total
          ? `${data.offset + 1}–${Math.min(data.offset + data.limit, data.total)} of ${data.total}`
          : '0 results'}
      </span>
      <div>
        <button
          className="secondary"
          disabled={busy || data.offset === 0}
          onClick={() => onPage(Math.max(0, data.offset - data.limit))}
        >
          Previous
        </button>
        <button
          className="secondary"
          disabled={busy || data.offset + data.limit >= data.total}
          onClick={() => onPage(data.offset + data.limit)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
function PolicyFields({ value, setValue }) {
  return (
    <div className="form-row">
      <label>
        Requests allowed
        <input
          type="number"
          min="1"
          max="10000"
          required
          value={value.rate_limit}
          onChange={(e) => setValue({ ...value, rate_limit: e.target.value })}
        />
      </label>
      <label>
        Window (seconds)
        <input
          type="number"
          min="1"
          max="3600"
          required
          value={value.window_seconds}
          onChange={(e) => setValue({ ...value, window_seconds: e.target.value })}
        />
      </label>
    </div>
  );
}

export default function Platform() {
  const [user, setUser] = useState(null),
    [booting, setBooting] = useState(true);
  const [tab, setTab] = useState('overview'),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' });
  const [health, setHealth] = useState(null),
    [services, setServices] = useState([]),
    [keys, setKeys] = useState([]),
    [analytics, setAnalytics] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyService),
    [editingService, setEditingService] = useState(null),
    [deleting, setDeleting] = useState(null);
  const [keyForm, setKeyForm] = useState({ name: '', rate_limit: 5, window_seconds: 10 });
  const [editingPolicy, setEditingPolicy] = useState(null),
    [newKey, setNewKey] = useState('');
  const [apiKey, setApiKey] = useState(''),
    [method, setMethod] = useState('GET'),
    [path, setPath] = useState('/users'),
    [body, setBody] = useState('{\n  "name": "Demo student",\n  "role": "Student"\n}');
  const [result, setResult] = useState(null),
    [burst, setBurst] = useState(null);
  const [logs, setLogs] = useState({ logs: [], total: 0, offset: 0, limit: 20 }),
    [audit, setAudit] = useState({ logs: [], total: 0, offset: 0, limit: 20 });
  const [filters, setFilters] = useState(emptyFilters),
    [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const api = useCallback(async (route, options = {}) => {
    const response = await fetch(`/api/platform${route}`, { cache: 'no-store', ...options });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && route !== '/admin/login') {
        setUser(null);
        setNewKey('');
        setApiKey('');
      }
      throw new Error(data.error || `Request failed (${response.status}).`);
    }
    return data;
  }, []);
  const loadHealth = useCallback(async () => {
    const response = await fetch('/api/platform/system/health', { cache: 'no-store' });
    const data = await response.json();
    if (!data.components) {
      setHealth(null);
      throw new Error(data.error || 'Could not load system health.');
    }
    setHealth(data);
  }, []);
  const refresh = useCallback(async () => {
    const [serviceData, keyData, stats] = await Promise.all([
      api('/admin/services'),
      api('/admin/keys'),
      api('/admin/analytics'),
    ]);
    setServices(serviceData.services);
    setKeys(keyData.keys);
    setAnalytics(stats);
    await loadHealth();
  }, [api, loadHealth]);
  useEffect(() => {
    api('/admin/me')
      .then(setUser)
      .catch((err) => {
        if (!err.message.includes('sign in') && !err.message.includes('session')) setError(err.message);
      })
      .finally(() => setBooting(false));
  }, [api]);
  useEffect(() => {
    if (user) refresh().catch((err) => setError(err.message));
  }, [user, refresh]);

  async function action(fn) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }
  async function loadLogs(offset = 0, values = appliedFilters) {
    const query = new URLSearchParams({ offset: String(offset) });
    for (const [name, value] of Object.entries(values)) if (value) query.set(name, value);
    setLogs(await api(`/admin/logs?${query}`));
  }
  async function loadAudit(offset = 0) {
    setAudit(await api(`/admin/audit?offset=${offset}`));
  }
  function navigate(next) {
    setTab(next);
    setError('');
    setNotice('');
    if (next === 'logs') action(() => loadLogs());
    else if (next === 'audit') action(() => loadAudit());
    else if (next === 'overview') action(refresh);
  }
  async function login(event) {
    event.preventDefault();
    await action(async () => {
      setUser(
        await api('/admin/login', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify(credentials),
        }),
      );
      setCredentials({ ...credentials, password: '' });
    });
  }
  async function saveService(event) {
    event.preventDefault();
    await action(async () => {
      await api(`/admin/services${editingService ? `/${editingService}` : ''}`, {
        method: editingService ? 'PUT' : 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(serviceForm),
      });
      setServiceForm(emptyService);
      setEditingService(null);
      await refresh();
      setNotice('Service saved. Routing changes are active immediately.');
    });
  }
  async function createKey(event) {
    event.preventDefault();
    await action(async () => {
      const created = await api('/admin/keys', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          ...keyForm,
          rate_limit: Number(keyForm.rate_limit),
          window_seconds: Number(keyForm.window_seconds),
        }),
      });
      setNewKey(created.key);
      setApiKey(created.key);
      setKeyForm({ ...keyForm, name: '' });
      await refresh();
      setNotice('Key created. Copy it now; it cannot be retrieved later.');
    });
  }
  async function requestOnce() {
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      path.includes('#') ||
      path.includes('\\') ||
      path
        .split('?')[0]
        .split('/')
        .some((part) => part === '.' || part === '..')
    )
      throw new Error('Enter a local route such as /users or /products.');
    const payload = ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(JSON.parse(body)) : undefined;
    const started = performance.now();
    const response = await fetch(`/api/platform/proxy${path}`, {
      method,
      headers: { ...jsonHeaders, 'X-API-Key': apiKey },
      body: payload,
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      status: response.status,
      duration: Math.round(performance.now() - started),
      remaining: response.headers.get('x-ratelimit-remaining'),
      retryAfter: response.headers.get('retry-after'),
      data,
    };
  }
  function send(isBurst = false) {
    action(async () => {
      setBurst(null);
      if (isBurst) {
        if (method !== 'GET') throw new Error('Burst testing is available for GET only.');
        const responses = await Promise.all(Array.from({ length: 10 }, () => requestOnce()));
        setResult(responses.at(-1));
        setBurst({
          accepted: responses.filter((r) => r.status < 400).length,
          limited: responses.filter((r) => r.status === 429).length,
          other: responses.filter((r) => r.status >= 400 && r.status !== 429).length,
        });
      } else setResult(await requestOnce());
      setAnalytics(await api('/admin/analytics'));
    });
  }

  if (booting) return <div className="loading-page">Opening your workspace…</div>;
  if (!user)
    return (
      <div className="login-page">
        <div className="login-intro">
          <span className="brand-mark">A</span>
          <p className="eyebrow">CENTRALIZED API MANAGEMENT</p>
          <h1>
            One gateway.
            <br />A clearer view.
          </h1>
          <p>Connect your services, control access and see what happens to every request.</p>
          <div className="login-tags">
            <span>Service routing</span>
            <span>API keys</span>
            <span>Traffic control</span>
          </div>
          <small>Academic project · Runs on your computer</small>
        </div>
        <div className="login-panel">
          <form className="login-form" onSubmit={login}>
            <p className="eyebrow">ADMIN WORKSPACE</p>
            <h2>Welcome back</h2>
            <p className="subtitle">Sign in to manage your API platform.</p>
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            <label>
              Username
              <input
                autoComplete="username"
                required
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in →'}
            </button>
            <p className="login-help">
              Local demo defaults: <code>admin</code> / <code>local-demo-123</code>
              <br />
              Use your configured credentials if you changed them.
            </p>
          </form>
        </div>
      </div>
    );

  const online = health?.components.filter((item) => item.status === 'online').length || 0;
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="API Platform home">
          <span className="brand-mark">A</span>
          <span>
            API Platform<small>PROJECT CONSOLE</small>
          </span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
              disabled={busy}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="local-dot" /> Local academic project<p>All six phases implemented</p>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Workspace <span className="divider">/</span>{' '}
            <strong>{nav.find(([id]) => id === tab)?.[1]}</strong>
          </span>
          <div className="top-actions">
            <span className="environment">
              {health?.modes.database === 'postgres' ? 'POSTGRES + REDIS' : 'LOCAL DEMO'}
            </span>
            <span>{user.username}</span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  await api('/admin/logout', { method: 'POST' });
                  setUser(null);
                  setApiKey('');
                  setNewKey('');
                  setResult(null);
                  setTab('overview');
                })
              }
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">API MANAGEMENT WORKSPACE</p>
              <h1>{nav.find(([id]) => id === tab)?.[1]}</h1>
              <p className="subtitle">{descriptions[tab]}</p>
            </div>
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  await refresh();
                  if (tab === 'logs') await loadLogs(logs.offset);
                  if (tab === 'audit') await loadAudit(audit.offset);
                })
              }
            >
              {busy ? 'Working…' : '↻ Refresh'}
            </button>
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="notice success" role="status">
              {notice}
            </div>
          )}

          {tab === 'overview' && (
            <>
              <section className="intro">
                <div>
                  <span className="phase-label">READY TO EXPLORE</span>
                  <h2>Your APIs, under one roof.</h2>
                  <p>Register a service, issue a key, then watch your first request arrive.</p>
                  <button className="primary" onClick={() => navigate('playground')}>
                    Open request playground ↗
                  </button>
                </div>
                <div className="intro-meta">
                  <strong>
                    {services.filter((s) => s.enabled).length}
                    <span>services enabled</span>
                  </strong>
                  <strong>
                    {keys.filter((k) => !k.revoked).length}
                    <span>active client keys</span>
                  </strong>
                </div>
              </section>
              <div className="stats-grid">
                {[
                  ['Total requests', analytics?.total],
                  ['Successful', analytics?.successful],
                  ['Blocked · 401 / 429', analytics?.blocked],
                  ['Average response', analytics ? `${analytics.average_ms} ms` : '—'],
                ].map(([title, value]) => (
                  <article className="stat" key={title}>
                    <p>{title}</p>
                    <strong>{value ?? '—'}</strong>
                    <small>All recorded client traffic</small>
                  </article>
                ))}
              </div>
              <section className="section">
                <div className="section-heading">
                  <h2>
                    System health <span className="count">{online}/5 online</span>
                  </h2>
                  <span className="caption">{health && `Checked ${date(health.checkedAt)}`}</span>
                </div>
                <div className="health-grid">
                  {health?.components.map((component) => (
                    <article className="health-card" key={component.id}>
                      <Badge good={component.status === 'online'}>{component.status}</Badge>
                      <h3>{component.name}</h3>
                      <p>
                        {component.latencyMs !== null
                          ? `${component.latencyMs} ms response`
                          : component.status === 'online'
                            ? 'Ready for requests'
                            : 'Connection unavailable'}
                      </p>
                    </article>
                  ))}
                </div>
                {health?.modes.database === 'embedded' && (
                  <p className="mode-note">
                    Local demo: settings and logs are saved in embedded PostgreSQL. Rate counters live in
                    memory and reset when the gateway restarts. Docker mode uses PostgreSQL and Redis.
                  </p>
                )}
              </section>
              <section className="panel section">
                <div className="panel-heading">
                  <h2>Traffic by service</h2>
                  <span className="caption">All recorded requests</span>
                </div>
                {analytics?.services.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Requests</th>
                          <th>Errors / blocked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.services.map((s) => (
                          <tr key={s.name}>
                            <td>{s.name}</td>
                            <td>{s.requests}</td>
                            <td>{s.errors}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>No traffic yet. Create an API key and send your first request.</Empty>
                )}
              </section>
            </>
          )}

          {tab === 'services' && (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <h2>{editingService ? 'Edit service' : 'Register a service'}</h2>
                  <span className="caption">Routes update immediately</span>
                </div>
                <form className="form-grid" onSubmit={saveService}>
                  <label>
                    Service name
                    <input
                      required
                      maxLength="80"
                      placeholder="Users"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Route prefix
                    <input
                      required
                      placeholder="/users"
                      pattern="/[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*"
                      value={serviceForm.prefix}
                      onChange={(e) => setServiceForm({ ...serviceForm, prefix: e.target.value })}
                    />
                  </label>
                  <label className="wide">
                    Backend address
                    <input
                      required
                      type="url"
                      placeholder="http://127.0.0.1:4001"
                      value={serviceForm.base_url}
                      onChange={(e) => setServiceForm({ ...serviceForm, base_url: e.target.value })}
                    />
                    <small>Use the backend origin only. The gateway preserves the route path.</small>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={serviceForm.enabled}
                      onChange={(e) => setServiceForm({ ...serviceForm, enabled: e.target.checked })}
                    />{' '}
                    Enable routing
                  </label>
                  <div className="form-actions">
                    <button className="primary" disabled={busy}>
                      {editingService ? 'Save service' : 'Register service'}
                    </button>
                    {editingService && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          setEditingService(null);
                          setServiceForm(emptyService);
                        }}
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>
              </section>
              <section className="panel section">
                <div className="panel-heading">
                  <h2>
                    Registered services <span className="count">{services.length}</span>
                  </h2>
                </div>
                {services.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Gateway route</th>
                          <th>Backend</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <tr key={service.id}>
                            <td>
                              <strong>{service.name}</strong>
                            </td>
                            <td>
                              <code>/proxy{service.prefix}</code>
                            </td>
                            <td>
                              <code>{service.base_url}</code>
                            </td>
                            <td>
                              <Badge good={service.enabled}>{service.enabled ? 'Enabled' : 'Disabled'}</Badge>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  className="text-button"
                                  disabled={busy}
                                  onClick={() => {
                                    setEditingService(service.id);
                                    setServiceForm({
                                      name: service.name,
                                      prefix: service.prefix,
                                      base_url: service.base_url,
                                      enabled: service.enabled,
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-button danger"
                                  disabled={busy}
                                  onClick={() => setDeleting(service.id)}
                                >
                                  Delete
                                </button>
                              </div>
                              {deleting === service.id && (
                                <div className="confirm-inline">
                                  Remove this route?{' '}
                                  <button
                                    className="text-button danger"
                                    disabled={busy}
                                    onClick={() =>
                                      action(async () => {
                                        await api(`/admin/services/${service.id}`, { method: 'DELETE' });
                                        setDeleting(null);
                                        if (editingService === service.id) {
                                          setEditingService(null);
                                          setServiceForm(emptyService);
                                        }
                                        await refresh();
                                        setNotice('Service removed. Its history is preserved.');
                                      })
                                    }
                                  >
                                    Confirm
                                  </button>
                                  <button className="text-button" onClick={() => setDeleting(null)}>
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>No services registered. Add your first backend above.</Empty>
                )}
              </section>
            </>
          )}

          {tab === 'keys' && (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Create a client key</h2>
                  <span className="caption">Access to all enabled services</span>
                </div>
                <form className="key-form" onSubmit={createKey}>
                  <label>
                    Client name
                    <input
                      required
                      maxLength="80"
                      placeholder="Student demo client"
                      value={keyForm.name}
                      onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                    />
                  </label>
                  <PolicyFields value={keyForm} setValue={setKeyForm} />
                  <button className="primary" disabled={busy}>
                    Create key
                  </button>
                </form>
              </section>
              {newKey && (
                <section className="secret-panel">
                  <h3>Copy your new key</h3>
                  <p>
                    This is its only display. It is also ready in the request playground for this session.
                  </p>
                  <code>{newKey}</code>
                  <div className="row-actions">
                    <button
                      className="secondary"
                      onClick={() =>
                        action(async () => {
                          await navigator.clipboard.writeText(newKey);
                          setNotice('API key copied.');
                        })
                      }
                    >
                      Copy key
                    </button>
                    <button className="text-button" onClick={() => setNewKey('')}>
                      Dismiss
                    </button>
                    <button className="text-button" onClick={() => navigate('playground')}>
                      Try this key ↗
                    </button>
                  </div>
                </section>
              )}
              <section className="panel section">
                <div className="panel-heading">
                  <h2>
                    Client keys <span className="count">{keys.length}</span>
                  </h2>
                </div>
                {keys.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Key hint</th>
                          <th>Limit</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((key) => (
                          <tr key={key.id}>
                            <td>
                              <strong>{key.name}</strong>
                              <small className="block">{date(key.created_at)}</small>
                            </td>
                            <td>
                              <code>••••{key.hint}</code>
                            </td>
                            <td>
                              {key.rate_limit} / {key.window_seconds}s
                            </td>
                            <td>
                              <Badge good={!key.revoked}>{key.revoked ? 'Revoked' : 'Active'}</Badge>
                            </td>
                            <td>
                              {!key.revoked && (
                                <div className="row-actions">
                                  <button
                                    className="text-button"
                                    disabled={busy}
                                    onClick={() => setEditingPolicy(key)}
                                  >
                                    Edit limit
                                  </button>
                                  <button
                                    className="text-button danger"
                                    disabled={busy}
                                    onClick={() =>
                                      action(async () => {
                                        await api(`/admin/keys/${key.id}/revoke`, { method: 'POST' });
                                        await refresh();
                                        setNotice('Key revoked. Calls with this key now return 401.');
                                      })
                                    }
                                  >
                                    Revoke
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>No keys yet. Create one to access the protected services.</Empty>
                )}
              </section>
              {editingPolicy && (
                <section className="panel section">
                  <div className="panel-heading">
                    <h2>Limit for {editingPolicy.name}</h2>
                  </div>
                  <form
                    className="key-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      action(async () => {
                        await api(`/admin/keys/${editingPolicy.id}`, {
                          method: 'PATCH',
                          headers: jsonHeaders,
                          body: JSON.stringify({
                            rate_limit: Number(editingPolicy.rate_limit),
                            window_seconds: Number(editingPolicy.window_seconds),
                          }),
                        });
                        setEditingPolicy(null);
                        await refresh();
                        setNotice('Limit updated. The new policy is active.');
                      });
                    }}
                  >
                    <PolicyFields value={editingPolicy} setValue={setEditingPolicy} />
                    <div className="row-actions">
                      <button className="primary" disabled={busy}>
                        Save limit
                      </button>
                      <button type="button" className="secondary" onClick={() => setEditingPolicy(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </>
          )}

          {tab === 'playground' && (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Compose a request</h2>
                  <span className="caption">Same authentication and limits as real clients</span>
                </div>
                <div className="playground-form">
                  <label>
                    API key
                    <input
                      type="password"
                      autoComplete="off"
                      placeholder="Paste a key, or leave empty to test 401"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </label>
                  <div className="request-line">
                    <label>
                      Method
                      <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        {['GET', 'POST', 'DELETE'].map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grow">
                      Route
                      <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/users" />
                    </label>
                  </div>
                  <div className="quick-routes">
                    Examples:{' '}
                    {services
                      .filter((s) => s.enabled)
                      .map((s) => (
                        <button key={s.id} className="text-button" onClick={() => setPath(s.prefix)}>
                          {s.prefix}
                        </button>
                      ))}
                    <button className="text-button" onClick={() => setPath('/unknown')}>
                      /unknown
                    </button>
                  </div>
                  {method === 'POST' && (
                    <label>
                      JSON body
                      <textarea rows="5" value={body} onChange={(e) => setBody(e.target.value)} />
                    </label>
                  )}
                  <div className="row-actions">
                    <button className="primary" disabled={busy} onClick={() => send(false)}>
                      Send request ↗
                    </button>
                    <button
                      className="secondary"
                      disabled={busy || method !== 'GET'}
                      onClick={() => send(true)}
                    >
                      Send 10 together
                    </button>
                  </div>
                  <p className="caption">
                    For a clean rate-limit demo, create a key with 5 requests per 10 seconds, then send 10
                    together.
                  </p>
                </div>
              </section>
              {burst && (
                <div className="notice success" role="status">
                  Burst complete: {burst.accepted} successful · {burst.limited} rate limited · {burst.other}{' '}
                  other errors
                </div>
              )}
              <section className="panel section">
                <div className="panel-heading">
                  <h2>Response</h2>
                  {result && (
                    <Badge good={result.status < 400}>
                      HTTP {result.status} · {result.duration} ms
                    </Badge>
                  )}
                </div>
                {result ? (
                  <>
                    <div className="response-meta">
                      Remaining: {result.remaining ?? '—'}
                      {result.retryAfter && ` · Retry after ${result.retryAfter}s`}
                    </div>
                    <pre className="json-response">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </>
                ) : (
                  <Empty>Your response will appear here after you send a request.</Empty>
                )}
              </section>
            </>
          )}

          {tab === 'logs' && (
            <>
              <form
                className="filter-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  action(async () => {
                    await loadLogs(0, filters);
                    setAppliedFilters(filters);
                  });
                }}
              >
                <label>
                  Status
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All statuses</option>
                    {[200, 201, 400, 401, 404, 429, 502, 503, 504].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Client
                  <select
                    value={filters.client}
                    onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                  >
                    <option value="">All clients</option>
                    {keys.map((k) => (
                      <option value={k.id} key={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Service
                  <select
                    value={filters.service}
                    onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                  >
                    <option value="">All services</option>
                    {services.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Path contains
                  <input
                    placeholder="/users"
                    value={filters.path}
                    onChange={(e) => setFilters({ ...filters, path: e.target.value })}
                  />
                </label>
                <button className="primary" disabled={busy}>
                  Apply filters
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      setFilters(emptyFilters);
                      setAppliedFilters(emptyFilters);
                      await loadLogs(0, emptyFilters);
                    })
                  }
                >
                  Clear
                </button>
              </form>
              <section className="panel">
                {logs.logs.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Client / service</th>
                          <th>Request</th>
                          <th>Status</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.logs.map((log) => (
                          <tr key={log.id}>
                            <td>{date(log.created_at)}</td>
                            <td>
                              {log.client_name || 'Unauthenticated'}
                              <small className="block">{log.service_name || 'Not routed'}</small>
                            </td>
                            <td>
                              <strong className="method">{log.method}</strong> <code>{log.path}</code>
                            </td>
                            <td>
                              <Badge good={log.status < 400}>{log.status}</Badge>
                            </td>
                            <td>{log.duration_ms} ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>No requests match these filters.</Empty>
                )}
                <Pager data={logs} busy={busy} onPage={(offset) => action(() => loadLogs(offset))} />
              </section>
              <p className="mode-note">
                Request headers, bodies, query strings and raw keys are not stored. Blocked calls may have no
                matched service.
              </p>
            </>
          )}

          {tab === 'audit' && (
            <section className="panel">
              {audit.logs.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.logs.map((log) => (
                        <tr key={log.id}>
                          <td>{date(log.created_at)}</td>
                          <td>{log.actor}</td>
                          <td>
                            <code>{log.action}</code>
                          </td>
                          <td>
                            <code className="audit-details">{JSON.stringify(log.details)}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>No audit events yet.</Empty>
              )}
              <Pager data={audit} busy={busy} onPage={(offset) => action(() => loadAudit(offset))} />
            </section>
          )}

          {tab === 'guide' && (
            <section className="panel guide">
              <h2>A complete demo in a few minutes</h2>
              <ol>
                <li>
                  <strong>Check the foundation.</strong> Overview shows live health checks and the active
                  database/limiter mode.
                </li>
                <li>
                  <strong>Register a service.</strong> Users and Products are seeded on the first run. You can
                  edit their addresses or disable routing in Services.
                </li>
                <li>
                  <strong>Create a key.</strong> In API keys, name a client and allow 5 requests in 10
                  seconds. Copy the key when it appears.
                </li>
                <li>
                  <strong>Send a request.</strong> In Request playground, use GET /users. Expect HTTP 200 and
                  sample users. POST /users with a name creates a temporary sample record.
                </li>
                <li>
                  <strong>Test traffic limits.</strong> Wait 10 seconds, then use Send 10 together. Expect 5
                  successes and 5 responses with 429. Wait again and retry.
                </li>
                <li>
                  <strong>Test access control.</strong> Clear the key to see 401. Revoke a key and try it
                  again to see 401. With a valid key, an unknown route returns 404.
                </li>
                <li>
                  <strong>Inspect the evidence.</strong> Request logs show each call. Audit trail shows
                  service, key and policy changes. Overview summarizes traffic.
                </li>
              </ol>
              <h3>What persists?</h3>
              <p>
                Services, key hashes, admin sessions and logs are saved. Sample users/products reset when
                their service restarts. In local demo mode, rate counters reset when the gateway restarts.
              </p>
              <h3>Request flow</h3>
              <p>
                Client request → API key check → rate limit → route lookup → backend service → response and
                request log.
              </p>
              <h3>Scope</h3>
              <p>
                One admin, JSON APIs and a small local deployment. This academic prototype does not include
                billing, multiple organizations or production scaling.
              </p>
            </section>
          )}
          <footer className="page-footer">
            <span>Centralized API Management Platform</span>
            <span>Built locally. Step by step.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
