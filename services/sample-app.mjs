import express from 'express';

export function createSampleApp(name, items) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: name }));
  app.get(`/${name}`, (_req, res) => res.json({ service: name, data: items }));
  return app;
}

export function runSampleService(name, items, port) {
  const server = createSampleApp(name, items).listen(port, '127.0.0.1', () => {
    console.log(`${name} service: http://127.0.0.1:${port}`);
  });
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
