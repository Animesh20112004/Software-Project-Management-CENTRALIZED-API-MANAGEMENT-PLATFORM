async function measure(id, name, check) {
  const started = performance.now();
  try {
    await check();
    return { id, name, status: 'online', latencyMs: Math.round(performance.now() - started) };
  } catch {
    return { id, name, status: 'offline', latencyMs: null };
  }
}
export async function checkDependencies(config, store, limiter) {
  const httpCheck = async (url) => {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
    if (!response.ok || (await response.json()).status !== 'ok') throw new Error('Unhealthy');
  };
  return Promise.all([
    measure('users', 'Users service', () => httpCheck(config.usersUrl)),
    measure('products', 'Products service', () => httpCheck(config.productsUrl)),
    measure('database', store.mode === 'embedded' ? 'Embedded PostgreSQL' : 'PostgreSQL', () =>
      store.query('SELECT 1'),
    ),
    measure('limiter', limiter.mode === 'memory' ? 'Local rate limiter' : 'Redis', () => limiter.ping()),
  ]);
}
