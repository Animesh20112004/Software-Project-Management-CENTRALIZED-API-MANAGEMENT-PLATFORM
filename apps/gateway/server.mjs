import { buildGateway } from './app.mjs';
import { validateEnvironment } from './config.mjs';

validateEnvironment();

const isProduction = process.env.NODE_ENV === 'production';
const host = process.env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1');
const port = Number(process.env.PORT || process.env.GATEWAY_PORT || 4000);

const app = await buildGateway({ logger: true });

try {
  await app.listen({ port, host });
  console.log(`API Gateway running at http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log(`API Gateway received ${signal}, shutting down...`);
    await app.close();
  });
}
