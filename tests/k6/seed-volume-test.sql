-- ============================================================
-- SEEDING PARA VOLUME TESTING — tabla `reservation`
-- ============================================================
--
-- Objetivo:
--   Poblar `reservation` en 4 tramos que NO se solapan en fecha, de modo
--   que los rangos usados en tests/k6/volume-test.js terminen con el
--   conteo exacto que indica su nombre:
--
--     rango_500   (2026-06-01 a 2026-06-30) → 500 filas
--     rango_1000  (2026-01-01 a 2026-06-30) → 1000 filas en total
--     rango_5000  (2025-01-01 a 2026-06-30) → 5000 filas en total
--     rango_10000 (2023-01-01 a 2026-06-30) → 10000 filas en total
--
--   Como rango_1000 YA incluye las fechas de rango_500, cada tramo solo
--   agrega las filas que faltan en una franja de fechas distinta:
--
--     Tramo 1:  500 filas → jun-2026            (cubre rango_500)
--     Tramo 2:  500 filas → ene-2026 a may-2026  (completa rango_1000 a 1000)
--     Tramo 3: 4000 filas → todo 2025            (completa rango_5000 a 5000)
--     Tramo 4: 5000 filas → 2023 y 2024          (completa rango_10000 a 10000)
--
-- Requisitos previos:
--   - Debe existir al menos 1 fila en `persons` y en `tour_package`
--     (los FK person_id / tour_package_id son NOT NULL). El ID se elige con
--     `ORDER BY RAND() LIMIT 1` (no con MIN/MAX) porque los IDs de esas
--     tablas pueden tener huecos y un ID "dentro del rango" no siempre existe.
--   - Recomendado: respaldar la BD ANTES de correr esto:
--       mysqldump -u root -p dbtravel > backup_antes_de_volumen.sql
--
-- Nota sobre `status`:
--   Verificado contra ReservationRepository.findSalesReportByPeriod (backend):
--   el reporte solo cuenta reservas con active=1 AND status='PAGADA'. Por eso
--   todas las filas sintéticas se insertan con status='PAGADA' fijo — si se
--   mezclaran estados al azar, solo ~25% de las filas insertadas aparecerían
--   en el resultado del reporte y el volumen real quedaría muy por debajo
--   de 500/1000/5000/10000.
--
-- Cómo ejecutar:
--   mysql -u root -p dbtravel < tests/k6/seed-volume-test.sql
--
-- Cómo revertir (volver al estado original):
--   mysql -u root -p dbtravel < backup_antes_de_volumen.sql
-- ============================================================

-- El límite por defecto de MySQL para CTEs recursivos es 1000 filas;
-- lo subimos para poder generar tramos de hasta 5000 filas de una vez.
SET SESSION cte_max_recursion_depth = 6000;

-- ------------------------------------------------------------
-- Tramo 1: 500 filas → junio 2026 (cubre rango_500)
-- ------------------------------------------------------------
INSERT INTO reservation (
  active, created_at, passengers_count, reservation_date, status,
  subtotal, total_amount, updated_at, person_id, tour_package_id
)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 500
)
SELECT
  1,
  TIMESTAMP('2026-06-01') + INTERVAL FLOOR(RAND() * 30) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  FLOOR(1 + RAND() * 5),
  TIMESTAMP('2026-06-01') + INTERVAL FLOOR(RAND() * 30) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  'PAGADA',
  ROUND(50 + RAND() * 950, 2),
  ROUND(50 + RAND() * 950, 2),
  TIMESTAMP('2026-06-01') + INTERVAL FLOOR(RAND() * 30) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  (SELECT id FROM persons ORDER BY RAND() LIMIT 1),
  (SELECT id FROM tour_package ORDER BY RAND() LIMIT 1)
FROM seq;

-- ------------------------------------------------------------
-- Tramo 2: 500 filas → enero-mayo 2026 (completa rango_1000 a 1000)
-- ------------------------------------------------------------
INSERT INTO reservation (
  active, created_at, passengers_count, reservation_date, status,
  subtotal, total_amount, updated_at, person_id, tour_package_id
)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 500
)
SELECT
  1,
  TIMESTAMP('2026-01-01') + INTERVAL FLOOR(RAND() * 151) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  FLOOR(1 + RAND() * 5),
  TIMESTAMP('2026-01-01') + INTERVAL FLOOR(RAND() * 151) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  'PAGADA',
  ROUND(50 + RAND() * 950, 2),
  ROUND(50 + RAND() * 950, 2),
  TIMESTAMP('2026-01-01') + INTERVAL FLOOR(RAND() * 151) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  (SELECT id FROM persons ORDER BY RAND() LIMIT 1),
  (SELECT id FROM tour_package ORDER BY RAND() LIMIT 1)
FROM seq;

-- ------------------------------------------------------------
-- Tramo 3: 4000 filas → todo 2025 (completa rango_5000 a 5000)
-- ------------------------------------------------------------
INSERT INTO reservation (
  active, created_at, passengers_count, reservation_date, status,
  subtotal, total_amount, updated_at, person_id, tour_package_id
)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 4000
)
SELECT
  1,
  TIMESTAMP('2025-01-01') + INTERVAL FLOOR(RAND() * 365) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  FLOOR(1 + RAND() * 5),
  TIMESTAMP('2025-01-01') + INTERVAL FLOOR(RAND() * 365) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  'PAGADA',
  ROUND(50 + RAND() * 950, 2),
  ROUND(50 + RAND() * 950, 2),
  TIMESTAMP('2025-01-01') + INTERVAL FLOOR(RAND() * 365) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  (SELECT id FROM persons ORDER BY RAND() LIMIT 1),
  (SELECT id FROM tour_package ORDER BY RAND() LIMIT 1)
FROM seq;

-- ------------------------------------------------------------
-- Tramo 4: 5000 filas → 2023-2024 (completa rango_10000 a 10000)
-- ------------------------------------------------------------
INSERT INTO reservation (
  active, created_at, passengers_count, reservation_date, status,
  subtotal, total_amount, updated_at, person_id, tour_package_id
)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 5000
)
SELECT
  1,
  TIMESTAMP('2023-01-01') + INTERVAL FLOOR(RAND() * 730) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  FLOOR(1 + RAND() * 5),
  TIMESTAMP('2023-01-01') + INTERVAL FLOOR(RAND() * 730) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  'PAGADA',
  ROUND(50 + RAND() * 950, 2),
  ROUND(50 + RAND() * 950, 2),
  TIMESTAMP('2023-01-01') + INTERVAL FLOOR(RAND() * 730) DAY + INTERVAL FLOOR(RAND() * 86400) SECOND,
  (SELECT id FROM persons ORDER BY RAND() LIMIT 1),
  (SELECT id FROM tour_package ORDER BY RAND() LIMIT 1)
FROM seq;

-- ------------------------------------------------------------
-- Verificación: conteos por rango (deben dar 500 / 1000 / 5000 / 10000
-- + lo que ya hubiera antes de correr este script)
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM reservation WHERE active = 1 AND status = 'PAGADA' AND reservation_date BETWEEN '2026-06-01' AND '2026-06-30 23:59:59') AS rango_500,
  (SELECT COUNT(*) FROM reservation WHERE active = 1 AND status = 'PAGADA' AND reservation_date BETWEEN '2026-01-01' AND '2026-06-30 23:59:59') AS rango_1000,
  (SELECT COUNT(*) FROM reservation WHERE active = 1 AND status = 'PAGADA' AND reservation_date BETWEEN '2025-01-01' AND '2026-06-30 23:59:59') AS rango_5000,
  (SELECT COUNT(*) FROM reservation WHERE active = 1 AND status = 'PAGADA' AND reservation_date BETWEEN '2023-01-01' AND '2026-06-30 23:59:59') AS rango_10000;
