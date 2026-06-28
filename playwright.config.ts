import { defineConfig } from '@playwright/test';

/**
 * Evaluación 3 — Pruebas Funcionales con Playwright
 * Cubre Épica 4 (Reservas) y Épica 5 (Pagos)
 *
 * Variables de entorno (crear archivo .env.test en la raíz):
 *   TEST_USER       — usuario regular en Keycloak  (default: testuser)
 *   TEST_PASSWORD   — contraseña del usuario        (default: password123)
 *   TEST_PACKAGE_ID — ID de paquete con cupos       (default: 1)
 *   BASE_URL        — URL del frontend              (default: http://localhost:5173)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: false,
    launchOptions: {
      slowMo: 400,
    },
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },
  projects: [
    // Proyecto 0: guarda la sesión de Keycloak en .auth/user.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },

    // Proyecto 1: Épica 4 — cada test maneja su propio login inline
    // NO usa storageState: si el navegador ya tiene sesión, waitForURL(/localhost:9090/)
    // nunca ocurre y el test falla por timeout.
    {
      name: 'epica4-reservas',
      testMatch: /ep4-ca\d+\.spec\.js/,
    },

    // Proyecto 2: Épica 5 — usa la sesión guardada por setup
    // Los tests de pagos mockean las llamadas API pero no manejan el flujo de Keycloak,
    // por lo que necesitan la sesión precargada para que la ruta /payment/:id sea accesible.
    {
      name: 'epica5-pagos',
      testMatch: /epica5-payments\.spec\.js/,
      dependencies: ['setup'],
      use: {
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
  ],
});
