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
 *   k6 run tests/k6/volume-test.js
 *   k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/volume-test.js --out csv=volume-results.csv
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Configuración ──────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BACKEND_URL    || 'http://localhost:8090';
const KC_URL     = __ENV.KEYCLOAK_URL   || 'http://localhost:9090';
const KC_REALM   = __ENV.KC_REALM      || 'travel-realm';
const KC_CLIENT  = __ENV.KC_CLIENT     || 'travel-frontend';
const ADMIN_USER = __ENV.ADMIN_USER    || 'admin';
const ADMIN_PASS = __ENV.ADMIN_PASSWORD || 'admin123';

// ── Rangos de fechas que cubren distintos volúmenes de datos en BD ─────────────
// Ajustar estos rangos según la antigüedad de los datos en tu BD
const DATE_RANGES = {
  rango_500:   { start: '2026-06-01', end: '2026-06-30' },  // ~500 registros  (último mes)
  rango_1000:  { start: '2026-01-01', end: '2026-06-30' },  // ~1000 registros (6 meses)
  rango_5000:  { start: '2025-01-01', end: '2026-06-30' },  // ~5000 registros (18 meses)
  rango_10000: { start: '2023-01-01', end: '2026-06-30' },  // ~10000 registros (histórico completo)
};

// ── Métricas personalizadas por volumen ──────────────────────────────────────
const errorRate      = new Rate('volume_error_rate');
const vol500Latency  = new Trend('volume_500_latency',   true);
const vol1kLatency   = new Trend('volume_1000_latency',  true);
const vol5kLatency   = new Trend('volume_5000_latency',  true);
const vol10kLatency  = new Trend('volume_10000_latency', true);
const volErrors      = new Counter('volume_errors');

// ── Escenarios: mismo # de usuarios, distintos volúmenes de datos ─────────────
export const options = {
  scenarios: {
    // Volumen pequeño: ~500 registros, 20 usuarios
    volumen_500_registros: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      startTime: '0s',
      env: { VOLUMEN: '500' },
      tags: { volumen: '500' },
    },
    // Volumen medio: ~1000 registros, 20 usuarios
    volumen_1000_registros: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      startTime: '40s',
      env: { VOLUMEN: '1000' },
      tags: { volumen: '1000' },
    },
    // Volumen alto: ~5000 registros, 20 usuarios
    volumen_5000_registros: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      startTime: '80s',
      env: { VOLUMEN: '5000' },
      tags: { volumen: '5000' },
    },
    // Volumen muy alto: ~10000 registros, 20 usuarios
    volumen_10000_registros: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      startTime: '120s',
      env: { VOLUMEN: '10000' },
      tags: { volumen: '10000' },
    },
  },
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

// ── Función principal ─────────────────────────────────────────────────────────
export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type':  'application/json',
  };

  // Seleccionar rango de fechas según el escenario activo
  const volumen  = __ENV.VOLUMEN || '500';
  let rangeKey;
  if      (volumen === '1000')  rangeKey = 'rango_1000';
  else if (volumen === '5000')  rangeKey = 'rango_5000';
  else if (volumen === '10000') rangeKey = 'rango_10000';
  else                          rangeKey = 'rango_500';

  const range = DATE_RANGES[rangeKey];

  // ── Petición: Ventas por período (según volumen) ───────────────────────────
  const salesRes = http.get(
    `${BASE_URL}/api/reports/sales?startDate=${range.start}&endDate=${range.end}`,
    { headers, tags: { volumen, endpoint: 'sales' } },
  );

  // Registrar latencia según volumen
  const latencyMs = salesRes.timings.duration;
  if      (volumen === '1000')  vol1kLatency.add(latencyMs);
  else if (volumen === '5000')  vol5kLatency.add(latencyMs);
  else if (volumen === '10000') vol10kLatency.add(latencyMs);
  else                          vol500Latency.add(latencyMs);

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
    console.warn(`[Volumen ${volumen}] Error en /sales → status: ${salesRes.status}, tiempo: ${latencyMs}ms`);
  } else {
    errorRate.add(0);
  }

  sleep(0.5);

  // ── Petición: Ranking de paquetes (según volumen) ─────────────────────────
  const rankingRes = http.get(
    `${BASE_URL}/api/reports/package-ranking?startDate=${range.start}&endDate=${range.end}`,
    { headers, tags: { volumen, endpoint: 'ranking' } },
  );

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
  } else {
    errorRate.add(0);
  }

  sleep(0.5);
}
