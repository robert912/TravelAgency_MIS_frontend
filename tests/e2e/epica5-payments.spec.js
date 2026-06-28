/**
 * ============================================================
 * PRUEBAS FUNCIONALES — ÉPICA 5: Gestión de pagos en línea
 * ============================================================
 *
 * Criterios de aceptación (escritos en Gherkin):
 *
 * CA-EP5-01: Pago exitoso con datos de tarjeta de crédito válidos
 * CA-EP5-02: Sistema valida y rechaza datos de tarjeta inválidos
 * CA-EP5-03: Reserva cancelada no puede ser pagada y redirige al usuario
 *
 * Prerrequisitos:
 *   - Frontend corriendo en http://localhost:5173
 *   - Backend corriendo en http://localhost:8090
 *   - Keycloak corriendo en http://localhost:9090
 */

import { test, expect } from '@playwright/test';

// ── Datos de mock para reserva en estado PENDIENTE ────────────────────────────
const MOCK_PENDING_RESERVATION = {
  id: 9999,
  status: 'PENDIENTE',
  tourPackage: { name: 'Paquete Atacama Discovery', price: 200000 },
  passengersCount: 2,
  subtotal: 400000,
  discountAmount: 0,
  totalAmount: 400000,
  discountDetails: null,
};

// ── Datos de mock para reserva en estado CANCELADA ───────────────────────────
const MOCK_CANCELLED_RESERVATION = {
  ...MOCK_PENDING_RESERVATION,
  id: 9998,
  status: 'CANCELADA',
};

// ── Datos de mock para respuesta de pago exitoso ─────────────────────────────
const MOCK_PAYMENT_SUCCESS = {
  success: true,
  transactionId: 'TXN-PLAYWRIGHT-2026',
  message: 'Pago procesado exitosamente',
};


// ─────────────────────────────────────────────────────────────
// CA-EP5-01: Pago exitoso con datos de tarjeta válidos
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: Pago exitoso de una reserva pendiente
 *   Given  un usuario autenticado con una reserva en estado PENDIENTE
 *   When   el usuario navega a la página de pago de esa reserva
 *     And  verifica el resumen de la reserva
 *     And  ingresa datos de tarjeta de crédito válidos (16 dígitos, fecha, CVV)
 *     And  confirma el pago
 *   Then   el sistema registra el pago como aprobado
 *     And  muestra un diálogo de confirmación con el número de transacción
 *     And  redirige al usuario a "Mis Reservas"
 */
test('CA-EP5-01: Pago exitoso con datos de tarjeta de crédito válidos', async ({ page }) => {

  await test.step('Given: Existe una reserva en estado PENDIENTE', async () => {
    // Interceptar la carga de la reserva para devolver datos controlados
    await page.route(`**/api/reservations/${MOCK_PENDING_RESERVATION.id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_PENDING_RESERVATION }),
      });
    });

    // Interceptar el procesamiento del pago para simular éxito
    await page.route('**/api/payments/process', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PAYMENT_SUCCESS),
      });
    });

    await page.goto(`/payment/${MOCK_PENDING_RESERVATION.id}`);

    // Verificar que la página de pago cargó correctamente (Step 0 — Verificar reserva)
    await expect(page.getByText('Pago de Reserva')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Resumen de la reserva')).toBeVisible();
  });

  await test.step('When: El usuario verifica el resumen y avanza al formulario de pago', async () => {
    // Verificar que el nombre del paquete y el monto son visibles
    await expect(page.getByText(MOCK_PENDING_RESERVATION.tourPackage.name)).toBeVisible();
    await expect(page.getByText('Total a pagar')).toBeVisible();

    // Avanzar al paso 2 (Datos de pago)
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Datos de pago')).toBeVisible({ timeout: 10000 });
  });

  await test.step('When: El usuario ingresa datos de tarjeta de crédito válidos', async () => {
    // Número de tarjeta (16 dígitos)
    await page.getByLabel('Número de tarjeta').fill('4111111111111111');

    // Nombre del titular
    await page.getByLabel('Nombre del titular').fill('Juan Playwright Tester');

    // Fecha de expiración
    await page.getByLabel('Fecha de expiración').fill('12/28');

    // CVV (3 dígitos)
    await page.getByLabel('CVV').fill('123');

    // Continuar al paso de confirmación
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Confirmar pago')).toBeVisible({ timeout: 10000 });
  });

  await test.step('When: El usuario confirma el pago', async () => {
    // Verificar que se muestra el resumen de la transacción
    await expect(page.getByText('Detalles de la transacción')).toBeVisible();
    await expect(page.getByText('Juan Playwright Tester')).toBeVisible();

    // Confirmar el pago
    await page.getByRole('button', { name: 'Confirmar pago' }).click();
  });

  await test.step('Then: Sistema muestra confirmación con número de transacción', async () => {
    // SweetAlert2 de éxito
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.swal2-title')).toContainText('Pago exitoso');

    // El ID de transacción debe estar visible
    await expect(page.locator('.swal2-html-container')).toContainText(
      MOCK_PAYMENT_SUCCESS.transactionId,
    );
  });

  await test.step('Then: El sistema redirige a Mis Reservas', async () => {
    await page.locator('.swal2-confirm').click();
    await expect(page).toHaveURL(/my-reservations/, { timeout: 10000 });
  });
});


// ─────────────────────────────────────────────────────────────
// CA-EP5-02: Sistema valida y rechaza datos de tarjeta inválidos
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: Validación de datos de tarjeta incorrectos
 *   Given  un usuario autenticado en el formulario de datos de pago
 *     And  tiene una reserva en estado PENDIENTE
 *   When   el usuario ingresa un número de tarjeta con menos de 16 dígitos
 *     And  ingresa un CVV con menos de 3 dígitos
 *     And  hace clic en "Continuar"
 *   Then   el sistema muestra mensajes de error de validación en cada campo
 *     And  no avanza al paso de confirmación
 */
test('CA-EP5-02: Sistema valida y rechaza datos de tarjeta inválidos', async ({ page }) => {

  await test.step('Given: Usuario en la página de pago de una reserva PENDIENTE', async () => {
    await page.route(`**/api/reservations/${MOCK_PENDING_RESERVATION.id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_PENDING_RESERVATION }),
      });
    });

    await page.goto(`/payment/${MOCK_PENDING_RESERVATION.id}`);
    await expect(page.getByText('Pago de Reserva')).toBeVisible({ timeout: 15000 });

    // Avanzar al formulario de datos de pago
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Datos de pago')).toBeVisible({ timeout: 10000 });
  });

  await test.step('When: El usuario ingresa datos de tarjeta inválidos e intenta continuar', async () => {
    // Número de tarjeta incompleto (solo 8 dígitos)
    await page.getByLabel('Número de tarjeta').fill('12345678');

    // Nombre válido (para aislar los errores de los otros campos)
    await page.getByLabel('Nombre del titular').fill('Juan Test');

    // Fecha de expiración inválida (formato incorrecto)
    await page.getByLabel('Fecha de expiración').fill('13/99');

    // CVV inválido (solo 2 dígitos)
    await page.getByLabel('CVV').fill('12');

    // Intentar continuar
    await page.getByRole('button', { name: 'Continuar' }).click();
  });

  await test.step('Then: El sistema muestra errores de validación en el número de tarjeta', async () => {
    // Buscar el helper text de error del campo número de tarjeta
    const cardError = page.locator('.MuiFormHelperText-root.Mui-error').filter({
      hasText: 'inválido',
    });
    await expect(cardError.first()).toBeVisible({ timeout: 8000 });
  });

  await test.step('Then: El sistema NO avanza al paso de confirmación', async () => {
    // El texto "Confirmar pago" NO debe aparecer (aún estamos en el paso 2)
    await expect(page.getByText('Datos de pago')).toBeVisible();
    await expect(page.getByText('Confirmar pago')).not.toBeVisible();
  });
});


// ─────────────────────────────────────────────────────────────
// CA-EP5-03: Reserva cancelada no puede ser pagada
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: Intento de pago de una reserva cancelada
 *   Given  un usuario autenticado con una reserva en estado CANCELADA
 *   When   el usuario navega a la página de pago de esa reserva
 *   Then   el sistema muestra un mensaje informando que la reserva está cancelada
 *     And  redirige automáticamente al usuario a "Mis Reservas"
 *     And  no permite ingresar datos de pago
 */
test('CA-EP5-03: Reserva cancelada no puede ser pagada y redirige al usuario', async ({ page }) => {

  await test.step('Given: Existe una reserva en estado CANCELADA', async () => {
    // Interceptar la carga de la reserva para devolver estado CANCELADA
    await page.route(`**/api/reservations/${MOCK_CANCELLED_RESERVATION.id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_CANCELLED_RESERVATION }),
      });
    });
  });

  await test.step('When: El usuario navega a la página de pago de esa reserva', async () => {
    await page.goto(`/payment/${MOCK_CANCELLED_RESERVATION.id}`);
  });

  await test.step('Then: El sistema muestra diálogo informando que la reserva está cancelada', async () => {
    // SweetAlert2 debe aparecer con el mensaje de cancelación
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.swal2-title')).toContainText('cancelada', { ignoreCase: true });
  });

  await test.step('Then: Al confirmar el diálogo, el usuario es redirigido a Mis Reservas', async () => {
    // Confirmar el diálogo
    await page.locator('.swal2-confirm').click();

    // Verificar redirección
    await expect(page).toHaveURL(/my-reservations/, { timeout: 10000 });
  });

  await test.step('Then: El formulario de pago no es accesible', async () => {
    // En la página de Mis Reservas no debe estar el formulario de tarjeta
    await expect(page.getByLabel('Número de tarjeta')).not.toBeVisible();
    await expect(page.getByLabel('CVV')).not.toBeVisible();
  });
});
