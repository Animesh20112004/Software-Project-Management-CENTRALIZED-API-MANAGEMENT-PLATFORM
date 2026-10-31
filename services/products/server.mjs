import { runSampleService } from '../sample-app.mjs';
runSampleService(
  'products',
  [
    { id: 1, name: 'Notebook', category: 'Stationery' },
    { id: 2, name: 'Desk lamp', category: 'Study' },
  ],
  Number(process.env.PRODUCTS_PORT || 4002),
);
