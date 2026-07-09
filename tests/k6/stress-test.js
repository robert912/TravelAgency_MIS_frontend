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
 *   Niveles crecientes de usuarios, cada uno como escenario separado:
 *   50 → 100 → 150 → 200 → 250 → 300 → 400
 *   Cada nivel imprime su propio p95 / error_rate (métricas CUSTOM
 *   stress_duration_N_<endpoint> y stress_error_rate_N_<endpoint>), así
 *   se puede identificar en QUÉ nivel específico ocurre el quiebre — no
 *   solo un agregado global.
 *   El sistema se considera "quebrado" en el primer nivel donde la tasa de
 *   errores supera el 5% o el p95 de tiempo de respuesta supera los 5s.
 *
 * Cómo ejecutar:
 *   k6 run tests/k6/stress-test.js                       → corre AMBOS endpoints (14 escenarios)
 *   k6 run -e ENDPOINT=sales tests/k6/stress-test.js      → corre SOLO /sales (7 escenarios)
 *   k6 run -e ENDPOINT=ranking tests/k6/stress-test.js    → corre SOLO /package-ranking (7 escenarios)
 *   k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/stress-test.js
 *
 * Exportar resultados:
 *   k6 run tests/k6/stress-test.js --out csv=stress-results.csv
 */

import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Configuración ──────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BACKEND_URL    || 'http://localhost:8090';
const KC_URL     = __ENV.KEYCLOAK_URL   || 'http://localhost:9090';
const KC_REALM   = __ENV.KC_REALM      || 'travel-realm';
const KC_CLIENT  = __ENV.KC_CLIENT     || 'travel-frontend';
const ADMIN_USER = __ENV.ADMIN_USER     || 'roberto.orellana.t@usach.cl';
const ADMIN_PASS = __ENV.ADMIN_PASSWORD || 'Admin1234';

const START_DATE = '2026-06-01';
const END_DATE   = '2026-06-30';

// Qué endpoint(s) correr: 'sales' | 'ranking' | 'all' (default)
const ENDPOINT = (__ENV.ENDPOINT || 'all').toLowerCase();
const RUN_SALES   = ENDPOINT === 'all' || ENDPOINT === 'sales';
const RUN_RANKING = ENDPOINT === 'all' || ENDPOINT === 'ranking';

// ── Métricas personalizadas ───────────────────────────────────────────────────
const requestErrors  = new Counter('stress_request_errors');
const errorRate      = new Rate('stress_error_rate');
const salesLatency   = new Trend('stress_sales_latency', true);
const rankingLatency = new Trend('stress_ranking_latency', true);

// ── Escenarios de estrés: un escenario por (nivel × endpoint), secuenciales ───
// Se arman dinámicamente según ENDPOINT para que, si solo corres uno de los
// dos endpoints, no queden huecos de tiempo muerto entre escenarios.
const LEVELS = [50, 100, 150, 200, 250, 300, 400];
const STEP_SECONDS = 35; // 30s de duración + 5s de margen

// ── Métricas por nivel × endpoint (para ubicar el punto de quiebre exacto) ────
const durationByScenario = {};
const errorRateByScenario = {};
for (const level of LEVELS) {
  if (RUN_SALES) {
    durationByScenario[`estres_${level}_sales`]  = new Trend(`stress_duration_${level}_sales`, true);
    errorRateByScenario[`estres_${level}_sales`] = new Rate(`stress_error_rate_${level}_sales`);
  }
  if (RUN_RANKING) {
    durationByScenario[`estres_${level}_ranking`]  = new Trend(`stress_duration_${level}_ranking`, true);
    errorRateByScenario[`estres_${level}_ranking`] = new Rate(`stress_error_rate_${level}_ranking`);
  }
}

function buildScenarios() {
  const scenarios = {};
  let t = 0;

  for (const level of LEVELS) {
    if (RUN_SALES) {
      scenarios[`estres_${level}_sales`] = {
        executor: 'constant-vus',
        vus: level,
        duration: '30s',
        startTime: `${t}s`,
        exec: 'testSales',
      };
      t += STEP_SECONDS;
    }
    if (RUN_RANKING) {
      scenarios[`estres_${level}_ranking`] = {
        executor: 'constant-vus',
        vus: level,
        duration: '30s',
        startTime: `${t}s`,
        exec: 'testRanking',
      };
      t += STEP_SECONDS;
    }
  }
  return scenarios;
}

export const options = {
  scenarios: buildScenarios(),
  // Umbrales para determinar el punto de quiebre (agregado global)
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

// ── Escenario: SOLO ventas por período ────────────────────────────────────────
export function testSales(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type':  'application/json',
  };
  const scenarioName = exec.scenario.name;

  const salesRes = http.get(
    `${BASE_URL}/api/reports/sales?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers, tags: { endpoint: 'sales' } },
  );

  salesLatency.add(salesRes.timings.duration);
  durationByScenario[scenarioName].add(salesRes.timings.duration);

  const salesOk = check(salesRes, {
    'sales → 200 OK':        (r) => r.status === 200,
    'sales → no timeout':    (r) => r.timings.duration < 10000,
    'sales → body válido':   (r) => r.body !== null,
  });

  if (!salesOk) {
    requestErrors.add(1);
    errorRate.add(1);
    errorRateByScenario[scenarioName].add(1);
    if (salesRes.status === 0) {
      console.warn(`[Estrés] TIMEOUT en /api/reports/sales — VU: ${__VU}, iteración: ${__ITER}`);
    }
  } else {
    errorRate.add(0);
    errorRateByScenario[scenarioName].add(0);
  }

  sleep(0.3);
}

// ── Escenario: SOLO ranking de paquetes ───────────────────────────────────────
export function testRanking(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type':  'application/json',
  };
  const scenarioName = exec.scenario.name;

  const rankingRes = http.get(
    `${BASE_URL}/api/reports/package-ranking?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers, tags: { endpoint: 'ranking' } },
  );

  rankingLatency.add(rankingRes.timings.duration);
  durationByScenario[scenarioName].add(rankingRes.timings.duration);

  const rankingOk = check(rankingRes, {
    'ranking → 200 OK':      (r) => r.status === 200,
    'ranking → no timeout':  (r) => r.timings.duration < 10000,
    'ranking → body válido': (r) => r.body !== null,
  });

  if (!rankingOk) {
    requestErrors.add(1);
    errorRate.add(1);
    errorRateByScenario[scenarioName].add(1);
    if (rankingRes.status === 0) {
      console.warn(`[Estrés] TIMEOUT en /api/reports/package-ranking — VU: ${__VU}, iteración: ${__ITER}`);
    }
  } else {
    errorRate.add(0);
    errorRateByScenario[scenarioName].add(0);
  }

  sleep(0.3);
}
