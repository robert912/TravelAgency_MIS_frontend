/**
 * ============================================================
 * PRUEBAS FUNCIONALES — ÉPICA 4: Proceso de reserva en línea
 * ============================================================
 *
 * CA-EP4-01: Reserva exitosa con datos de pasajero válidos
 * CA-EP4-02: El sistema aplica 10% de descuento al seleccionar 4+ pasajeros
 * CA-EP4-03: El sistema descuenta correctamente los cupos al registrar una reserva
 *
 * Prerrequisitos:
 *   - Frontend corriendo en http://localhost:5173
 *   - Backend  corriendo en http://localhost:8090
 *   - Keycloak corriendo en http://localhost:9090
 *
 * Variables de entorno:
 *   TEST_USER              — usuario Keycloak          (default: roberto.orellana.t@usach.cl)
 *   TEST_PASSWORD          — contraseña                (default: Admin1234)
 *   TEST_PACKAGE_ID        — ID del paquete a usar     (default: 1)
 *   API_BASE_URL           — base URL del backend      (default: http://localhost:8090)
 *   TEST_RUT_1..4          — RUT de cada pasajero (CA-EP4-02)
 *   TEST_PASSENGER_NAME_N  — nombre si RUT no está en BD
 *   TEST_PASSENGER_EMAIL_N — correo si RUT no está en BD
 */

import { test, expect } from '@playwright/test';

// ── Constantes ─────────────────────────────────────────────────────────────────
const PACKAGE_ID = process.env.TEST_PACKAGE_ID  || '1';
const TEST_USER  = process.env.TEST_USER        || 'roberto.orellana.t@usach.cl';
const TEST_PASS  = process.env.TEST_PASSWORD    || 'Admin1234';
const API_BASE   = process.env.API_BASE_URL     || 'http://localhost:8090';

// Datos de los 4 pasajeros para CA-EP4-02
const PASSENGERS = [
  { rut: process.env.TEST_RUT_1 || '17411947-3', name: process.env.TEST_PASSENGER_NAME_1 || 'Pasajero Uno Prueba',    email: process.env.TEST_PASSENGER_EMAIL_1 || 'pasajero1@prueba.cl' },
  { rut: process.env.TEST_RUT_2 || '12345678-9', name: process.env.TEST_PASSENGER_NAME_2 || 'Pasajero Dos Prueba',    email: process.env.TEST_PASSENGER_EMAIL_2 || 'pasajero2@prueba.cl' },
  { rut: process.env.TEST_RUT_3 || '11111111-1', name: process.env.TEST_PASSENGER_NAME_3 || 'Pasajero Tres Prueba',   email: process.env.TEST_PASSENGER_EMAIL_3 || 'pasajero3@prueba.cl' },
  { rut: process.env.TEST_RUT_4 || '22222222-2', name: process.env.TEST_PASSENGER_NAME_4 || 'Pasajero Cuatro Prueba', email: process.env.TEST_PASSENGER_EMAIL_4 || 'pasajero4@prueba.cl' },
];

// ── Helpers compartidos ────────────────────────────────────────────────────────

/**
 * Autentica al usuario vía UI:
 * home → "Ver Detalle" → "Reservar Ahora" → Keycloak → frontend.
 * La home page es pública; el redirect a Keycloak ocurre al intentar reservar.
 * Tras el login, el navegador queda en el formulario de reserva del paquete clickeado.
 */
async function loginViaUI(page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Ver Detalle' }).first())
    .toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Ver Detalle' }).first().click();
  await page.getByRole('button', { name: 'Reservar Ahora' }).click();
  await page.waitForURL(/localhost:9090/, { timeout: 20000 });
  await page.locator('#username').fill(TEST_USER);
  await page.locator('#password').fill(TEST_PASS);
  await page.locator('#kc-login').click();
  await page.waitForURL(/localhost:5173/, { timeout: 20000 });
}

/**
 * Expande el accordion del pasajero N (1-based).
 * BookingPage usa un Box + Collapse custom (no MUI Accordion).
 */
async function expandPassengerAccordion(page, n) {
  await page.getByText(`Pasajero ${n}`, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

/**
 * Ingresa el RUT en el campo visible y maneja los dos escenarios:
 *
 * Caso A (RUT en BD):  SweetAlert "¡Pasajero encontrado!" aparece y cierra solo
 *                      → nombre y correo autocompletados → no se necesita "Guardar datos".
 * Caso B (RUT no BD):  SweetAlert no aparece → se llenan nombre y correo manualmente
 *                      → click "Guardar datos" → SweetAlert "¡Registrado!" y cierra.
 */
async function fillRutAndWaitForAutofill(page, passenger) {
  await page.getByRole('textbox', { name: 'Número de identificación (RUT' }).first().fill(passenger.rut);

  let autofilled = false;
  try {
    await page.locator('.swal2-popup').waitFor({ state: 'visible', timeout: 3000 });
    await page.locator('.swal2-popup').waitFor({ state: 'hidden',  timeout: 3000 });
    autofilled = true;
  } catch {
    // RUT no encontrado en BD
  }

  if (!autofilled) {
    await page.getByRole('textbox', { name: 'Nombre completo' }).fill(passenger.name);
    await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(passenger.email);
    await page.getByRole('button', { name: 'Guardar datos' }).click();
    await page.locator('.swal2-popup').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.swal2-popup').waitFor({ state: 'hidden',  timeout: 5000 });
  }
}

/**
 * Consulta los cupos disponibles del paquete directamente en el backend.
 * GET /api/tour-packages/{id}/availability
 * Retorna: availableSlots (número entero)
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
// CA-EP4-01: Reserva exitosa con datos de pasajero válidos
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: Reserva exitosa con un pasajero registrado
 *   Given  el usuario no está autenticado y navega a la página principal
 *     And  existe al menos un paquete turístico disponible
 *   When   el usuario selecciona el primer paquete disponible y hace clic en "Reservar Ahora"
 *     And  inicia sesión con sus credenciales de Keycloak
 *     And  indica 1 pasajero y avanza al paso de datos
 *     And  ingresa el RUT del pasajero y espera el autocompletado
 *     And  avanza al resumen y confirma la reserva
 *   Then   el sistema muestra un diálogo "¡Reserva confirmada!" con el número de reserva
 *     And  al cerrar el diálogo redirige a "Mis Reservas"
 *     And  la reserva creada aparece en la lista con su número
 */
test('CA-EP4-01: Reserva exitosa con datos de pasajero válidos', async ({ page }) => {

  await test.step('Given: Usuario no autenticado en la página principal con paquetes disponibles', async () => {
    await loginViaUI(page);
  });

  await test.step('When: Selecciona 1 pasajero y avanza al paso de datos', async () => {
    await page.getByRole('spinbutton', { name: 'Número de pasajeros' }).fill('1');
    await page.getByRole('button', { name: 'Continuar' }).click();
  });

  await test.step('When: Ingresa el RUT del pasajero (autocompletado desde la BD)', async () => {
    await page.getByRole('textbox', { name: 'Número de identificación (RUT' }).fill('17411947-3');
    await page.waitForTimeout(1000); // esperar autocompletado debounced
    await page.getByRole('button', { name: 'Continuar' }).click();
  });

  await test.step('When: Avanza al resumen y confirma la reserva', async () => {
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Sí, reservar' }).click();
  });

  let reservationId;

  await test.step('Then: El sistema muestra diálogo "¡Reserva confirmada!" con el número asignado', async () => {
    const htmlContainer = page.locator('.swal2-html-container');
    await expect(htmlContainer).toContainText('Número de reserva:', { timeout: 15000 });
    const popupText = await htmlContainer.textContent();
    const match = popupText.match(/#(\d+)/);
    reservationId = match?.[1];
    await expect(page.locator('.swal2-title')).toHaveText('¡Reserva confirmada!');
    expect(reservationId).toBeTruthy();
  });

  await test.step('Then: Redirige a "Mis Reservas" al cerrar el diálogo', async () => {
    await page.getByRole('button', { name: 'Ver mis reservas' }).click();
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
  });

  await test.step('Then: La reserva creada aparece en la lista con su número', async () => {
    await expect(
      page.getByRole('heading', { name: `Reserva #${reservationId}` })
    ).toBeVisible({ timeout: 10000 });
  });
});


// ─────────────────────────────────────────────────────────────
// CA-EP4-02: Descuento del 10% al seleccionar 4+ pasajeros
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: Reserva grupal con descuento del 10% y 4 pasajeros
 *   Given  que el usuario está autenticado en la plataforma
 *     And  existe un paquete turístico con al menos 4 cupos disponibles
 *   When   el usuario selecciona 4 pasajeros en el campo "Número de pasajeros"
 *   Then   el sistema muestra inmediatamente una alerta de descuento grupal del 10%
 *   When   el usuario avanza, completa los 4 pasajeros y confirma la reserva
 *   Then   el diálogo de pre-confirmación muestra "Descuento Verano" en los descuentos
 *     And  el sistema confirma la reserva con el número asignado
 *     And  el detalle de la reserva muestra "Descuento Verano" en los descuentos aplicados
 */
test('CA-EP4-02: El sistema aplica 10% de descuento al seleccionar 4 o más pasajeros', async ({ page }) => {

  await test.step('Given: Usuario autenticado en la plataforma', async () => {
    await loginViaUI(page);
  });

  await test.step('When: El usuario selecciona 4 pasajeros en el campo "Número de pasajeros"', async () => {
    const passengerInput = page.getByRole('spinbutton', { name: 'Número de pasajeros' });
    await passengerInput.clear();
    await passengerInput.fill('4');
    await page.waitForTimeout(1000); // esperar recálculo de precio y disponibilidad
  });

  await test.step('Then: El sistema muestra alerta de descuento por grupo del 10%', async () => {
    const discountAlert = page.locator('.MuiAlert-root').filter({ hasText: 'Descuento por grupo aplicado' });
    await expect(discountAlert).toBeVisible({ timeout: 8000 });
    await expect(discountAlert).toContainText('10%');
  });

  await test.step('When: El usuario avanza al paso "Información de pasajeros"', async () => {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Información de pasajeros' })
    ).toBeVisible({ timeout: 10000 });
  });

  await test.step('When: Ingresa datos del Pasajero 1', async () => {
    await fillRutAndWaitForAutofill(page, PASSENGERS[0]);
  });

  await test.step('When: Ingresa datos del Pasajero 2', async () => {
    await expandPassengerAccordion(page, 2);
    await fillRutAndWaitForAutofill(page, PASSENGERS[1]);
  });

  await test.step('When: Ingresa datos del Pasajero 3', async () => {
    await expandPassengerAccordion(page, 3);
    await fillRutAndWaitForAutofill(page, PASSENGERS[2]);
  });

  await test.step('When: Ingresa datos del Pasajero 4', async () => {
    await expandPassengerAccordion(page, 4);
    await fillRutAndWaitForAutofill(page, PASSENGERS[3]);
  });

  await test.step('When: Avanza al resumen y hace clic en "Confirmar reserva"', async () => {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
  });

  await test.step('Then: El diálogo de pre-confirmación muestra "Descuento Verano" aplicado', async () => {
    const preConfirmHtml = page.locator('.swal2-html-container');
    await expect(preConfirmHtml).toContainText('Descuentos aplicados:');
    await expect(preConfirmHtml).toContainText('Descuento Verano');
  });

  await test.step('When: El usuario confirma haciendo clic en "Sí, reservar"', async () => {
    await page.getByRole('button', { name: 'Sí, reservar' }).click();
  });

  let reservationId;

  await test.step('Then: El sistema confirma la reserva y muestra el número asignado', async () => {
    const htmlContainer = page.locator('.swal2-html-container');
    await expect(htmlContainer).toContainText('Número de reserva:', { timeout: 15000 });
    const popupText = await htmlContainer.textContent();
    const match = popupText.match(/#(\d+)/);
    reservationId = match?.[1];
    await expect(page.locator('.swal2-title')).toHaveText('¡Reserva confirmada!');
    expect(reservationId).toBeTruthy();
  });

  await test.step('Then: Redirige a "Mis Reservas" con la nueva reserva en la lista', async () => {
    await page.getByRole('button', { name: 'Ver mis reservas' }).click();
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
    await expect(
      page.getByRole('heading', { name: `Reserva #${reservationId}` })
    ).toBeVisible({ timeout: 10000 });
  });

  await test.step('Then: Navega al detalle de la reserva creada', async () => {
    const reservationCard = page
      .locator('.MuiCard-root')
      .filter({ has: page.getByRole('heading', { name: `Reserva #${reservationId}` }) });
    await reservationCard.getByRole('button', { name: 'Detalles' }).click();
    await expect(page).toHaveURL(new RegExp(`reservation-details/${reservationId}`), { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: `Reserva #${reservationId}` })
    ).toBeVisible({ timeout: 10000 });
  });

  await test.step('Then: El detalle de la reserva muestra "Descuento Verano" en los descuentos aplicados', async () => {
    await expect(page.getByText('Descuentos aplicados:').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Descuento Verano').first()).toBeVisible({ timeout: 10000 });
  });
});


// ─────────────────────────────────────────────────────────────
// CA-EP4-03: Los cupos se descuentan correctamente al reservar
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: El sistema descuenta los cupos disponibles al confirmar una reserva
 *   Given  que el usuario está autenticado en la plataforma
 *     And  el paquete tiene X cupos disponibles (consultados via API antes de reservar)
 *   When   el usuario ingresa 2 pasajeros y confirma la reserva
 *   Then   el sistema registra la reserva exitosamente
 *     And  los cupos disponibles pasan de X a X-2 (verificado via API)
 */
test('CA-EP4-03: El sistema descuenta 2 cupos al confirmar una reserva', async ({ page }) => {

  await test.step('Given: Usuario autenticado en la plataforma', async () => {
    await loginViaUI(page);
  });

  let initialSlots;
  await test.step(`Given: Paquete #${PACKAGE_ID} tiene X cupos disponibles`, async () => {
    initialSlots = await readSlotsFromApi(page);
    expect(initialSlots).toBeGreaterThanOrEqual(2);
    console.log(`Cupos antes de la reserva (X): ${initialSlots}`);
  });

  await test.step('When: El usuario selecciona 2 pasajeros y avanza al paso de datos', async () => {
    await page.getByRole('spinbutton', { name: 'Número de pasajeros' }).fill('2');
    await page.waitForTimeout(1000); // esperar recálculo de disponibilidad
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Información de pasajeros' })
    ).toBeVisible({ timeout: 10000 });
  });

  await test.step('When: Ingresa el RUT del Pasajero 1 (autocompletado desde la BD)', async () => {
    await page.getByRole('textbox', { name: 'Número de identificación (RUT' }).fill('17411947-3');
    await page.waitForTimeout(1000);
  });

  await test.step('When: Ingresa el RUT del Pasajero 2 (autocompletado desde la BD)', async () => {
    await expandPassengerAccordion(page, 2);
    await page.getByRole('textbox', { name: 'Número de identificación (RUT' }).fill('12345678-9');
    await page.waitForTimeout(1000);
  });

  await test.step('When: Avanza al resumen y confirma la reserva', async () => {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Sí, reservar' }).click();
  });

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

  await test.step(`Then: Los cupos del paquete pasan de ${initialSlots} a ${initialSlots - 2} (X − 2)`, async () => {
    const finalSlots = await readSlotsFromApi(page);
    console.log(`Cupos después de la reserva (Z): ${finalSlots}  (esperado: ${initialSlots - 2})`);
    expect(finalSlots).toBe(initialSlots - 2);
  });
});
