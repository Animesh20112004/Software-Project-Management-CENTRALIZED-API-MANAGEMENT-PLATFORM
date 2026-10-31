import { buildGateway } from './app.mjs';
const app = await buildGateway({ logger: true });
try {
  await app.listen({ port: Number(process.env.GATEWAY_PORT || 4000), host: process.env.HOST || '127.0.0.1' });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    await app.close();
  });
