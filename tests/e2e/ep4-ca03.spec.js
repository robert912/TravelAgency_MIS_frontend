import { test, expect } from '@playwright/test';

const PACKAGE_ID = process.env.TEST_PACKAGE_ID  || '1';
const TEST_USER  = process.env.TEST_USER        || 'roberto.orellana.t@usach.cl';
const TEST_PASS  = process.env.TEST_PASSWORD    || 'Admin1234';

// =================================================================================
// CA-EP4-03: El sistema descuenta correctamente los cupos al registrar una reserva
// =================================================================================
/**
 * Scenario: El sistema descuenta los cupos disponibles al confirmar una reserva
 *   Given  que el usuario está autenticado en la plataforma
 *     And  existe un paquete turístico con X cupos disponibles (leídos del formulario de reserva)
 *     And  el usuario ha navegado al formulario de reserva de dicho paquete
 *   When   el usuario ingresa 2 pasajeros y confirma la reserva
 *   Then   el sistema registra la reserva exitosamente
 *     And  los cupos disponibles del paquete pasan de X a Z  (Z = X - 2)
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8090';

/**
 * Consulta la disponibilidad del paquete directamente en el backend.
 * GET /api/tour-packages/{id}/availability
 * Respuesta: { isAvailable, totalSlots, reservedSlots, availableSlots, ... }
 */
async function readSlotsFromApi(page) {
  const response = await page.request.get(
    `${API_BASE}/api/tour-packages/${PACKAGE_ID}/availability`
  );
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.availableSlots;
}

// ─────────────────────────────────────────────────────────────
// CA-EP4-03: Los cupos se descuentan correctamente al reservar
// ─────────────────────────────────────────────────────────────
test('CA-EP4-03: El sistema descuenta 2 cupos al confirmar una reserva', async ({ page }) => {

  // ── Given: Usuario autenticado ────────────────────────────────────────────
  // La home page es pública; el redirect a Keycloak ocurre al intentar reservar.
  await test.step('Given: Usuario autenticado en la plataforma', async () => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Ver Detalle' }).first())
      .toBeVisible({ timeout: 15000 });

    // Click en el primer paquete disponible → "Reservar Ahora" dispara el flujo de auth
    await page.getByRole('button', { name: 'Ver Detalle' }).first().click();
    await page.getByRole('button', { name: 'Reservar Ahora' }).click();

    await page.waitForURL(/localhost:9090/, { timeout: 20000 });
    await page.locator('#username').fill(TEST_USER);
    await page.locator('#password').fill(TEST_PASS);
    await page.locator('#kc-login').click();
    await page.waitForURL(/localhost:5173/, { timeout: 20000 });
  });

  // ── Given: X cupos disponibles antes de la reserva (via API) ────────────
  // La API devuelve { availableSlots, totalSlots, reservedSlots, ... } sin navegar al front.
  let initialSlots;
  await test.step(`Given: Paquete #${PACKAGE_ID} tiene X cupos disponibles`, async () => {
    initialSlots = await readSlotsFromApi(page);
    expect(initialSlots).toBeGreaterThanOrEqual(2); // necesita al menos 2 para esta prueba
    console.log(`Cupos antes de la reserva (X): ${initialSlots}`);
  });


  // ── When: Selecciona 2 pasajeros y avanza ────────────────────────────────
  await test.step('When: El usuario selecciona 2 pasajeros y avanza al paso de datos', async () => {
    await page.getByRole('spinbutton', { name: 'Número de pasajeros' }).fill('2');
    await page.waitForTimeout(1000); // esperar recálculo de disponibilidad
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Información de pasajeros' })
    ).toBeVisible({ timeout: 10000 });
  });

  // ── When: Completa los datos de los 2 pasajeros ──────────────────────────
  await test.step('When: Ingresa el RUT del Pasajero 1 (autocompletado desde la BD)', async () => {
    await page.getByRole('textbox', { name: 'Número de identificación (RUT' }).fill('17411947-3');
    await page.waitForTimeout(1000); // esperar autocompletado debounced
  });

  await test.step('When: Ingresa el RUT del Pasajero 2 (autocompletado desde la BD)', async () => {
    // Expandir el accordion del Pasajero 2 (colapsado por defecto)
    await page.getByText('Pasajero 2', { exact: false }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole('textbox', { name: 'Número de identificación (RUT' }).fill('12345678-9');
    await page.waitForTimeout(1000); // esperar autocompletado debounced
    console.log('Cupos reservados (Y): 2');
  });

  // ── When: Avanza al resumen y confirma la reserva ────────────────────────
  await test.step('When: El usuario avanza al resumen y confirma la reserva', async () => {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Sí, reservar' }).click();
  });

  // ── Then: La reserva se registró exitosamente ─────────────────────────────
  let reservationId;
  await test.step('Then: El sistema registra la reserva exitosamente', async () => {
    const htmlContainer = page.locator('.swal2-html-container');
    await expect(htmlContainer).toContainText('Número de reserva:', { timeout: 15000 });

    const popupText = await htmlContainer.textContent();
    const match = popupText.match(/#(\d+)/);
    reservationId = match?.[1];

    await expect(page.locator('.swal2-title')).toHaveText('¡Reserva confirmada!');
    expect(reservationId).toBeTruthy();
    console.log(`Reserva creada: #${reservationId}`);

    await page.getByRole('button', { name: 'Ver mis reservas' }).click();
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
  });

  // ── Then: Los cupos pasan de X a X-2 (verificado en API) ────────────────
  await test.step(`Then: Los cupos del paquete pasan de ${initialSlots} a ${initialSlots - 2}`, async () => {
    const finalSlots = await readSlotsFromApi(page);
    console.log(`Cupos después de la reserva (Z): ${finalSlots}  (esperado: ${initialSlots - 2})`);

    expect(finalSlots).toBe(initialSlots - 2);
  });
});
