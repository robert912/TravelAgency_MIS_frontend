/**
 * ============================================================
 * PRUEBA DE RENDIMIENTO — ÉPICA 7: Generación de Reportes
 * Stress Testing (Prueba de Estrés)
 * ============================================================
 *
 * Objetivo:
 *   Probar el sistema más allá de su capacidad normal hasta encontrar
 *   el punto de quiebre. Analizar qué sucede en ese punto de falla.
 *
 * Estrategia:
 *   Rampa creciente de usuarios: 10 → 50 → 100 → 200 → 300 → 500 → 700
 *   El sistema se considera "quebrado" cuando la tasa de errores supera el 10%
 *   o el p95 de tiempo de respuesta supera los 10 segundos.
 *
 * Cómo ejecutar:
 *   k6 run tests/k6/stress-test.js
 *   k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/stress-test.js
 *
 * Exportar resultados:
 *   k6 run tests/k6/stress-test.js --out csv=stress-results.csv
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Configuración ──────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BACKEND_URL    || 'http://localhost:8090';
const KC_URL     = __ENV.KEYCLOAK_URL   || 'http://localhost:9090';
const KC_REALM   = __ENV.KC_REALM      || 'travel-realm';
const KC_CLIENT  = __ENV.KC_CLIENT     || 'travel-frontend';
const ADMIN_USER = __ENV.ADMIN_USER     || 'roberto.orellana.t@usach.cl';
const ADMIN_PASS = __ENV.ADMIN_PASSWORD || 'Admin1234';

const START_DATE = '2026-01-01';
const END_DATE   = '2026-12-31';

// ── Métricas personalizadas ───────────────────────────────────────────────────
const requestErrors  = new Counter('stress_request_errors');
const errorRate      = new Rate('stress_error_rate');
const salesLatency   = new Trend('stress_sales_latency', true);
const rankingLatency = new Trend('stress_ranking_latency', true);

// ── Configuración de rampa creciente ─────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50  },   // Calentamiento: 50 usuarios
    { duration: '30s', target: 100  },   // Carga normal: 100 usuarios
    { duration: '30s', target: 300 },   // Carga moderada: 300 usuarios
    { duration: '30s', target: 500 },   // Carga alta: 500 usuarios
    { duration: '30s', target: 800 },   // Carga elevada: 800 usuarios
    { duration: '30s', target: 1000 },   // Estrés: 1000 usuarios
    { duration: '30s', target: 1200 },   // Sobre-estrés: 1200 usuarios (buscando quiebre)
    { duration: '30s', target: 0   },    // Rampa de descenso
  ],
  // Umbrales para determinar el punto de quiebre
  thresholds: {
    // Si p95 supera 5s → el sistema está en punto de quiebre
    'http_req_duration': ['p(95)<5000'],
    // Si tasa de error supera 5% → falla del sistema
    'stress_error_rate': ['rate<0.05'],
  },
};

// ── Setup: obtener token JWT ──────────────────────────────────────────────────
export function setup() {
  const tokenUrl = `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token`;
  const payload  = `grant_type=password&client_id=${KC_CLIENT}&username=${ADMIN_USER}&password=${ADMIN_PASS}&scope=openid`;

  const res = http.post(tokenUrl, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (res.status !== 200) {
    console.error(`[Setup] Error obteniendo token: ${res.status}`);
    return { token: '' };
  }

  const body = JSON.parse(res.body);
  console.log(`[Setup] Token OK — Iniciando prueba de estrés en ${BASE_URL}`);
  return { token: body.access_token };
}

// ── Función principal ─────────────────────────────────────────────────────────
export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type':  'application/json',
  };

  // ── Endpoint: Ventas por período ──────────────────────────────────────────
  const salesRes = http.get(
    `${BASE_URL}/api/reports/sales?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers },
  );

  salesLatency.add(salesRes.timings.duration);

  const salesOk = check(salesRes, {
    'sales → 200 OK':        (r) => r.status === 200,
    'sales → no timeout':    (r) => r.timings.duration < 10000,
    'sales → body válido':   (r) => r.body !== null,
  });

  if (!salesOk) {
    requestErrors.add(1);
    errorRate.add(1);
    if (salesRes.status === 0) {
      console.warn(`[Estrés] TIMEOUT en /api/reports/sales — VU: ${__VU}, iteración: ${__ITER}`);
    }
  } else {
    errorRate.add(0);
  }

  sleep(0.3);

  // ── Endpoint: Ranking de paquetes ─────────────────────────────────────────
  const rankingRes = http.get(
    `${BASE_URL}/api/reports/package-ranking?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers },
  );

  rankingLatency.add(rankingRes.timings.duration);

  const rankingOk = check(rankingRes, {
    'ranking → 200 OK':      (r) => r.status === 200,
    'ranking → no timeout':  (r) => r.timings.duration < 10000,
    'ranking → body válido': (r) => r.body !== null,
  });

  if (!rankingOk) {
    requestErrors.add(1);
    errorRate.add(1);
    if (rankingRes.status === 0) {
      console.warn(`[Estrés] TIMEOUT en /api/reports/package-ranking — VU: ${__VU}, iteración: ${__ITER}`);
    }
  } else {
    errorRate.add(0);
  }

  sleep(0.3);
}

// ── Teardown ──────────────────────────────────────────────────────────────────
export function teardown() {
  console.log('\n=== RESUMEN STRESS TESTING — ÉPICA 7 ===');
  console.log('Rampa: 50 → 100 → 300 → 500 → 800 → 1000 → 1200 usuarios');
  console.log('Punto de quiebre: revisar en el gráfico cuándo error_rate > 5% o p95 > 5s');
  console.log('Exportar datos: agregar --out csv=stress-results.csv al comando k6');
}
