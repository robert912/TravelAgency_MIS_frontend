/**
 * ============================================================
 * PRUEBA DE RENDIMIENTO — ÉPICA 7: Generación de Reportes
 * Load Testing (Prueba de Carga)
 * ============================================================
 *
 * Objetivo:
 *   Probar los endpoints de reportes con distintos niveles de carga
 *   (usuarios concurrentes) para conocer el comportamiento del sistema
 *   en cada escenario.
 *
 * Endpoints bajo prueba:
 *   GET /api/reports/sales?startDate=...&endDate=...
 *   GET /api/reports/package-ranking?startDate=...&endDate=...
 * 
 * Cómo ejecutar:
 *   k6 run tests/k6/load-test.js                       → corre AMBOS endpoints (8 escenarios)
 *   k6 run -e ENDPOINT=sales tests/k6/load-test.js      → corre SOLO /sales (4 escenarios)
 *   k6 run -e ENDPOINT=ranking tests/k6/load-test.js    → corre SOLO /package-ranking (4 escenarios)
 *
 * IMPORTANTE:
 *   Los reportes requieren rol "Admin" en Keycloak.
 *   Configurar KEYCLOAK_URL, ADMIN_USER y ADMIN_PASSWORD como
 *   variables de entorno K6 (-e FLAG=value) o usar el valor por defecto.
 */

import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Configuración ──────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BACKEND_URL    || 'http://localhost:8090';
const KC_URL     = __ENV.KEYCLOAK_URL   || 'http://localhost:9090';
const KC_REALM   = __ENV.KC_REALM       || 'travel-realm';
const KC_CLIENT  = __ENV.KC_CLIENT      || 'travel-frontend';
const ADMIN_USER = __ENV.ADMIN_USER     || 'roberto.orellana.t@usach.cl';
const ADMIN_PASS = __ENV.ADMIN_PASSWORD || 'Admin1234';

// Período de reporte a consultar
const START_DATE = '2026-06-01';
const END_DATE   = '2026-06-30';

// Qué endpoint(s) correr: 'sales' | 'ranking' | 'all' (default)
const ENDPOINT = (__ENV.ENDPOINT || 'all').toLowerCase();
const RUN_SALES   = ENDPOINT === 'all' || ENDPOINT === 'sales';
const RUN_RANKING = ENDPOINT === 'all' || ENDPOINT === 'ranking';

// ── Métricas generales (agregado de todo el test) ─────────────────────────────
const salesErrors        = new Counter('sales_report_errors');
const rankingErrors      = new Counter('ranking_report_errors');
const salesDuration      = new Trend('sales_report_duration', true);
const rankingDuration    = new Trend('ranking_report_duration', true);
const errorRate          = new Rate('error_rate');

// ── Métricas por escenario (para el cuadro comparativo del informe) ───────────
const durationByScenario = {
  carga_10_sales:    new Trend('duration_10_sales', true),
  carga_10_ranking:  new Trend('duration_10_ranking', true),
  carga_50_sales:    new Trend('duration_50_sales', true),
  carga_50_ranking:  new Trend('duration_50_ranking', true),
  carga_100_sales:   new Trend('duration_100_sales', true),
  carga_100_ranking: new Trend('duration_100_ranking', true),
  carga_200_sales:   new Trend('duration_200_sales', true),
  carga_200_ranking: new Trend('duration_200_ranking', true),
};
const errorRateByScenario = {
  carga_10_sales:    new Rate('error_rate_10_sales'),
  carga_10_ranking:  new Rate('error_rate_10_ranking'),
  carga_50_sales:    new Rate('error_rate_50_sales'),
  carga_50_ranking:  new Rate('error_rate_50_ranking'),
  carga_100_sales:   new Rate('error_rate_100_sales'),
  carga_100_ranking: new Rate('error_rate_100_ranking'),
  carga_200_sales:   new Rate('error_rate_200_sales'),
  carga_200_ranking: new Rate('error_rate_200_ranking'),
};

// ── Escenarios de carga: un escenario por (nivel × endpoint), secuenciales ────
// Se arman dinámicamente según ENDPOINT para que, si solo corres uno de los
// dos endpoints, no queden huecos de tiempo muerto entre escenarios.
const LEVELS = [10, 50, 100, 200];
const STEP_SECONDS = 35; // 30s de duración + 5s de margen

function buildScenarios() {
  const scenarios = {};
  let t = 0;

  for (const level of LEVELS) {
    if (RUN_SALES) {
      scenarios[`carga_${level}_sales`] = {
        executor: 'constant-vus',
        vus: level,
        duration: '30s',
        startTime: `${t}s`,
        exec: 'testSales',
      };
      t += STEP_SECONDS;
    }
    if (RUN_RANKING) {
      scenarios[`carga_${level}_ranking`] = {
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
  thresholds: {
    // 95% de las peticiones deben responder en menos de 3 segundos
    'http_req_duration': ['p(95)<3000'],
    // Tasa de error menor al 1%
    'error_rate': ['rate<0.01'],
  },
};

// ── Setup: obtener token JWT de Keycloak ─────────────────────────────────────
export function setup() {
  const tokenUrl = `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token`;
  const payload  = `grant_type=password&client_id=${KC_CLIENT}&username=${ADMIN_USER}&password=${ADMIN_PASS}&scope=openid`;

  const res = http.post(tokenUrl, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (res.status !== 200) {
    console.error(`[Setup] Error obteniendo token: ${res.status} - ${res.body}`);
    // Retornar token vacío para que los tests fallen con 401 (documentable)
    return { token: '' };
  }

  const body = JSON.parse(res.body);
  console.log(`[Setup] Token obtenido correctamente (expira en ${body.expires_in}s)`);
  return { token: body.access_token };
}

// ── Escenario: SOLO reporte de ventas ─────────────────────────────────────────
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

  salesDuration.add(salesRes.timings.duration);
  durationByScenario[scenarioName].add(salesRes.timings.duration);

  const salesOk = check(salesRes, {
    'sales: status 200': (r) => r.status === 200,
    'sales: respuesta no vacía': (r) => r.body && r.body.length > 2,
    'sales: respuesta JSON válida': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });

  if (!salesOk) {
    salesErrors.add(1);
    errorRate.add(1);
    errorRateByScenario[scenarioName].add(1);
  } else {
    errorRate.add(0);
    errorRateByScenario[scenarioName].add(0);
  }

  sleep(0.5);
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

  rankingDuration.add(rankingRes.timings.duration);
  durationByScenario[scenarioName].add(rankingRes.timings.duration);

  const rankingOk = check(rankingRes, {
    'ranking: status 200': (r) => r.status === 200,
    'ranking: respuesta no vacía': (r) => r.body && r.body.length > 2,
    'ranking: respuesta JSON válida': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });

  if (!rankingOk) {
    rankingErrors.add(1);
    errorRate.add(1);
    errorRateByScenario[scenarioName].add(1);
  } else {
    errorRate.add(0);
    errorRateByScenario[scenarioName].add(0);
  }

  sleep(0.5);
}

