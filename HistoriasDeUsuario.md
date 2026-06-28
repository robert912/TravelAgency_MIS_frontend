# Historias de Usuario — TravelAgency MIS
## Épica 4: Proceso de reserva en línea / Épica 5: Gestión de pagos en línea

---

## Tabla de Historias de Usuario

| ID | Historia de usuario | Criterios de aceptación |
|----|---------------------|------------------------|
| **HU-001** Proceso de reserva en línea | Como **cliente del sistema**, quiero seleccionar un paquete turístico disponible y completar el proceso de reserva indicando mis datos y los de los pasajeros, para asegurar mi cupo en el viaje, obtener el precio correcto según el grupo y verificar que la disponibilidad del paquete se actualice en tiempo real. | • **CA-EP4-01:** Dado que el cliente está autenticado (sesión precargada vía setup) y estando en la página principal, selecciona un paquete para ver su detalle, luego el cliente presiona el botón para reservar un paquete para navegar al formulario de reserva de un paquete disponible, cuando indica 1 pasajero, ingresa su RUT (autocompletado desde BD) y confirma la reserva en el paso de resumen, entonces el sistema debe crear la reserva con estado PENDIENTE, mostrar el diálogo "¡Reserva confirmada!" con el número asignado y redirigir a "Mis Reservas" donde la reserva aparece en la lista. (Automatizado) |
| | | • **CA-EP4-02:** Dado que el cliente se encuentra reservando un paquete turístico y selecciona 4 pasajeros en el formulario de reserva, cuando el sistema detecta la cantidad grupal, entonces debe mostrar inmediatamente una alerta de "Descuento por grupo aplicado (10%)". Al confirmar, el diálogo de pre-confirmación debe listar "Descuento Verano" bajo "Descuentos aplicados:" y el detalle de la reserva creada debe mostrar el descuento con su monto. (Automatizado) |
| | | • **CA-EP4-03:** Dado que el cliente se encuentra reservando un paquete turístico y el sistema registra X cupos disponibles para un paquete (consultados via API `/api/tour-packages/{id}/availability`), cuando el cliente confirma una reserva para 2 pasajeros, entonces el sistema debe registrar la reserva exitosamente y al consultar nuevamente la disponibilidad los cupos deben ser X − 2. (Automatizado) |
| **HU-002** Gestión de pagos en línea | Como **cliente con una reserva en estado PENDIENTE**, quiero ingresar los datos de mi tarjeta de crédito y confirmar el pago en línea, para completar la compra del paquete turístico, recibir confirmación de la transacción y ser informado claramente si el estado de la reserva no permite el pago. | • **CA-EP5-01:** Dado que el cliente está autenticado en "Mis Reservas" y existe al menos una reserva en estado PENDIENTE, cuando hace clic en "Completar pago", ingresa datos de tarjeta válidos (número de 16 dígitos, nombre del titular, fecha MM/AA, CVV de 3 dígitos) y confirma el pago, entonces el sistema debe registrar el pago como aprobado, mostrar un diálogo de pago exitoso y redirigir a "Mis Reservas" donde la reserva ahora aparece con estado Pagada. (Automatizado) |
| | | • **CA-EP5-02:** Dado que el cliente se encuentra en el formulario de datos de pago, cuando ingresa un número de tarjeta incompleto (menos de 16 dígitos), un CVV de menos de 3 dígitos o una fecha con formato incorrecto y hace clic en "Continuar", entonces el sistema debe mostrar mensajes de error de validación en cada campo incorrecto y no debe permitir avanzar al paso de confirmación. (Automatizado) |
| | | • **CA-EP5-03:** Dado que el cliente está en "Mis Reservas" con una reserva en estado PENDIENTE, cuando cancela esa reserva mediante el botón "Cancelar reserva" y confirma el diálogo, entonces la reserva debe aparecer con estado Cancelada y el botón "Completar pago" no debe estar disponible para esa reserva, mostrando únicamente el botón "Detalles". (Automatizado) |

---

## Resumen de criterios de aceptación

| Test automatizado | Historia de usuario | Épica | Archivo de prueba |
|-------------------|---------------------|-------|-------------------|
| CA-EP4-01 | HU-001 — Reserva exitosa con 1 pasajero | Épica 4 | `epica4-reservas.spec.js` |
| CA-EP4-02 | HU-001 — Descuento grupal 10% con 4 pasajeros | Épica 4 | `epica4-reservas.spec.js` |
| CA-EP4-03 | HU-001 — Cupos descontados al confirmar reserva | Épica 4 | `epica4-reservas.spec.js` |
| CA-EP5-01 | HU-002 — Pago exitoso con tarjeta válida | Épica 5 | `epica5-payments.spec.js` |
| CA-EP5-02 | HU-002 — Validación de datos de tarjeta inválidos | Épica 5 | `epica5-payments.spec.js` |
| CA-EP5-03 | HU-002 — Reserva cancelada no muestra opción de pago | Épica 5 | `epica5-payments.spec.js` |
