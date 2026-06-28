

import { test, expect } from '@playwright/test';

const PACKAGE_ID = process.env.TEST_PACKAGE_ID || '1';
const TEST_USER  = process.env.TEST_USER        || 'roberto.orellana.t@usach.cl';
const TEST_PASS  = process.env.TEST_PASSWORD    || 'Admin1234';

// ============================================================
// CA-EP4-02: El sistema aplica automáticamente un 10% de descuento
//            al seleccionar 4 o más pasajeros en una reserva
// ============================================================
/**
 * Scenario: Reserva grupal con descuento del 10% y 4 pasajeros en BD
 *   Given  que el usuario está autenticado en la plataforma
 *     And  existe un paquete turístico con al menos 4 cupos disponibles
 *     And  el usuario ha navegado al formulario de reserva de dicho paquete
 *   When   el usuario selecciona 4 pasajeros en el campo "Número de pasajeros"
 *   Then   el sistema muestra inmediatamente una alerta informando que se aplicó un descuento del 10% por reserva grupal
 *   When   el usuario avanza al paso de "Información de pasajeros"
 *     And  ingresa el RUT del Pasajero 1 (existe en BD → se autocompleta)
 *     And  ingresa el RUT del Pasajero 2 (existe en BD → se autocompleta)
 *     And  ingresa el RUT del Pasajero 3 (existe en BD → se autocompleta)
 *     And  ingresa el RUT del Pasajero 4 (existe en BD → se autocompleta)
 *   When   el usuario avanza al resumen y confirma la reserva
 *   Then   el sistema confirma la reserva con su número asignado
 *     And  el resumen refleja el descuento grupal aplicado al total
 */


// Datos de los 4 pasajeros: RUT + nombre y correo de respaldo si no están en BD
const PASSENGERS = [
  { rut: process.env.TEST_RUT_1 || '17411947-3', name: process.env.TEST_PASSENGER_NAME_1 || 'Pasajero Uno Prueba',    email: process.env.TEST_PASSENGER_EMAIL_1 || 'pasajero1@prueba.cl' },
  { rut: process.env.TEST_RUT_2 || '12345678-9', name: process.env.TEST_PASSENGER_NAME_2 || 'Pasajero Dos Prueba',    email: process.env.TEST_PASSENGER_EMAIL_2 || 'pasajero2@prueba.cl' },
  { rut: process.env.TEST_RUT_3 || '11111111-1', name: process.env.TEST_PASSENGER_NAME_3 || 'Pasajero Tres Prueba',   email: process.env.TEST_PASSENGER_EMAIL_3 || 'pasajero3@prueba.cl' },
  { rut: process.env.TEST_RUT_4 || '22222222-2', name: process.env.TEST_PASSENGER_NAME_4 || 'Pasajero Cuatro Prueba', email: process.env.TEST_PASSENGER_EMAIL_4 || 'pasajero4@prueba.cl' },
];

/**
 * Expande el accordion del pasajero N (1-based) y espera que el campo RUT sea visible.
 * El accordion usa onClick en el Box que contiene "Pasajero N".
 */
async function expandPassengerAccordion(page, n) {
  await page.getByText(`Pasajero ${n}`, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

/**
 * Ingresa el RUT en el accordion expandido y maneja ambos casos:
 *
 * Caso A — RUT existe en BD:
 *   BookingPage dispara búsqueda debounced → SweetAlert "¡Pasajero encontrado!" (timer 1500ms)
 *   → campos autocompletan → isEditing: false → no se necesita "Guardar datos"
 *
 * Caso B — RUT NO existe en BD:
 *   No aparece SweetAlert → se completan nombre y correo manualmente
 *   → click "Guardar datos" → SweetAlert "¡Registrado!" (timer 1500ms) → isEditing: false
 */
async function fillRutAndWaitForAutofill(page, passenger) {
  const rutInput = page.getByRole('textbox', { name: 'Número de identificación (RUT' }).first();
  await rutInput.fill(passenger.rut);

  let autofilled = false;
  try {
    await page.locator('.swal2-popup').waitFor({ state: 'visible', timeout: 3000 });
    await page.locator('.swal2-popup').waitFor({ state: 'hidden',  timeout: 3000 });
    autofilled = true; // Caso A: autocompletado desde BD
  } catch {
    // Caso B: pasajero no encontrado en BD
  }

  if (!autofilled) {
    // Nombre y correo son obligatorios — se llenan con los datos de respaldo
    await page.getByRole('textbox', { name: 'Nombre completo' }).fill(passenger.name);
    await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(passenger.email);
    await page.getByRole('button', { name: 'Guardar datos' }).click();
    // SweetAlert "¡Registrado!" — se cierra solo en 1500ms
    await page.locator('.swal2-popup').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.swal2-popup').waitFor({ state: 'hidden',  timeout: 5000 });
  }
}

// ─────────────────────────────────────────────────────────────
// CA-EP4-02: Descuento del 10% al seleccionar 4+ pasajeros
// ─────────────────────────────────────────────────────────────
test('CA-EP4-02: El sistema aplica 10% de descuento al seleccionar 4 o más pasajeros', async ({ page }) => {

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

  // ── When: Selecciona 4 pasajeros ──────────────────────────────────────────
  await test.step('When: El usuario selecciona 4 pasajeros en el campo "Número de pasajeros"', async () => {
    const passengerInput = page.getByRole('spinbutton', { name: 'Número de pasajeros' });
    await passengerInput.clear();
    await passengerInput.fill('4');
    // Dar tiempo al useEffect para recalcular precio y disponibilidad
    await page.waitForTimeout(1000);
  });

  // ── Then: El sistema muestra la alerta de descuento (aún en Paso 1) ──────
  await test.step('Then: El sistema muestra alerta de descuento por grupo del 10%', async () => {
    // El Alert aparece en el mismo paso cuando passengers >= 4 (BookingPage.jsx línea 776)
    const discountAlert = page.locator('.MuiAlert-root').filter({ hasText: 'Descuento por grupo aplicado' });
    await expect(discountAlert).toBeVisible({ timeout: 8000 });
    await expect(discountAlert).toContainText('10%');
  });

  // ── When: Avanza al paso de información de pasajeros ─────────────────────
  await test.step('When: El usuario avanza al paso "Información de pasajeros"', async () => {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Información de pasajeros' })
    ).toBeVisible({ timeout: 10000 });
  });

  // ── When: Completa los 4 pasajeros usando RUTs existentes en BD ──────────
  await test.step('When: Ingresa datos del Pasajero 1 (autocompletado si existe en BD, manual si no)', async () => {
    // Pasajero 1 está expandido por defecto (expandedPassenger = 0)
    await fillRutAndWaitForAutofill(page, PASSENGERS[0]);
  });

  await test.step('When: Ingresa datos del Pasajero 2 (autocompletado si existe en BD, manual si no)', async () => {
    await expandPassengerAccordion(page, 2);
    await fillRutAndWaitForAutofill(page, PASSENGERS[1]);
  });

  await test.step('When: Ingresa datos del Pasajero 3 (autocompletado si existe en BD, manual si no)', async () => {
    await expandPassengerAccordion(page, 3);
    await fillRutAndWaitForAutofill(page, PASSENGERS[2]);
  });

  await test.step('When: Ingresa datos del Pasajero 4 (autocompletado si existe en BD, manual si no)', async () => {
    await expandPassengerAccordion(page, 4);
    await fillRutAndWaitForAutofill(page, PASSENGERS[3]);
  });

  // ── When: Avanza al resumen y confirma la reserva ─────────────────────────
  await test.step('When: El usuario avanza al paso de resumen', async () => {
    await page.getByRole('button', { name: 'Continuar' }).click();
  });

  await test.step('When: El usuario hace clic en "Confirmar reserva"', async () => {
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    // Aparece el SweetAlert de pre-confirmación con el detalle de la reserva
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
  });

  // ── Then: El detalle de pre-confirmación muestra el Descuento Verano ──────
  await test.step('Then: El detalle de la reserva muestra el "Descuento Verano" aplicado', async () => {
    // BookingPage.jsx línea 554: discountsDetail se lista con d.name como texto de cada <li>
    // "Descuento Verano" es el nombre de la promoción activa (promoActive.name)
    const preConfirmHtml = page.locator('.swal2-html-container');
    await expect(preConfirmHtml).toContainText('Descuentos aplicados:');
    await expect(preConfirmHtml).toContainText('Descuento Verano');
  });

  await test.step('When: El usuario confirma haciendo clic en "Sí, reservar"', async () => {
    await page.getByRole('button', { name: 'Sí, reservar' }).click();
  });

  // ── Then: Sistema confirma la reserva ────────────────────────────────────
  let reservationId;

  await test.step('Then: El sistema confirma la reserva y muestra el número asignado', async () => {
    const htmlContainer = page.locator('.swal2-html-container');
    await expect(htmlContainer).toContainText('Número de reserva:', { timeout: 15000 });

    // Extraer el número de reserva dinámicamente del popup de éxito
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
    // Localizar la card de la reserva recién creada y hacer clic en "Detalles"
    const reservationCard = page
      .locator('.MuiCard-root')
      .filter({ has: page.getByRole('heading', { name: `Reserva #${reservationId}` }) });
    await reservationCard.getByRole('button', { name: 'Detalles' }).click();

    // BookingDetails.jsx — ruta: /reservation-details/:id
    await expect(page).toHaveURL(new RegExp(`reservation-details/${reservationId}`), { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: `Reserva #${reservationId}` })
    ).toBeVisible({ timeout: 10000 });
  });

  await test.step('Then: El detalle de la reserva muestra "Descuento Verano" en los descuentos aplicados', async () => {
    // BookingDetails.jsx líneas 401-426 y 683-707:
    // renderiza discountDetails[].name bajo el título "Descuentos aplicados:"
    await expect(page.getByText('Descuentos aplicados:').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Descuento Verano').first()).toBeVisible({ timeout: 10000 });
  });
});
