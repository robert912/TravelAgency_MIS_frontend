import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

/**
 * Setup global: autentica al usuario de prueba en Keycloak.
 * Guarda la sesión para ser reutilizada por todos los tests de Épica 4 y 5.
 *
 * Variables de entorno:
 *   TEST_USER     — usuario en Keycloak (default: testuser)
 *   TEST_PASSWORD — contraseña (default: password123)
 */
setup('Autenticar usuario de prueba en Keycloak', async ({ page }) => {
  const username = process.env.TEST_USER || 'roberto.orellana.t@usach.cl';
  const password = process.env.TEST_PASSWORD || 'Admin1234';

  // ── Given: La aplicación está disponible y requiere autenticación ──────────
  // 'commit' devuelve el control en cuanto llega el primer byte de respuesta,
  // antes de que keycloak-js ejecute su redirect — evita "page has been closed"
  await page.goto('/', { waitUntil: 'commit' });
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  // Esperar redirección a Keycloak
  await page.waitForURL(/localhost:9090/, { timeout: 20000 });

  // ── When: El usuario ingresa sus credenciales en la pantalla de Keycloak ──
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#kc-login').click();

  // ── Then: El usuario es redirigido de vuelta a la aplicación ──────────────
  await page.waitForURL(/localhost:5173/, { timeout: 30000 });
  await expect(page).toHaveURL(/localhost:5173/);

  // Asegurar que el directorio existe antes de guardar
  const dir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Guardar estado de sesión (cookies + localStorage) para los demás tests
  await page.context().storageState({ path: AUTH_FILE });

  console.log(`✓ Sesión guardada para: ${username}`);
});
