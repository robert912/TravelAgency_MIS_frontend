import { test, expect } from '@playwright/test';

const PACKAGE_ID  = process.env.TEST_PACKAGE_ID   || '1';
const TEST_USER   = process.env.TEST_USER         || 'roberto.orellana.t@usach.cl';
const TEST_PASS   = process.env.TEST_PASSWORD     || 'Admin1234';

// ============================================================
// CA-EP4-01: Reserva exitosa con datos de pasajero válidos
// ============================================================
/**
 * Scenario: Reserva exitosa con un pasajero registrado
 *   Given  el usuario no está autenticado y navega a la página principal
 *     And  existe al menos un paquete turístico disponible
 *   When   el usuario selecciona el primer paquete disponible
 *     And  hace clic en "Reservar Ahora"
 *     And  inicia sesión con sus credenciales de Keycloak
 *     And  indica 1 pasajero y avanza al paso de datos
 *     And  ingresa el RUT del pasajero y espera el autocompletado
 *     And  avanza al resumen y confirma la reserva
 *   Then   el sistema muestra un diálogo "¡Reserva confirmada!" con el número de reserva
 *     And  al cerrar el diálogo redirige a "Mis Reservas"
 *     And  la reserva creada aparece en la lista con su número
 */

test('CA-EP4-01: Reserva exitosa con datos de pasajero válidos', async ({ page }) => {

  // ── Given: Usuario no autenticado en la página principal ─────────────────
  await test.step('Given: Página principal con paquetes turísticos disponibles', async () => {
    await page.goto('/');
    // Esperar que cargue al menos un botón "Ver Detalle"
    await expect(page.getByRole('button', { name: 'Ver Detalle' }).first())
      .toBeVisible({ timeout: 15000 });
  });

  // ── When: Selecciona el primer paquete y arranca el flujo de reserva ─────
  await test.step('When: Selecciona el primer paquete disponible', async () => {
    await page.getByRole('button', { name: 'Ver Detalle' }).first().click();
    await page.getByRole('button', { name: 'Reservar Ahora' }).click();
  });

  await test.step('When: Inicia sesión en Keycloak', async () => {
    // La app redirige a Keycloak cuando el usuario no está autenticado
    await page.waitForURL(/localhost:9090/, { timeout: 20000 });
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_USER);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(TEST_PASS);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    // Esperar que regrese al flujo de reserva
    await page.waitForURL(/localhost:5173/, { timeout: 20000 });
  });

  await test.step('When: Selecciona 1 pasajero y avanza a datos de pasajero', async () => {
    await page.getByRole('spinbutton', { name: 'Número de pasajeros' }).fill('1');
    await page.getByRole('button', { name: 'Continuar' }).click();
  });

  await test.step('When: Ingresa el RUT del pasajero (autocompletado desde la BD)', async () => {
    await page.getByRole('textbox', { name: 'Número de identificación (RUT' }).fill('17411947-3');
    // Esperar autocompletado de nombre y correo desde la BD
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Continuar' }).click();
  });

  await test.step('When: Confirma la reserva en el paso de resumen', async () => {
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    // Confirmar en el diálogo SweetAlert2 de confirmación previa
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Sí, reservar' }).click();
  });

  // ── Then: Sistema muestra el número de reserva y redirige ────────────────
  let reservationId;

  await test.step('Then: Muestra diálogo de éxito con el número de reserva asignado', async () => {
    const htmlContainer = page.locator('.swal2-html-container');
    await expect(htmlContainer).toContainText('Número de reserva:', { timeout: 15000 });

    // Extraer el ID dinámicamente del texto del popup: "Número de reserva: #1"
    const popupText = await htmlContainer.textContent();
    const match = popupText.match(/#(\d+)/);
    reservationId = match?.[1];

    await expect(page.locator('.swal2-title')).toHaveText('¡Reserva confirmada!');
    expect(reservationId).toBeTruthy(); // debe haber un número de reserva
  });

  await test.step('Then: Redirige a "Mis Reservas" al cerrar el diálogo', async () => {
    await page.getByRole('button', { name: 'Ver mis reservas' }).click();
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
  });

  await test.step('Then: La reserva creada aparece en la lista', async () => {
    // MUI Typography variant="h6" → rol "heading" con el número extraído del popup
    await expect(
      page.getByRole('heading', { name: `Reserva #${reservationId}` })
    ).toBeVisible({ timeout: 10000 });
  });
});

