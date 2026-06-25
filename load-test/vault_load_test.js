import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const uploadDuration   = new Trend('upload_duration',   true);
const downloadDuration = new Trend('download_duration', true);
const searchDuration   = new Trend('search_duration',   true);
const uploadsTotal     = new Counter('uploads_total');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m',  target: 300 },
    { duration: '30s', target: 500 },
    { duration: '1m',  target: 500 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    http_req_duration:  ['p(99)<2000'],
    upload_duration:    ['p(95)<1000'],
    download_duration:  ['p(95)<500' ],
    search_duration:    ['p(95)<300' ],
  },
};

const BASE_URL = 'http://localhost:5000/api/v1';

export default function () {
  let token = globalThis[`vu_token_${__VU}`];

  if (__ITER === 0) {
    const email    = `vu-${__VU}-${Date.now()}@vault.dev`;
    const password = 'LoadTest@123';

    const regRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      name: `VU ${__VU}`, email, password,
    }), { headers: { 'Content-Type': 'application/json' } });

    if (regRes.status !== 201) return;

    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email, password,
    }), { headers: { 'Content-Type': 'application/json' } });

    token = loginRes.json('data.accessToken');
    globalThis[`vu_token_${__VU}`] = token;
    globalThis[`vu_iter_${__VU}`]  = 0;
  }

  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
  };

  // 1 — Auth
  group('auth', () => {
    const res = http.get(`${BASE_URL}/auth/me`, { headers });
    check(res, { 'me: status 200': (r) => r.status === 200 });
  });

  sleep(0.1);

  // 2 — Upload (unique per VU+iteration+random)
  let fileId;
  group('upload', () => {
    const uid     = `${__VU}-${__ITER}-${Date.now()}-${Math.random()}`;
    const content = `secure-vault-load-test-${uid}`;
    const file    = http.file(content, `file-${uid}.txt`, 'text/plain; charset=utf-8');

    const start = new Date();
    const res   = http.post(`${BASE_URL}/files/upload`, { file }, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    uploadDuration.add(new Date() - start);

    const ok = check(res, {
      'upload: status 201':  (r) => r.status === 201,
      'upload: has file id': (r) => r.json('data.file.id') !== undefined,
    });
    if (ok) {
      fileId = res.json('data.file.id');
      uploadsTotal.add(1);
    }
  });

  sleep(0.1);

  // 3 — Search
  group('search', () => {
    const start = new Date();
    const res   = http.get(`${BASE_URL}/files/search?q=file&page=1&limit=10`, { headers });
    searchDuration.add(new Date() - start);
    check(res, {
      'search: status 200':    (r) => r.status === 200,
      'search: returns array': (r) => Array.isArray(r.json('data')),
    });
  });

  sleep(0.1);

  // 4 — Download + Delete
  if (fileId) {
    group('download', () => {
      const start = new Date();
      const res   = http.get(`${BASE_URL}/files/${fileId}/download`, { headers });
      downloadDuration.add(new Date() - start);
      check(res, {
        'download: status 200': (r) => r.status === 200,
        'download: has url':    (r) => r.json('data.url') !== undefined,
      });
    });

    sleep(0.1);

    group('delete', () => {
      http.del(`${BASE_URL}/files/${fileId}`, null, { headers });
    });
  }

  sleep(0.2);
}
