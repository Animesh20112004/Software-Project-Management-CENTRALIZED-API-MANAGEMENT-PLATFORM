import { runSampleService } from '../sample-app.mjs';
runSampleService('users', [
  { id: 1, name: 'Asha', role: 'Student' },
  { id: 2, name: 'Rohan', role: 'Developer' },
], Number(process.env.USERS_PORT || 4001));
