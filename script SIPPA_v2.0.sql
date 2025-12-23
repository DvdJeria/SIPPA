-- EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------------
-- 1. TABLAS BÁSICAS
-----------------------------------------------------------

CREATE TABLE public.unidad_medida (
  unmed_id uuid NOT NULL DEFAULT gen_random_uuid(),
  unmed_nombre varchar NOT NULL,
  CONSTRAINT unidad_medida_pkey PRIMARY KEY (unmed_id)
);

CREATE TABLE public.ingredientes (
  ing_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ing_nombre varchar NOT NULL,
  ing_precio numeric NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  unmed_id uuid NOT NULL,
  ing_cantidad_base integer,
  CONSTRAINT ingredientes_pkey PRIMARY KEY (ing_id),
  CONSTRAINT ingredientes_unmed_id_fkey FOREIGN KEY (unmed_id)
    REFERENCES public.unidad_medida(unmed_id)
);

-----------------------------------------------------------
-- 2. TABLA PROFILES (Referenciada a auth.users)
-----------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'simple',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
    REFERENCES auth.users(id)
);

-----------------------------------------------------------
-- 3. TABLA CLIENTE
-----------------------------------------------------------

CREATE TABLE public.cliente (
  cli_id uuid NOT NULL DEFAULT gen_random_uuid(),
  cli_nombre varchar NOT NULL,
  cli_apellido varchar NOT NULL,
  cli_instagram text,
  cli_telefono text,
  CONSTRAINT cliente_pkey PRIMARY KEY (cli_id)
);

-----------------------------------------------------------
-- 4. TABLA COTIZACION
-- (IMPORTANTE: falta user_id hasta que lo agregues)
-----------------------------------------------------------

CREATE TABLE public.cotizacion (
  cot_id uuid NOT NULL DEFAULT gen_random_uuid(),
  cot_fecha timestamptz DEFAULT now(),
  cot_total numeric NOT NULL,
  cot_nombre text,
  CONSTRAINT cotizacion_pkey PRIMARY KEY (cot_id)
);

-----------------------------------------------------------
-- 5. TABLA DETALLE DE COTIZACION (Muchos a Muchos)
-----------------------------------------------------------

CREATE TABLE public.cotizacion_detalle (
  cot_id uuid NOT NULL,
  ing_id uuid NOT NULL,
  cantidad_usada numeric NOT NULL,
  precio_unitario_fijo numeric NOT NULL,
  CONSTRAINT cotizacion_detalle_pkey PRIMARY KEY (cot_id, ing_id),
  CONSTRAINT cotizacion_detalle_cot_id_fkey FOREIGN KEY (cot_id)
    REFERENCES public.cotizacion(cot_id) ON DELETE CASCADE,
  CONSTRAINT cotizacion_detalle_ing_id_fkey FOREIGN KEY (ing_id)
    REFERENCES public.ingredientes(ing_id)
);

-----------------------------------------------------------
-- 6. TABLA PEDIDO
-----------------------------------------------------------

CREATE TABLE public.pedido (
  ped_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ped_fecha_entrega timestamp NOT NULL,
  ped_precio numeric NOT NULL,
  ped_estado varchar NOT NULL DEFAULT 'CONFIRMADO',
  cli_id uuid NOT NULL,
  cot_id uuid,
  CONSTRAINT pedido_pkey PRIMARY KEY (ped_id),
  CONSTRAINT pedido_cli_id_fkey FOREIGN KEY (cli_id)
    REFERENCES public.cliente(cli_id),
  CONSTRAINT pedido_cot_id_fkey FOREIGN KEY (cot_id)
    REFERENCES public.cotizacion(cot_id)
);


-- ******************************************************
-- 1. Inserción Segura en Unidad_Medida y Captura de IDs
-- ******************************************************

WITH inserted_unidades AS (
    -- Paso 1: Insertar las unidades y RETORNAR las IDs generadas
    INSERT INTO public.unidad_medida (unmed_nombre)
    VALUES 
    ('Unidad'), 
    ('Gramo'), 
    ('CC')
    RETURNING unmed_id, unmed_nombre
)
-- ******************************************************
-- 2. Inserción de Ingredientes usando las IDs Capturadas
-- ******************************************************
INSERT INTO public.ingredientes (ing_nombre, ing_precio, ing_cantidad_base, unmed_id)
SELECT 
    ingredientes_data.ing_nombre, 
    ingredientes_data.ing_precio, 
    ingredientes_data.ing_cantidad_base,
    iu.unmed_id -- 🔑 Usamos la ID generada de la CTE (iu)
FROM (
    -- Definimos los datos de los ingredientes y su unidad de medida
    VALUES 
    -- Nombre, Precio, Cantidad Base, Nombre de la Unidad (para el JOIN)
    ('Azúcar flor', 2250, 1000, 'Gramo'),
    ('Azúcar granulada', 1100, 1000, 'Gramo'),
    ('Base de tortas 30', 3150, 1, 'Unidad'),
    ('Base de tortas 35', 1800, 1, 'Unidad'),
    ('Base de tortas 40', 2000, 1, 'Unidad'),
    ('Base de tortas 45', 4000, 1, 'Unidad'),
    ('Brillo matizador', 5000, 5, 'Unidad'),
    ('Cacao', 1500, 150, 'Gramo'),
    ('Caja de torta 30', 2650, 1, 'Unidad'),
    ('Chips de chocolate', 6000, 1000, 'Gramo'),
    ('Chocolate botones', 6200, 1000, 'Gramo'),
    ('Colorantes', 1000, 1, 'Unidad'),
    ('Crema chantilli', 4300, 1000, 'Gramo'),
    ('Crema de leche', 1500, 1, 'Unidad'),
    ('Decoración', 0, 1, 'Unidad'),
    ('Durazno', 1500, 1, 'Unidad'),
    ('Fondant de kilo', 6400, 1000, 'Gramo'),
    ('Fondant de medio', 3900, 1000, 'Gramo'),
    ('Frambuesa', 6000, 1000, 'Gramo'),
    ('Frutilla', 1200, 1000, 'Gramo'),
    ('Gelatina', 1000, 1000, 'Gramo'),
    ('Harina', 1000, 1000, 'Gramo'),
    ('Huevos', 280, 1, 'Unidad'),
    ('Kiwi', 1500, 1000, 'Gramo'),
    ('Leche condensada', 2000, 1, 'Unidad'),
    ('Leche entera', 1300, 1000, 'CC'),
    ('Leche evaporada', 1900, 1, 'Unidad'),
    ('Limon', 1000, 1000, 'Gramo'),
    ('Maicena', 1700, 1000, 'Gramo'),
    ('Manjar', 3800, 1000, 'Gramo'),
    ('Manjar sin lactosa Nestle', 6000, 1000, 'Gramo'),
    ('Mantequilla', 10400, 1000, 'Gramo'),
    ('Mantequilla Butter Cream', 4500, 1000, 'Gramo'),
    ('Mantequilla sin lactosa', 13500, 1000, 'Gramo'),
    ('Mantequilla sin sal', 12000, 1000, 'Gramo'),
    ('Margarina Hornito', 4000, 1000, 'Gramo'),
    ('Mermala frutos rojos', 5000, 1000, 'Gramo'),
    ('Mermelada frambuesa', 6000, 1000, 'Gramo'),
    ('Nueces', 7500, 1000, 'Gramo'),
    ('Perlas', 1000, 1, 'Unidad'),
    ('Piña', 2000, 1, 'Unidad'),
    ('Pulpa de lucuma', 9000, 1000, 'Gramo'),
    ('Soporte torta', 1500, 1, 'Unidad'),
    ('Toppers', 3500, 1, 'Unidad'),
    ('Vela larga', 1000, 1, 'Unidad'),
    ('Vino blanco', 2500, 1000, 'CC'), -- Asumo CC
    ('Yogurth', 1500, 1000, 'Gramo'),
    ('Pedestal de torta 20', 2500, 1, 'Unidad'),
    ('Papel de azúcar s/foto', 1500, 1, 'Unidad'),
    ('Perlas', 20000, 1000, 'Gramo')
) AS ingredientes_data (ing_nombre, ing_precio, ing_cantidad_base, unmed_nombre)
JOIN inserted_unidades iu ON iu.unmed_nombre = ingredientes_data.unmed_nombre;

-- Activar RLS en la tabla ingredientes
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------
-- 1. SELECT: Administradores pueden ver todo
----------------------------------------------------------
CREATE POLICY "allow_admin_read_all"
ON public.ingredientes
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'administrator'
  )
);

----------------------------------------------------------
-- 2. SELECT: Usuarios normales ven solo no eliminados
----------------------------------------------------------
CREATE POLICY "allow_regular_read_active"
ON public.ingredientes
FOR SELECT
TO authenticated
USING (
  is_deleted = false
  AND auth.uid() NOT IN (
    SELECT id FROM profiles WHERE role = 'administrator'
  )
);

----------------------------------------------------------
-- 3. INSERT: Solo administradores pueden insertar
----------------------------------------------------------
CREATE POLICY "insert_administrador"
ON public.ingredientes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'administrator'
  )
);

----------------------------------------------------------
-- 4. UPDATE: Solo administradores pueden editar
----------------------------------------------------------
CREATE POLICY "update_administrador"
ON public.ingredientes
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'administrator'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'administrator'
  )
);


