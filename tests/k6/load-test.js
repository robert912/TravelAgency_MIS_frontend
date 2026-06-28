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
 *   k6 run tests/k6/load-test.js
 *
 * Resultados:
 *   - http_req_duration: tiempo de respuesta (p90, p95, p99)
 *   - http_req_failed:   tasa de errores
 *   - iterations:        total de iteraciones completadas
 *
 * IMPORTANTE:
 *   Los reportes requieren rol "Admin" en Keycloak.
 *   Configurar KEYCLOAK_URL, ADMIN_USER y ADMIN_PASSWORD como
 *   variables de entorno K6 (-e FLAG=value) o usar el token hardcodeado.
 *
 *   Ejemplo:
 *     k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Configuración ──────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BACKEND_URL || 'http://localhost:8090';
const KC_URL     = __ENV.KEYCLOAK_URL || 'http://localhost:9090';
const KC_REALM   = __ENV.KC_REALM    || 'travel-realm';
const KC_CLIENT  = __ENV.KC_CLIENT   || 'travel-frontend';
const ADMIN_USER = __ENV.ADMIN_USER  || 'admin';
const ADMIN_PASS = __ENV.ADMIN_PASSWORD || 'admin123';

// Período de reporte a consultar
const START_DATE = '2024-01-01';
const END_DATE   = '2026-12-31';

// ── Métricas personalizadas ───────────────────────────────────────────────────
const salesErrors        = new Counter('sales_report_errors');
const rankingErrors      = new Counter('ranking_report_errors');
const salesDuration      = new Trend('sales_report_duration', true);
const rankingDuration    = new Trend('ranking_report_duration', true);
const errorRate          = new Rate('error_rate');

// ── Escenarios de carga ───────────────────────────────────────────────────────
export const options = {
  scenarios: {
    carga_10_usuarios: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '0s',
      tags: { scenario: '10_usuarios' },
    },
    carga_50_usuarios: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
      startTime: '40s',
      tags: { scenario: '50_usuarios' },
    },
    carga_100_usuarios: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      startTime: '80s',
      tags: { scenario: '100_usuarios' },
    },
    carga_200_usuarios: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30s',
      startTime: '120s',
      tags: { scenario: '200_usuarios' },
    },
  },
  thresholds: {
    // 95% de las peticiones deben responder en menos de 3 segundos
    'http_req_duration': ['p(95)<3000'],
    // Tasa de error menor al 5%
    'error_rate': ['rate<0.05'],
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

// ── Función principal del test ────────────────────────────────────────────────
export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type':  'application/json',
  };

  // ── Petición 1: Reporte de ventas por período ─────────────────────────────
  const salesRes = http.get(
    `${BASE_URL}/api/reports/sales?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers, tags: { endpoint: 'sales' } },
  );

  salesDuration.add(salesRes.timings.duration);

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
  } else {
    errorRate.add(0);
  }

  sleep(0.5);

  // ── Petición 2: Ranking de paquetes por período ───────────────────────────
  const rankingRes = http.get(
    `${BASE_URL}/api/reports/package-ranking?startDate=${START_DATE}&endDate=${END_DATE}`,
    { headers, tags: { endpoint: 'ranking' } },
  );

  rankingDuration.add(rankingRes.timings.duration);

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
  } else {
    errorRate.add(0);
  }

  sleep(0.5);
}

// ── Teardown: resumen final ───────────────────────────────────────────────────
export function teardown() {
  console.log('\n=== RESUMEN LOAD TESTING — ÉPICA 7 ===');
  console.log('Escenarios ejecutados: 10, 50, 100, 200 usuarios concurrentes');
  console.log('Endpoints: /api/reports/sales  y  /api/reports/package-ranking');
  console.log('Ver resultados detallados en la salida de K6 o exportar con --out csv=resultado.csv');
}
