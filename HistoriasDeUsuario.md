# Historias de Usuario — TravelAgency MIS
## Épica 4: Proceso de reserva en línea / Épica 5: Gestión de pagos en línea

---

## Tabla de Historias de Usuario

---

### HU-001 — Realizar una reserva de paquete turístico

| | |
|---|---|
| **Historia de usuario** | Como **cliente autenticado en el sistema**, **quiero** seleccionar un paquete turístico disponible y completar el proceso de reserva indicando mis datos y los de los pasajeros, **para** asegurar mi cupo en el viaje de mi preferencia y recibir una confirmación con el número de reserva. |
| **Criterios de aceptación** | **CA-EP4-01:** Dado que el cliente no está autenticado y navega a la página principal, cuando selecciona un paquete disponible, hace clic en "Reservar Ahora", inicia sesión con sus credenciales de Keycloak, indica 1 pasajero, ingresa su RUT (autocompletado desde la BD) y confirma la reserva en el paso de resumen, entonces el sistema debe crear la reserva con estado **PENDIENTE**, mostrar un diálogo "¡Reserva confirmada!" con el número de reserva asignado, y al cerrar el diálogo redirigir al cliente a "Mis Reservas" donde la reserva aparece en la lista. |

---

### HU-002 — Obtener descuento por grupo al realizar una reserva

| | |
|---|---|
| **Historia de usuario** | Como **cliente autenticado en el sistema**, **quiero** que el sistema aplique automáticamente un descuento porcentual cuando realizo una reserva para cuatro o más personas, **para** obtener un precio más conveniente por la compra grupal sin necesidad de solicitarlo manualmente. |
| **Criterios de aceptación** | **CA-EP4-02:** Dado que el cliente está autenticado y se encuentra en el formulario de reserva de un paquete disponible, cuando selecciona 4 pasajeros en el campo "Número de pasajeros", entonces el sistema debe mostrar inmediatamente una alerta informando que se aplicó un descuento del 10% por reserva grupal. Cuando el cliente completa los datos de los 4 pasajeros (con autocompletado desde BD o llenado manual) y avanza al resumen, el diálogo de pre-confirmación debe listar el descuento bajo "Descuentos aplicados:" indicando el nombre de la promoción ("Descuento Verano"). Una vez confirmada la reserva, al navegar al detalle de la reserva creada, la sección "Descuentos aplicados" debe mostrar "Descuento Verano" con el monto descontado. |

---

### HU-003 — Verificar que los cupos disponibles se actualizan al confirmar una reserva

| | |
|---|---|
| **Historia de usuario** | Como **administrador del sistema**, **quiero** que los cupos disponibles de un paquete turístico se descuenten automáticamente al confirmar una reserva, **para** garantizar que la disponibilidad reflejada en el sistema sea siempre precisa e impida la sobrereserva. |
| **Criterios de aceptación** | **CA-EP4-03:** Dado que el cliente está autenticado y el sistema registra X cupos disponibles para un paquete (consultados via API `/api/tour-packages/{id}/availability`), cuando el cliente ingresa 2 pasajeros y confirma la reserva, entonces el sistema debe registrar la reserva exitosamente y al consultar nuevamente la disponibilidad via API los cupos disponibles deben ser X − 2. |

---

### HU-004 — Pagar una reserva en línea con tarjeta de crédito

| | |
|---|---|
| **Historia de usuario** | Como **cliente autenticado con una reserva en estado PENDIENTE**, **quiero** ingresar los datos de mi tarjeta de crédito y confirmar el pago del monto total de la reserva, **para** completar el proceso de compra del paquete turístico y recibir la confirmación de la transacción. |
| **Criterios de aceptación** | **CA-EP5-01:** Dado que el cliente tiene una reserva en estado PENDIENTE y navega a su página de pago, cuando verifica el resumen de la reserva, ingresa datos de tarjeta válidos (número de 16 dígitos, fecha de expiración en formato MM/AA y CVV de 3 dígitos) y confirma el pago, entonces el sistema debe registrar el pago como aprobado, mostrar un diálogo de confirmación con el número de transacción generado y redirigir al cliente a la sección "Mis Reservas". |
| | **CA-EP5-02:** Dado que el cliente se encuentra en el formulario de datos de pago, cuando ingresa un número de tarjeta con menos de 16 dígitos, un CVV con menos de 3 dígitos o una fecha de expiración con formato incorrecto, y hace clic en el botón "Continuar", entonces el sistema debe mostrar mensajes de error de validación en cada campo incorrecto y no debe permitir avanzar al paso de confirmación del pago. |

---

### HU-005 — Visualizar restricción de pago en reservas con estado inválido

| | |
|---|---|
| **Historia de usuario** | Como **cliente autenticado en el sistema**, **quiero** que el sistema me informe de forma clara cuando intento pagar una reserva cuyo estado no lo permite (cancelada, expirada o ya pagada), **para** entender el motivo por el que no puedo continuar con el pago y ser redirigido correctamente. |
| **Criterios de aceptación** | **CA-EP5-03:** Dado que el cliente tiene una reserva en estado CANCELADA e intenta navegar a la página de pago de esa reserva, cuando la página carga y verifica el estado de la reserva, entonces el sistema debe mostrar un diálogo informando que la reserva está cancelada y no puede ser pagada, no debe permitir el ingreso de datos de tarjeta, y debe redirigir al cliente a la sección "Mis Reservas" al confirmar el diálogo. |

---

## Resumen de criterios de aceptación

| Test automatizado | Historia de usuario | Épica | Archivo de prueba |
|-------------------|---------------------|-------|-------------------|
| CA-EP4-01 | HU-001 — Reserva exitosa con 1 pasajero | Épica 4 | `ep4-ca01.spec.js` |
| CA-EP4-02 | HU-002 — Descuento grupal 10% con 4 pasajeros | Épica 4 | `ep4-ca02.spec.js` |
| CA-EP4-03 | HU-003 — Cupos descontados al confirmar reserva | Épica 4 | `ep4-ca03.spec.js` |
| CA-EP5-01 | HU-004 — Pago exitoso con tarjeta válida | Épica 5 | `epica5-payments.spec.js` |
| CA-EP5-02 | HU-004 — Validación de datos de tarjeta inválidos | Épica 5 | `epica5-payments.spec.js` |
| CA-EP5-03 | HU-005 — Reserva cancelada no puede ser pagada | Épica 5 | `epica5-payments.spec.js` |
