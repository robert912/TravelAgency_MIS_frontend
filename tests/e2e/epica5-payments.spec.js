import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────
// CA-EP5-01: Pago exitoso con datos de tarjeta válidos
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: Pago exitoso de una reserva pendiente real desde Mis Reservas
 *   Given  un usuario autenticado navega a "Mis Reservas"
 *     And  existe al menos una reserva en estado Pendiente
 *   When   hace clic en "Completar pago" de esa reserva
 *     And  verifica el resumen y avanza
 *     And  ingresa datos de tarjeta de crédito válidos
 *     And  confirma el pago
 *   Then   el sistema muestra diálogo de pago exitoso
 *     And  redirige a "Mis Reservas"
 *     And  la reserva que estaba Pendiente ahora aparece como Pagada
 */

test('CA-EP5-01: Pago exitoso con datos de tarjeta de crédito válidos', async ({ page }) => {

  let reservationId;

  await test.step('Given: Usuario autenticado navega a Mis Reservas', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: 'menu' }).click();
    await page.getByRole('button', { name: 'Mis Reservas' }).click();
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
  });

  await test.step('Given: Existe al menos una reserva en estado Pendiente', async () => {
    const pendingCard = page.locator('.MuiCard-root').filter({ hasText: 'Pendiente' }).first();
    await expect(pendingCard).toBeVisible({ timeout: 10000 });
    // Capturar el número de reserva para verificar al final que quedó Pagada
    const headingText = await pendingCard.getByRole('heading').first().textContent();
    reservationId = headingText.match(/#(\d+)/)?.[1];
    expect(reservationId).toBeTruthy();
    console.log(`Reserva a pagar: #${reservationId}`);
  });

  await test.step('When: El usuario hace clic en "Completar pago"', async () => {
    await page.getByRole('button', { name: 'Completar pago' }).first().click();
    await expect(page).toHaveURL(/payment/, { timeout: 10000 });
  });

  await test.step('When: Verifica el resumen de la reserva y avanza', async () => {
    await expect(page.getByText('Pago de Reserva')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Método de pago')).toBeVisible({ timeout: 10000 });
  });

  await test.step('When: Ingresa datos de tarjeta de crédito válidos', async () => {
    await page.getByRole('textbox', { name: 'Número de tarjeta' }).fill('1111 1111 1111 1111');
    await page.getByRole('textbox', { name: 'Nombre del titular' }).fill('Roberto Orellana');
    await page.getByRole('textbox', { name: 'Fecha de expiración' }).fill('11/11');
    await page.getByRole('textbox', { name: 'CVV' }).fill('111');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Detalles de la transacción')).toBeVisible({ timeout: 10000 });
  });

  await test.step('When: El usuario confirma el pago', async () => {
    const confirmBtn = page.getByRole('button', { name: 'Confirmar pago' });
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click();
  });

  await test.step('Then: El sistema muestra diálogo de pago exitoso', async () => {
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.swal2-title')).toContainText('exitoso', { ignoreCase: true });
    await page.locator('.swal2-confirm').click();
  });

  await test.step('Then: Redirige a Mis Reservas y la reserva aparece como Pagada', async () => {
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
    const paidCard = page.locator('.MuiCard-root').filter({
      has: page.getByRole('heading', { name: `Reserva #${reservationId}` }),
    });
    await expect(paidCard).toBeVisible({ timeout: 10000 });
    await expect(paidCard.getByText(/pagad/i).first()).toBeVisible({ timeout: 5000 });
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
    await page.goto('/my-reservations/');
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
    await page.getByRole('button', { name: 'Completar pago' }).first().click();
    await expect(page).toHaveURL(/payment/, { timeout: 10000 });
  });

  await test.step('And: El usuario hace clic en "Completar pago"', async () => {
    // Avanzar al formulario de datos de pago
    await expect(page.getByText('Pago de Reserva')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Método de pago')).toBeVisible({ timeout: 10000 });
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
    await expect(page.getByText('Método de pago')).toBeVisible();
    await expect(page.getByText('Confirmar pago')).not.toBeVisible();
  });
});


// ─────────────────────────────────────────────────────────────
// CA-EP5-03: Reserva cancelada no muestra opción de pago
// ─────────────────────────────────────────────────────────────
/**
 * Scenario: El sistema no permite pagar una reserva cancelada
 *   Given  un usuario autenticado en "Mis Reservas" con una reserva PENDIENTE
 *   When   el usuario cancela esa reserva mediante el botón "Cancelar reserva"
 *     And  confirma la cancelación en el diálogo
 *   Then   la reserva aparece con estado "Cancelada"
 *     And  el botón "Completar pago" ya no está disponible para esa reserva
 *     And  solo el botón "Detalles" está disponible
 */
test('CA-EP5-03: Reserva cancelada no muestra opción de pago', async ({ page }) => {

  let reservationId;

  await test.step('Given: Usuario autenticado en Mis Reservas con una reserva PENDIENTE', async () => {
    await page.goto('/my-reservations');
    await expect(page).toHaveURL(/my-reservations/, { timeout: 15000 });
    const pendingCard = page.locator('.MuiCard-root').filter({ hasText: 'Pendiente' }).first();
    await expect(pendingCard).toBeVisible({ timeout: 10000 });
    const headingText = await pendingCard.getByRole('heading').first().textContent();
    reservationId = headingText.match(/#(\d+)/)?.[1];
    expect(reservationId).toBeTruthy();
    console.log(`Reserva a cancelar: #${reservationId}`);
  });

  await test.step('When: El usuario cancela la reserva', async () => {
    const pendingCard = page.locator('.MuiCard-root').filter({
      has: page.getByRole('heading', { name: `Reserva #${reservationId}` }),
    });
    await pendingCard.getByRole('button', { name: 'Cancelar' }).click();
  });

  await test.step('When: Confirma la cancelación en el diálogo', async () => {
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 8000 });
    await page.locator('.swal2-confirm').click();
    // Esperar el diálogo de éxito y cerrarlo
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 8000 });
    await page.locator('.swal2-confirm').click();
  });

  await test.step('Then: La reserva aparece con estado Cancelada', async () => {
    const cancelledCard = page.locator('.MuiCard-root').filter({
      has: page.getByRole('heading', { name: `Reserva #${reservationId}` }),
    });
    await expect(cancelledCard).toBeVisible({ timeout: 10000 });
    await expect(cancelledCard.getByText('Cancelada')).toBeVisible({ timeout: 5000 });
  });

  await test.step('Then: El botón "Completar pago" no está disponible para esa reserva', async () => {
    const cancelledCard = page.locator('.MuiCard-root').filter({
      has: page.getByRole('heading', { name: `Reserva #${reservationId}` }),
    });
    await expect(cancelledCard.getByRole('button', { name: 'Completar pago' })).not.toBeVisible();
  });

  await test.step('Then: Solo el botón "Detalles" está disponible', async () => {
    const cancelledCard = page.locator('.MuiCard-root').filter({
      has: page.getByRole('heading', { name: `Reserva #${reservationId}` }),
    });
    await expect(cancelledCard.getByRole('button', { name: 'Detalles' })).toBeVisible();
  });
});
