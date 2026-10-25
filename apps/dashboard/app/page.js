'use client';
import { useEffect, useState } from 'react';

const initialComponents = [
  ['gateway', 'API gateway', 'Fastify'], ['users', 'Users service', 'Express'],
  ['products', 'Products service', 'Express'], ['postgres', 'PostgreSQL', 'Configuration & logs'], ['redis', 'Redis', 'Rate-limit counters'],
];

export default function Overview() {
  const [system, setSystem] = useState(null);
  const [checking, setChecking] = useState(false);
  const [systemError, setSystemError] = useState('');
  const [response, setResponse] = useState(null);
  const [sending, setSending] = useState(false);

  async function refresh() {
    setChecking(true); setSystemError('');
    try {
      const result = await fetch('/api/gateway/system');
      const data = await result.json();
      if (!data.components) throw new Error(data.error || 'Could not check the system.');
      setSystem(data);
    } catch (error) { setSystem(null); setSystemError(error.message); }
    finally { setChecking(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function sendRequest() {
    setSending(true);
    const start = performance.now();
    try {
      const result = await fetch('/api/gateway/health');
      const data = await result.json();
      setResponse({ code: result.status, duration: Math.round(performance.now() - start), data });
    } catch { setResponse({ code: null, data: { error: 'Request failed. Check that the dashboard is still running.' } }); }
    finally { setSending(false); }
  }

  const online = system?.components.filter((item) => item.status === 'online').length ?? 0;
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="API Platform home"><span className="brand-mark">A</span><span>API Platform<small>PROJECT CONSOLE</small></span></a>
        <div className="nav-label">WORKSPACE</div>
        <a className="nav-active" href="#overview"><span>▦</span> Overview</a>
        <div className="nav-label mt-8">BUILD ROADMAP</div>
        <div className="roadmap"><span>01</span> Foundation <b>Current</b></div>
        <div className="roadmap muted"><span>02</span> Service routing</div>
        <div className="roadmap muted"><span>03</span> API keys</div>
        <div className="roadmap muted"><span>04</span> Traffic limits</div>
        <div className="roadmap muted"><span>05</span> Monitoring</div>
        <div className="roadmap muted"><span>06</span> Final demo</div>
        <div className="sidebar-footer"><span className="local-dot"/> Local workspace<p>Academic project · Phase 1</p></div>
      </aside>

      <main id="overview">
        <header className="topbar"><span>Workspace <span className="mx-3 text-slate-300">/</span> <strong>Overview</strong></span><span className="environment">LOCAL DEVELOPMENT</span></header>
        <div className="content">
          <div className="page-heading"><div><p className="eyebrow">YOUR PLATFORM, AT A GLANCE</p><h1>Platform overview</h1><p className="subtitle">A small start. One place to connect and manage your APIs.</p></div><button className="secondary" onClick={refresh} disabled={checking}>{checking ? 'Checking…' : '↻ Refresh status'}</button></div>

          <section className="intro"><div><span className="phase-label">PHASE 01</span><h2>The foundation is taking shape.</h2><p>Check your services and send your first request to the gateway.<br/>Service registration and routing come next.</p></div><div className="intro-meta"><strong>01 <span>/ 06</span></strong><span>Development phases</span><div className="progress-track"><div/></div></div></section>

          <section className="section" aria-labelledby="health-title"><div className="section-heading"><h2 id="health-title">System health <span className="count">{system ? `${online}/5 online` : 'Not checked'}</span></h2><span className="caption">{checking ? 'Checking connections…' : system ? `Last checked ${new Date(system.checkedAt).toLocaleTimeString()}` : 'Live connection checks'}</span></div>
            {systemError && <p className="notice" role="alert">{systemError}</p>}
            <div className="health-grid">{initialComponents.map(([id, name, technology]) => {
              const component = system?.components.find((item) => item.id === id);
              const status = component?.status || 'unknown';
              return <article className="health-card" key={id}><div className="flex items-center justify-between"><span className="component-icon">{id === 'postgres' || id === 'redis' ? '≡' : '⌘'}</span><span className={`status ${status}`}><i/>{checking ? 'Checking' : status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Unknown'}</span></div><h3>{name}</h3><p>{technology}</p><div className="latency">{component?.latencyMs != null ? `${component.latencyMs} ms response` : status === 'offline' ? 'Connection unavailable' : id === 'gateway' && status === 'online' ? 'Ready for requests' : '—'}</div></article>;
            })}</div>
            {system?.components.some((item) => ['postgres', 'redis'].includes(item.id) && item.status === 'offline') && <p className="notice">Databases offline? Start Docker Desktop, then run <code>npm run db:up</code>. The gateway demo works while databases are offline.</p>}
          </section>

          <section className="section request-section" aria-labelledby="request-title"><div className="section-heading"><div><h2 id="request-title">Try the gateway</h2><p className="subtitle small">Send a real request and inspect the response.</p></div><span className="caption">No API key needed in Phase 1</span></div>
            <div className="request-box"><div className="request-toolbar"><div className="endpoint"><span>GET</span><code>/health</code></div><button className="primary" onClick={sendRequest} disabled={sending}>{sending ? 'Sending…' : 'Send request'} <span aria-hidden="true">↗</span></button></div><div className="response-heading"><span>RESPONSE</span>{response && <span className={response.code === 200 ? 'response-ok' : 'response-error'}>{response.code ? `HTTP ${response.code}` : 'Network error'}{response.duration != null && ` · ${response.duration} ms`}</span>}</div><div className="response-body" aria-live="polite">{response ? <pre>{JSON.stringify(response.data, null, 2)}</pre> : <div className="empty-response"><span aria-hidden="true">{'{ }'}</span><p>Your first response will appear here.</p><small>Click Send request to check the gateway connection.</small></div>}</div></div>
          </section>
          <footer className="page-footer"><span>Centralized API Management Platform</span><span>Built locally. Step by step.</span></footer>
        </div>
      </main>
    </div>
  );
}
