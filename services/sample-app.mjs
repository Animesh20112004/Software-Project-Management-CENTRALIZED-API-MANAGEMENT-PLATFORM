import express from 'express';

export function createSampleApp(name, initialItems) {
  const app = express();
  const items = initialItems.map((item) => ({ ...item }));
  let nextId = Math.max(0, ...items.map((item) => item.id)) + 1;
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: name }));
  app.get(`/${name}`, (req, res) => {
    const search = String(req.query.q || '').toLowerCase();
    res.json({ service: name, data: items.filter((item) => item.name.toLowerCase().includes(search)) });
  });
  app.get(`/${name}/:id`, (req, res) => {
    const item = items.find((item) => item.id === Number(req.params.id));
    return item
      ? res.json({ service: name, data: item })
      : res.status(404).json({ error: 'Record not found.' });
  });
  app.post(`/${name}`, (req, res) => {
    if (typeof req.body?.name !== 'string' || !req.body.name.trim() || req.body.name.length > 100)
      return res.status(400).json({ error: 'A name of 1 to 100 characters is required.' });
    const field = name === 'users' ? 'role' : 'category';
    const item = {
      id: nextId++,
      name: req.body.name.trim(),
      [field]: String(req.body[field] || 'Demo').slice(0, 100),
    };
    items.push(item);
    return res.status(201).json({ service: name, data: item });
  });
  app.delete(`/${name}/:id`, (req, res) => {
    const index = items.findIndex((item) => item.id === Number(req.params.id));
    if (index < 0) return res.status(404).json({ error: 'Record not found.' });
    items.splice(index, 1);
    return res.json({ ok: true });
  });
  app.use((_req, res) => res.status(404).json({ error: 'Sample endpoint not found.' }));
  app.use((err, _req, res, _next) =>
    res.status(err.status || 500).json({ error: 'Invalid sample service request.' }),
  );
  return app;
}
export function runSampleService(name, items, port) {
  const host = process.env.HOST || '127.0.0.1';
  const server = createSampleApp(name, items).listen(port, host, () =>
    console.log(`${name} service: http://${host}:${port}`),
  );
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
