/**
 * ============================================================
 * PRUEBA DE RENDIMIENTO — ÉPICA 7: Generación de Reportes
 * Volume Testing (Prueba de Volumen)
 * ============================================================
 *
 * Objetivo:
 *   Evaluar cómo se comporta el sistema cuando las tablas de la base de datos
 *   tienen diferentes volúmenes de datos. Se prueban distintos rangos de fechas
 *   que cubren mayor cantidad de registros históricos en la BD.
 *
 * Estrategia:
 *   Simular consultas sobre distintos volúmenes de datos usando rangos de fechas
 *   progresivamente más amplios (mayor cobertura = más datos procesados por la BD).
 *   Cada etapa combina un volumen de datos con un número fijo de usuarios concurrentes.
 *
 * Instrucción adicional:
 *   Para un test de volumen real, poblar la BD con scripts SQL antes de ejecutar:
 *     500 registros   → rango_1 (fechas recientes)
 *     1000 registros  → rango_2
 *     5000 registros  → rango_3
 *     10000 registros → rango_4
 *
 * Cómo ejecutar:
 *   k6 run tests/k6/volume-test.js                       → corre AMBOS endpoints (8 escenarios)
 *   k6 run -e ENDPOINT=sales tests/k6/volume-test.js      → corre SOLO /sales (4 escenarios)
 *   k6 run -e ENDPOINT=ranking tests/k6/volume-test.js    → corre SOLO /package-ranking (4 escenarios)
 *   k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/volume-test.js --out csv=volume-results.csv
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
const ADMIN_USER = __ENV.ADMIN_USER    || 'admin';
const ADMIN_PASS = __ENV.ADMIN_PASSWORD || 'admin123';

// Usuarios concurrentes fijos por escenario de volumen (ajustar según necesidad)
const VUS = 50;

// Qué endpoint(s) correr: 'sales' | 'ranking' | 'all' (default)
const ENDPOINT = (__ENV.ENDPOINT || 'all').toLowerCase();
const RUN_SALES   = ENDPOINT === 'all' || ENDPOINT === 'sales';
const RUN_RANKING = ENDPOINT === 'all' || ENDPOINT === 'ranking';

// ── Rangos de fechas que cubren distintos volúmenes de datos en BD ─────────────
// Ajustar estos rangos según la antigüedad de los datos en tu BD
const DATE_RANGES = {
  500:   { start: '2026-06-01', end: '2026-06-30' },  // ~500 registros  (último mes)
  1000:  { start: '2026-01-01', end: '2026-06-30' },  // ~1000 registros (6 meses)
  5000:  { start: '2025-01-01', end: '2026-06-30' },  // ~5000 registros (18 meses)
  10000: { start: '2023-01-01', end: '2026-06-30' },  // ~10000 registros (histórico completo)
};
const VOLUMES = [500, 1000, 5000, 10000];
const STEP_SECONDS = 40; // 30s de duración + 10s de margen

// ── Métricas personalizadas ───────────────────────────────────────────────────
const errorRate = new Rate('volume_error_rate');
const volErrors = new Counter('volume_errors');

// ── Métricas por volumen × endpoint (para el cuadro comparativo del informe) ──
const latencyByScenario = {};
const errorRateByScenario = {};
for (const volumen of VOLUMES) {
  if (RUN_SALES) {
    latencyByScenario[`volumen_${volumen}_sales`]    = new Trend(`volume_${volumen}_sales_latency`, true);
    errorRateByScenario[`volumen_${volumen}_sales`]  = new Rate(`volume_error_rate_${volumen}_sales`);
  }
  if (RUN_RANKING) {
    latencyByScenario[`volumen_${volumen}_ranking`]   = new Trend(`volume_${volumen}_ranking_latency`, true);
    errorRateByScenario[`volumen_${volumen}_ranking`] = new Rate(`volume_error_rate_${volumen}_ranking`);
  }
}

// ── Escenarios: mismo # de usuarios, distintos volúmenes de datos, por endpoint
function buildScenarios() {
  const scenarios = {};
  let t = 0;

  for (const volumen of VOLUMES) {
    if (RUN_SALES) {
      scenarios[`volumen_${volumen}_sales`] = {
        executor: 'constant-vus',
        vus: VUS,
        duration: '30s',
        startTime: `${t}s`,
        env: { VOLUMEN: String(volumen) },
        tags: { volumen: String(volumen), endpoint: 'sales' },
        exec: 'testSales',
      };
      t += STEP_SECONDS;
    }
    if (RUN_RANKING) {
      scenarios[`volumen_${volumen}_ranking`] = {
        executor: 'constant-vus',
        vus: VUS,
        duration: '30s',
        startTime: `${t}s`,
        env: { VOLUMEN: String(volumen) },
        tags: { volumen: String(volumen), endpoint: 'ranking' },
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
    // Ningún escenario de volumen debe superar 5s en p95
    'http_req_duration': ['p(95)<5000'],
    'volume_error_rate': ['rate<0.05'],
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
    console.error(`[Setup] No se pudo obtener token: ${res.status} → ${res.body}`);
    return { token: '' };
  }

  const body = JSON.parse(res.body);
  console.log(`[Setup] Token obtenido. Iniciando Volume Testing contra ${BASE_URL}`);
  return { token: body.access_token };
}

// ── Escenario: SOLO ventas por período (según volumen) ────────────────────────
export function testSales(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type':  'application/json',
  };
  const scenarioName = exec.scenario.name;
  const volumen = __ENV.VOLUMEN;
  const range = DATE_RANGES[volumen];

  const salesRes = http.get(
    `${BASE_URL}/api/reports/sales?startDate=${range.start}&endDate=${range.end}`,
    { headers, tags: { volumen, endpoint: 'sales' } },
  );

  latencyByScenario[scenarioName].add(salesRes.timings.duration);

  const salesOk = check(salesRes, {
    [`sales [${volumen}] → 200 OK`]:      (r) => r.status === 200,
    [`sales [${volumen}] → no timeout`]:  (r) => r.timings.duration < 5000,
    [`sales [${volumen}] → body válido`]: (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return r.status === 200; }
    },
  });

  if (!salesOk) {
    volErrors.add(1);
    errorRate.add(1);
    errorRateByScenario[scenarioName].add(1);
    console.warn(`[Volumen ${volumen}] Error en /sales → status: ${salesRes.status}, tiempo: ${salesRes.timings.duration}ms`);
  } else {
    errorRate.add(0);
    errorRateByScenario[scenarioName].add(0);
  }

  sleep(0.5);
}

// ── Escenario: SOLO ranking de paquetes (según volumen) ───────────────────────
export function testRanking(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type':  'application/json',
  };
  const scenarioName = exec.scenario.name;
  const volumen = __ENV.VOLUMEN;
  const range = DATE_RANGES[volumen];

  const rankingRes = http.get(
    `${BASE_URL}/api/reports/package-ranking?startDate=${range.start}&endDate=${range.end}`,
    { headers, tags: { volumen, endpoint: 'ranking' } },
  );

  latencyByScenario[scenarioName].add(rankingRes.timings.duration);

  const rankingOk = check(rankingRes, {
    [`ranking [${volumen}] → 200 OK`]:      (r) => r.status === 200,
    [`ranking [${volumen}] → no timeout`]:  (r) => r.timings.duration < 5000,
    [`ranking [${volumen}] → body válido`]: (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return r.status === 200; }
    },
  });

  if (!rankingOk) {
    volErrors.add(1);
    errorRate.add(1);
    errorRateByScenario[scenarioName].add(1);
    console.warn(`[Volumen ${volumen}] Error en /ranking → status: ${rankingRes.status}, tiempo: ${rankingRes.timings.duration}ms`);
  } else {
    errorRate.add(0);
    errorRateByScenario[scenarioName].add(0);
  }

  sleep(0.5);
}
