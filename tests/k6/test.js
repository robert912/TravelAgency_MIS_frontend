import http from 'k6/http';
import { check, sleep } from 'k6';

// ── Configuración ──────────────────────────────────────────────────────────────
const BASE_URL   = 'http://localhost:8090';
const KC_URL     = 'http://localhost:9090';
const ADMIN_USER = 'roberto.orellana.t@usach.cl';
const ADMIN_PASS = 'Admin1234';
const START_DATE = '2026-01-01';
const END_DATE   = '2026-12-31';

// ── Escenario: solo 200 usuarios ──────────────────────────────────────────────
export const options = {
  vus: 200,
  duration: '30s',
  thresholds: {
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed':   ['rate<0.05'],
  },
};

// ── Setup: obtener token ──────────────────────────────────────────────────────
export function setup() {
  const res = http.post(
    `${KC_URL}/realms/travel-realm/protocol/openid-connect/token`,
    `grant_type=password&client_id=travel-frontend&username=${ADMIN_USER}&password=${ADMIN_PASS}&scope=openid`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return { token: JSON.parse(res.body).access_token };
}

// ── Test principal ────────────────────────────────────────────────────────────
export default function (data) {
  const headers = { 'Authorization': `Bearer ${data.token}` };

  // Reporte de ventas
  const salesRes = http.get(
    `${BASE_URL}/api/reports/sales?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers }
  );
  check(salesRes, { 'sales: status 200': (r) => r.status === 200 });
  sleep(0.5);

  // Ranking de paquetes
  const rankingRes = http.get(
    `${BASE_URL}/api/reports/package-ranking?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers }
  );
  check(rankingRes, { 'ranking: status 200': (r) => r.status === 200 });
  sleep(0.5);
}