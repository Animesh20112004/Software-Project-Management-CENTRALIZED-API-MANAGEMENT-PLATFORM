import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const accepted = new Counter('allowed_requests');
const blocked = new Counter('limited_requests');
const base = __ENV.GATEWAY_URL || 'http://127.0.0.1:4000';
export const options = {
  scenarios: { burst: { executor: 'shared-iterations', vus: 10, iterations: 10, maxDuration: '20s' } },
  thresholds: { checks: ['rate==1'], allowed_requests: ['count==5'], limited_requests: ['count==5'] },
};
export function setup() {
  const login = http.post(
    `${base}/admin/login`,
    JSON.stringify({
      username: __ENV.ADMIN_USER || 'admin',
      password: __ENV.ADMIN_PASSWORD || 'local-demo-123',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (login.status !== 200) throw new Error('Admin login failed.');
  const token = login.cookies.platform_session[0].value;
  const created = http.post(
    `${base}/admin/keys`,
    JSON.stringify({ name: 'k6 load test', rate_limit: 5, window_seconds: 60 }),
    { headers: { 'Content-Type': 'application/json', Cookie: `platform_session=${token}` } },
  );
  if (created.status !== 201) throw new Error('Could not create test API key.');
  return { key: created.json('key'), id: created.json('id'), token };
}
export default function (data) {
  const response = http.get(`${base}/proxy/users`, {
    headers: { 'X-API-Key': data.key },
    responseCallback: http.expectedStatuses(200, 429),
  });
  check(response, { 'request allowed or limited': (r) => r.status === 200 || r.status === 429 });
  accepted.add(response.status === 200 ? 1 : 0);
  blocked.add(response.status === 429 ? 1 : 0);
}
export function teardown(data) {
  const headers = { Cookie: `platform_session=${data.token}` };
  http.post(`${base}/admin/keys/${data.id}/revoke`, null, { headers });
  http.post(`${base}/admin/logout`, null, { headers });
}
