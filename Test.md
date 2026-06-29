# Evaluación 3 — Pruebas Funcionales y No Funcionales
## TravelAgency MIS — Sistema de Gestión de Paquetes Turísticos

---

## Índice

1. [Estructura de archivos](#1-estructura-de-archivos)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Pruebas Funcionales — Playwright (Épica 4 y 5)](#3-pruebas-funcionales--playwright-épica-4-y-5)
   - [Configuración inicial](#31-configuración-inicial)
   - [Criterios de aceptación Épica 4](#32-criterios-de-aceptación--épica-4-proceso-de-reserva-en-línea)
   - [Criterios de aceptación Épica 5](#33-criterios-de-aceptación--épica-5-gestión-de-pagos-en-línea)
   - [Cómo ejecutar Playwright](#34-cómo-ejecutar-playwright)
4. [Pruebas No Funcionales — K6 (Épica 7)](#4-pruebas-no-funcionales--k6-épica-7)
   - [Load Testing](#41-load-testing)
   - [Stress Testing](#42-stress-testing)
   - [Volume Testing](#43-volume-testing)
   - [Cómo ejecutar K6](#44-cómo-ejecutar-k6)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Configuración Keycloak para K6](#6-configuración-keycloak-para-k6)
7. [Resumen de cobertura](#7-resumen-de-cobertura)

---

## 1. Estructura de archivos

```
TravelAgency_MIS_frontend/
├── playwright.config.ts                  <- Configuración global de Playwright
├── Test.md                               <- Este archivo
├── tests/
│   ├── e2e/
│   │   ├── .auth/
│   │   │   └── user.json                 <- Sesión guardada (generada por auth.setup.js)
│   │   ├── auth.setup.js                 <- Login en Keycloak (se ejecuta antes de Épica 4 y 5)
│   │   ├── epica4-reservas.spec.js       <- CA-EP4-01, CA-EP4-02, CA-EP4-03
│   │   └── epica5-payments.spec.js       <- CA-EP5-01, CA-EP5-02, CA-EP5-03
│   └── k6/
│       ├── load-test.js                  <- Load testing (10/50/100/200 usuarios)
│       ├── stress-test.js                <- Stress testing (rampa hasta punto de quiebre)
│       └── volume-test.js                <- Volume testing (500/1000/5000/10000 registros)
```

---

## 2. Prerrequisitos

### Para Playwright (pruebas E2E)

| Requisito | Versión | Detalle |
|-----------|---------|---------|
| Node.js | >= 18 | Requerido |
| @playwright/test | ^1.61.1 | Ya instalado en devDependencies |
| Chromium | Automático | Instalado con `npx playwright install chromium` |
| Frontend corriendo | http://localhost:5173 | Iniciar con `npm run dev` |
| Backend corriendo | http://localhost:8090 | Iniciar con IntelliJ o `mvn spring-boot:run` |
| Keycloak corriendo | http://localhost:9090 | Iniciar con `kc.bat start-dev --http-port=9090` |
| Usuario de prueba | Rol CLIENT en Keycloak | realm: `travel-realm` |

### Para K6 (pruebas de rendimiento)

| Requisito | Detalle |
|-----------|---------|
| K6 instalado globalmente | Descargar desde https://k6.io/docs/get-started/installation/ |
| Backend corriendo | http://localhost:8090 |
| Keycloak corriendo | http://localhost:9090 |
| Usuario admin en Keycloak | Rol `Admin` asignado en `travel-realm` |
| Direct Access Grants activado | En el cliente `travel-frontend` de Keycloak (ver sección 6) |

---

## 3. Pruebas Funcionales — Playwright (Épica 4 y 5)

### 3.1 Configuración inicial

Instalar el navegador Chromium (solo la primera vez):

```bash
cd d:\MIS\TravelAgency_MIS_frontend
npx playwright install chromium
```

Crear el archivo `.env.test` en la raíz del frontend:

```env
TEST_USER=roberto.orellana.t@usach.cl
TEST_PASSWORD=Admin1234
TEST_PACKAGE_ID=1
BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:8090
```

> `TEST_USER` y `TEST_PASSWORD` son las credenciales del usuario en Keycloak que usa `auth.setup.js` para guardar la sesión en `.auth/user.json`.
> `TEST_PACKAGE_ID` debe ser el ID de un paquete turístico con cupos disponibles en la BD.
> `API_BASE_URL` es usado en CA-EP4-03 para consultar `GET /api/tour-packages/{id}/availability`.

---

### 3.2 Criterios de aceptación — Épica 4: Proceso de reserva en línea

> **Nota:** Los tres tests de Épica 4 usan la sesión guardada por `auth.setup.js` (`storageState`). El navegador arranca autenticado y navega directamente a `/booking/:id`, sin pasar por Keycloak.

#### CA-EP4-01: Reserva exitosa con datos de pasajero válidos

**Archivo:** `tests/e2e/epica4-reservas.spec.js`

```gherkin
Scenario: Reserva exitosa con un pasajero registrado
  Given  el usuario está autenticado (sesión precargada) en el formulario de reserva
    And  existe el paquete turístico con cupos disponibles
  When   indica 1 pasajero y avanza al paso de datos
    And  ingresa el RUT del pasajero (autocompletado desde BD)
    And  avanza al resumen y confirma la reserva
  Then   el sistema crea la reserva con estado PENDIENTE
    And  muestra el diálogo "¡Reserva confirmada!" con el número de reserva asignado
    And  redirige a "Mis Reservas" donde la reserva aparece en la lista
```

**Aserciones (Then) automatizadas:**
- `.swal2-title` contiene `¡Reserva confirmada!`
- `.swal2-html-container` contiene `Número de reserva:` y un `#N`
- La URL cambia a `/my-reservations`
- `heading` con `Reserva #N` es visible en la lista

---

#### CA-EP4-02: El sistema aplica 10% de descuento al seleccionar 4 o más pasajeros

**Archivo:** `tests/e2e/epica4-reservas.spec.js`

```gherkin
Scenario: Reserva grupal con descuento del 10% y 4 pasajeros
  Given  el usuario está autenticado en el formulario de reserva
  When   selecciona 4 pasajeros en el campo "Número de pasajeros"
  Then   el sistema muestra una alerta "Descuento por grupo aplicado (10%)"
  When   completa los datos de los 4 pasajeros (autocompletado BD o manual)
    And  avanza al resumen y confirma la reserva
  Then   el diálogo de pre-confirmación lista "Descuento Verano" bajo "Descuentos aplicados:"
    And  el sistema confirma la reserva con el número asignado
    And  el detalle de la reserva muestra "Descuento Verano" con su monto
```

**Aserciones (Then) automatizadas:**
- `.MuiAlert-root` contiene `Descuento por grupo aplicado` y `10%`
- `.swal2-html-container` (pre-confirmación) contiene `Descuentos aplicados:` y `Descuento Verano`
- En `/reservation-details/:id`: texto `Descuentos aplicados:` y `Descuento Verano` visibles

---

#### CA-EP4-03: El sistema descuenta los cupos disponibles al confirmar una reserva

**Archivo:** `tests/e2e/epica4-reservas.spec.js`

```gherkin
Scenario: Los cupos se descuentan correctamente al confirmar una reserva
  Given  el usuario está autenticado en el formulario de reserva
    And  el paquete registra X cupos disponibles (GET /api/tour-packages/{id}/availability)
  When   selecciona 2 pasajeros y confirma la reserva
  Then   el sistema registra la reserva exitosamente
    And  al consultar nuevamente la disponibilidad via API los cupos son X − 2
```

**Aserciones (Then) automatizadas:**
- `.swal2-title` contiene `¡Reserva confirmada!`
- `GET /api/tour-packages/{id}/availability` → `availableSlots === initialSlots - 2`

> **Técnica usada:** `page.request.get()` consulta la API directamente antes y después de la reserva, sin depender del DOM ni de navegación adicional.

---

### 3.3 Criterios de aceptación — Épica 5: Gestión de pagos en línea

#### CA-EP5-01: Pago exitoso con datos de tarjeta de crédito válidos

**Archivo:** `tests/e2e/epica5-payments.spec.js`

```gherkin
Scenario: Pago exitoso de una reserva pendiente desde Mis Reservas
  Given  un usuario autenticado navega a "Mis Reservas"
    And  existe al menos una reserva en estado Pendiente
  When   el usuario hace clic en "Completar pago" de esa reserva
    And  verifica el resumen de la reserva y avanza
    And  ingresa datos de tarjeta de crédito válidos (16 dígitos, fecha, CVV)
    And  confirma el pago en el paso de confirmación
  Then   el sistema muestra un diálogo de pago exitoso
    And  redirige al usuario a "Mis Reservas"
    And  la reserva que estaba Pendiente aparece ahora como Pagada
```

**Datos de tarjeta usados en el test:**

| Campo | Valor de prueba |
|-------|----------------|
| Número de tarjeta | `1111 1111 1111 1111` (16 dígitos) |
| Nombre del titular | `Roberto Orellana` |
| Fecha de expiración | `11/11` |
| CVV | `111` |

**Aserciones (Then) automatizadas:**
- `.swal2-title` contiene `exitoso` (insensible a mayúsculas)
- La URL cambia a `/my-reservations`
- La tarjeta con `Reserva #N` muestra texto que coincide con `/pagad/i`

---

#### CA-EP5-02: Sistema valida y rechaza datos de tarjeta inválidos

**Archivo:** `tests/e2e/epica5-payments.spec.js`

```gherkin
Scenario: Validación de datos de tarjeta incorrectos
  Given  un usuario autenticado en el formulario de datos de pago
    And  tiene una reserva en estado PENDIENTE
  When   el usuario ingresa un número de tarjeta con menos de 16 dígitos
    And  ingresa un CVV con menos de 3 dígitos
    And  ingresa una fecha de expiración con formato inválido
    And  hace clic en "Continuar"
  Then   el sistema muestra mensajes de error de validación en los campos incorrectos
    And  no avanza al paso de confirmación de pago
```

**Datos inválidos usados en el test:**

| Campo | Valor inválido | Error esperado |
|-------|---------------|----------------|
| Número de tarjeta | `12345678` (solo 8 dígitos) | `Número de tarjeta inválido (16 dígitos)` |
| Fecha de expiración | `13/99` (mes imposible) | `Formato inválido (MM/YY o MM/YYYY)` |
| CVV | `12` (solo 2 dígitos) | `CVV inválido (3 dígitos)` |

**Aserciones (Then) automatizadas:**
- Existe al menos un `.MuiFormHelperText-root.Mui-error` con texto `inválido`
- El título `Datos de pago` sigue visible (no avanzó al paso 3)
- El título `Confirmar pago` NO es visible en pantalla

---

#### CA-EP5-03: Reserva cancelada no muestra opción de pago

**Archivo:** `tests/e2e/epica5-payments.spec.js`

```gherkin
Scenario: El sistema no permite pagar una reserva cancelada
  Given  un usuario autenticado en "Mis Reservas" con una reserva en estado Pendiente
  When   el usuario hace clic en "Cancelar reserva" de esa reserva
    And  confirma la cancelación en el diálogo
  Then   la reserva aparece con estado Cancelada
    And  el botón "Completar pago" ya no está disponible para esa reserva
    And  solo el botón "Detalles" está disponible
```

**Aserciones (Then) automatizadas:**
- La tarjeta `Reserva #N` muestra el chip `Cancelada`
- `getByRole('button', { name: 'Completar pago' })` no es visible en esa tarjeta
- `getByRole('button', { name: 'Detalles' })` es visible en esa tarjeta

---

### 3.4 Cómo ejecutar Playwright

> Asegurarse de que **frontend**, **backend** y **Keycloak** estén corriendo antes de ejecutar.

```bash
# Ejecutar todos los tests (setup + épica4 + épica5)
npm run test:e2e

# Ejecutar con interfaz gráfica interactiva
npm run test:e2e:ui

# Ver reporte HTML con resultados detallados
npm run test:e2e:report

# Ejecutar solo los tests de Épica 4
npx playwright test --project=epica4-reservas

# Ejecutar solo los tests de Épica 5
npx playwright test --project=epica5-pagos

# Ejecutar con credenciales específicas por variable de entorno
TEST_USER=roberto TEST_PASSWORD=miClave123 npm run test:e2e

# Ejecutar con un ID de paquete específico
TEST_PACKAGE_ID=3 npm run test:e2e

# Ejecutar en modo headless (sin abrir el navegador)
npx playwright test --headed=false

# Ver detalles de cada paso del Gherkin en consola
npx playwright test --reporter=list
```

**Resultado esperado al pasar los 7 tests:**

```
Running 7 tests using 1 worker

  ✓ [setup]           auth.setup.js > Autenticar usuario de prueba en Keycloak
  ✓ [epica4-reservas] epica4-reservas.spec.js > CA-EP4-01: Reserva exitosa con datos de pasajero válidos
  ✓ [epica4-reservas] epica4-reservas.spec.js > CA-EP4-02: El sistema aplica 10% de descuento al seleccionar 4 o más pasajeros
  ✓ [epica4-reservas] epica4-reservas.spec.js > CA-EP4-03: El sistema descuenta 2 cupos al confirmar una reserva
  ✓ [epica5-pagos]    epica5-payments.spec.js > CA-EP5-01: Pago exitoso con datos de tarjeta de crédito válidos
  ✓ [epica5-pagos]    epica5-payments.spec.js > CA-EP5-02: Sistema valida y rechaza datos de tarjeta inválidos
  ✓ [epica5-pagos]    epica5-payments.spec.js > CA-EP5-03: Reserva cancelada no puede ser pagada y redirige al usuario

  7 passed (3m)
```

---

## 4. Pruebas No Funcionales — K6 (Épica 7)

Los tres scripts prueban directamente los endpoints del backend:

- `GET /api/reports/sales?startDate=...&endDate=...`
- `GET /api/reports/package-ranking?startDate=...&endDate=...`

Ambos requieren token JWT con rol `Admin`, obtenido automáticamente de Keycloak en la función `setup()` de cada script.

---

### 4.1 Load Testing

**Archivo:** `tests/k6/load-test.js`

**Objetivo:** Medir el comportamiento del sistema bajo distintos niveles de carga concurrente para construir la tabla comparativa.

**Escenarios ejecutados en secuencia:**

| Escenario | Usuarios concurrentes | Duración | Inicio |
|-----------|----------------------|----------|--------|
| Carga baja | 10 VUs | 30 s | 0 s |
| Carga normal | 50 VUs | 30 s | 40 s |
| Carga alta | 100 VUs | 30 s | 80 s |
| Carga muy alta | 200 VUs | 30 s | 120 s |

**Umbrales de aceptación definidos:**
- `p(95) < 3 000 ms` — 95% de peticiones responden en menos de 3 segundos
- `error_rate < 5%` — tasa de error menor al 5%

**Métricas personalizadas registradas:**

| Métrica K6 | Descripción |
|------------|-------------|
| `sales_report_duration` | Latencia del endpoint `/api/reports/sales` |
| `ranking_report_duration` | Latencia del endpoint `/api/reports/package-ranking` |
| `sales_report_errors` | Contador de errores en el reporte de ventas |
| `ranking_report_errors` | Contador de errores en el ranking |
| `error_rate` | Tasa global de errores |

**Tabla comparativa de resultados (completar con valores reales):**

| Usuarios | p50 (ms) | p90 (ms) | p95 (ms) | Req/s | Errores |
|----------|----------|----------|----------|-------|---------|
| 10 | ? | ? | ? | ? | ?% |
| 50 | ? | ? | ? | ? | ?% |
| 100 | ? | ? | ? | ? | ?% |
| 200 | ? | ? | ? | ? | ?% |

---

### 4.2 Stress Testing

**Archivo:** `tests/k6/stress-test.js`

**Objetivo:** Encontrar el punto de quiebre del sistema aumentando la carga progresivamente hasta que comience a fallar.

**Rampa de usuarios:**

| Etapa | Usuarios | Duración | Propósito |
|-------|----------|----------|-----------|
| 1 | 10 VUs | 30 s | Calentamiento |
| 2 | 50 VUs | 30 s | Carga normal |
| 3 | 100 VUs | 30 s | Carga moderada |
| 4 | 200 VUs | 30 s | Carga alta |
| 5 | 300 VUs | 30 s | Carga elevada |
| 6 | 500 VUs | 30 s | Estrés |
| 7 | 700 VUs | 30 s | Sobre-estrés (zona de quiebre) |
| 8 | 0 VUs | 30 s | Descenso gradual |

**Criterio de punto de quiebre:**
- `p(95) > 10 000 ms` — timeouts generalizados, o
- `stress_error_rate > 10%` — más del 10% de peticiones fallando

**Qué analizar en los resultados:**
- En qué etapa comienzan a aparecer errores
- Cuál es el tiempo de respuesta en el momento del quiebre
- Si el sistema se recupera una vez que baja la carga

**Tabla comparativa de resultados (completar con valores reales):**

| Usuarios | p50 (ms) | p95 (ms) | Errores | Estado del sistema |
|----------|----------|----------|---------|-------------------|
| 10 | ? | ? | ?% | Normal |
| 50 | ? | ? | ?% | Normal |
| 100 | ? | ? | ?% | Normal |
| 200 | ? | ? | ?% | Normal / Degradado |
| 300 | ? | ? | ?% | Degradado |
| 500 | ? | ? | ?% | Crítico |
| 700 | ? | ? | ?% | Quiebre |

---

### 4.3 Volume Testing

**Archivo:** `tests/k6/volume-test.js`

**Objetivo:** Evaluar cómo el volumen de datos en la BD afecta el tiempo de respuesta de los reportes, manteniendo un número fijo de usuarios concurrentes.

**Estrategia:** Rangos de fechas progresivamente más amplios fuerzan a la BD a procesar más registros por consulta.

**Escenarios:**

| Escenario | Rango de fechas | Registros aprox. | Usuarios | Duración |
|-----------|----------------|-----------------|----------|----------|
| Volumen bajo | 2026-06-01 → 2026-06-30 | ~500 registros | 20 VUs | 30 s |
| Volumen medio | 2026-01-01 → 2026-06-30 | ~1 000 registros | 20 VUs | 30 s |
| Volumen alto | 2025-01-01 → 2026-06-30 | ~5 000 registros | 20 VUs | 30 s |
| Volumen muy alto | 2023-01-01 → 2026-06-30 | ~10 000 registros | 20 VUs | 30 s |

> **Nota:** Para resultados representativos, poblar las tablas de la BD con registros en esos rangos de fechas antes de ejecutar (usar scripts SQL de inserción masiva).

**Umbrales de aceptación:**
- `p(95) < 5 000 ms` en todos los escenarios
- `volume_error_rate < 5%`

**Tabla comparativa de resultados (completar con valores reales):**

| Volumen BD | Usuarios | p50 (ms) | p90 (ms) | p95 (ms) | Errores |
|------------|----------|----------|----------|----------|---------|
| ~500 reg. | 20 | ? | ? | ? | ?% |
| ~1 000 reg. | 20 | ? | ? | ? | ?% |
| ~5 000 reg. | 20 | ? | ? | ? | ?% |
| ~10 000 reg. | 20 | ? | ? | ? | ?% |

---

### 4.4 Cómo ejecutar K6

#### Instalación de K6 en Windows

```powershell
# Opción 1: con Chocolatey
choco install k6

# Opción 2: con winget
winget install k6

# Opción 3: descargar el instalador MSI desde
# https://dl.k6.io/msi/k6-latest-amd64.msi

# Verificar instalación
k6 version
```

#### Comandos de ejecución

```bash
# ── LOAD TESTING ──────────────────────────────────────────────────────────────

# Ejecutar
k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/load-test.js

# Exportar resultados a CSV (para tabla comparativa en Excel)
k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/load-test.js --out csv=resultados/load-results.csv

# Para ver el dashboard integrado que trae k6
$env:K6_WEB_DASHBOARD="true"; $env:K6_WEB_DASHBOARD_EXPORT="report.html"; k6 run .\load-test.js


# ── STRESS TESTING ────────────────────────────────────────────────────────────

# Ejecutar
k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/stress-test.js

# Exportar resultados a CSV
k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/stress-test.js --out csv=resultados/stress-results.csv


# ── VOLUME TESTING ────────────────────────────────────────────────────────────

# Ejecutar
k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/volume-test.js

# Exportar resultados a CSV
k6 run -e ADMIN_USER=admin -e ADMIN_PASSWORD=admin123 tests/k6/volume-test.js --out csv=resultados/volume-results.csv


# ── CON URLs PERSONALIZADAS ───────────────────────────────────────────────────

k6 run ^
  -e ADMIN_USER=admin ^
  -e ADMIN_PASSWORD=admin123 ^
  -e BACKEND_URL=http://localhost:8090 ^
  -e KEYCLOAK_URL=http://localhost:9090 ^
  tests/k6/load-test.js
```

**Ejemplo de salida de K6:**

```
          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: tests/k6/load-test.js

  scenarios: 4 scenarios, 200 max VUs

  ✓ sales: status 200
  ✓ sales: respuesta no vacía
  ✓ ranking: status 200

  checks.........................: 100.00%  1200 de 1200
  http_req_duration..............: avg=245ms  p(50)=198ms  p(90)=520ms  p(95)=680ms
  error_rate.....................: 0.00%
  iterations.....................: 600  (10/s)
```

---

## 5. Variables de entorno

### Playwright — archivo `.env.test` en la raíz del frontend

```env
TEST_USER=roberto.orellana.t@usach.cl
TEST_PASSWORD=Admin1234
TEST_PACKAGE_ID=1
BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:8090
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `TEST_USER` | Usuario en Keycloak (usado por `auth.setup.js`) | `roberto.orellana.t@usach.cl` |
| `TEST_PASSWORD` | Contraseña del usuario (usado por `auth.setup.js`) | `Admin1234` |
| `TEST_PACKAGE_ID` | ID de paquete turístico con cupos disponibles | `1` |
| `BASE_URL` | URL del frontend | `http://localhost:5173` |
| `API_BASE_URL` | URL base del backend (usado en CA-EP4-03) | `http://localhost:8090` |

### K6 — pasar con flag `-e` en el comando

| Variable | Descripción | Default |
|----------|-------------|---------|
| `ADMIN_USER` | Usuario con rol `Admin` en Keycloak | `admin` |
| `ADMIN_PASSWORD` | Contraseña del admin | `admin123` |
| `BACKEND_URL` | URL base del backend | `http://localhost:8090` |
| `KEYCLOAK_URL` | URL de Keycloak | `http://localhost:9090` |
| `KC_REALM` | Nombre del realm de Keycloak | `travel-realm` |
| `KC_CLIENT` | Client ID de Keycloak | `travel-frontend` |

---

## 6. Configuración Keycloak para K6

Los scripts K6 obtienen el token JWT mediante el flujo **Resource Owner Password Credentials (ROPC)**. Para activarlo:

1. Abrir Keycloak Admin Console en `http://localhost:9090`
2. Ir a **Clients** → seleccionar `travel-frontend`
3. En la pestaña **Settings**, activar **Direct access grants** → **Save**

Si no es posible modificar el cliente existente, crear uno dedicado para K6:

1. **Clients** → **Create client** → Client ID: `k6-test-client`
2. Activar **Direct access grants** → **Save**
3. En los comandos K6 agregar: `-e KC_CLIENT=k6-test-client`

---

## 7. Resumen de cobertura

| Épica | Funcionalidad | Herramienta | N° Criterios / Escenarios | Estado |
|-------|--------------|-------------|--------------------------|--------|
| Épica 4 | Proceso de reserva en línea | Playwright | 3 criterios de aceptación | Implementado |
| Épica 5 | Gestión de pagos en línea | Playwright | 3 criterios de aceptación | Implementado |
| Épica 7 | Reportes — Load Testing | K6 | 4 escenarios (10/50/100/200 VUs) | Implementado |
| Épica 7 | Reportes — Stress Testing | K6 | 7 etapas (10 → 700 VUs) | Implementado |
| Épica 7 | Reportes — Volume Testing | K6 | 4 volúmenes (500 → 10 000 registros) | Implementado |


```env
npm init playwright@latest
```