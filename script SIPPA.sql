-- #################################################
-- # SCRIPT SQL FINAL (COTIZACIONES, PEDIDOS, INGREDIENTES, SEGURIDAD)
-- #################################################

-- 1. DROP TABLES (Orden de dependencia inversa)
DROP TABLE IF EXISTS pedido;
DROP TABLE IF EXISTS cotizacion;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS ingredientes;
DROP TABLE IF EXISTS unidad_medida;
DROP TABLE IF EXISTS profiles; 

-- CREACIÓN DE TABLAS

-- 2. Unidad de Medida (unmed) - Base para Ingredientes
CREATE TABLE public.unidad_medida (
    unmed_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unmed_nombre VARCHAR(50) NOT NULL 
);

-- 3. Ingredientes (Materia Prima)
CREATE TABLE public.ingredientes (
    ing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID único para sincronización
    ing_nombre VARCHAR(100) NOT NULL,
    ing_precio DECIMAL(10, 2) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    unmed_id UUID NOT NULL REFERENCES public.unidad_medida(unmed_id) 
);

-- 4. Clientes
CREATE TABLE public.cliente (
    cli_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cli_nombre VARCHAR(100) NOT NULL,
    cli_apellido VARCHAR(100) NOT NULL,
    cli_email VARCHAR(100) NOT NULL UNIQUE
);

-- 5. Cotización
CREATE TABLE public.cotizacion (
    cot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cot_fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    cot_total DECIMAL(10, 2) NOT NULL,
    cot_detalle TEXT,
    cli_id UUID NOT NULL REFERENCES public.cliente(cli_id) 
);

-- 6. Pedido
CREATE TABLE public.pedido (
    ped_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ped_fecha_entrega TIMESTAMP NOT NULL,
    ped_precio DECIMAL(10, 2) NOT NULL,
    ped_estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO',
    cli_id UUID NOT NULL REFERENCES public.cliente(cli_id), 
    cot_id UUID REFERENCES public.cotizacion(cot_id) 
);

-- 7. TABLA DE SEGURIDAD: Profiles (Esencial para la diferenciación de roles)
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id), 
    role text NOT NULL DEFAULT 'simple', 
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- CONFIGURACIÓN DE SEGURIDAD Y DATOS BÁSICOS

-- 8. Habilitar RLS y crear índice
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX profiles_role_idx ON public.profiles (role);

-- 9. Insertar unidades de medida mínimas (Garantiza datos base)
INSERT INTO public.unidad_medida (unmed_nombre) VALUES 
('Unidad'), 
('Gramo'), 
('CC');

--Revisar los valores de unmed_id que entregara uidd

INSERT INTO ingredientes (ing_nombre, ing_precio, is_deleted, unmed_id)
VALUES 
('Azúcar flor', 2250, FALSE, 1),
('Azúcar granulada', 1100, FALSE, 1),
('Base de tortas 30', 3150, FALSE, 3),
('Base de tortas 35', 1800, FALSE, 3),
('Base de tortas 40', 2000, FALSE, 3),
('Base de tortas 45', 4000, FALSE, 3),
('Brillo matizador', 5000, FALSE, 3),
('Cacao', 1500, FALSE, 1),
('Caja de torta 30', 2650, FALSE, 3),
('Chips de chocolate', 6000, FALSE, 1),
('Chocolate botones', 6200, FALSE, 1),
('Colorantes', 1000, FALSE, 3),
('Crema chantilli', 4300, FALSE, 1),
('Crema de leche', 1500, FALSE, 3),
('Decoración', 0, FALSE, 3),
('Durazno', 1500, FALSE, 3),
('Fondant de kilo', 6400, FALSE, 1),
('Fondant de medio', 3900, FALSE, 1),
('Frambuesa', 6000, FALSE, 1),
('Frutilla', 1200, FALSE, 1),
('Gelatina', 1000, FALSE, 1),
('Harina', 1000, FALSE, 1),
('Huevos', 280, FALSE, 3),
('Kiwi', 1500, FALSE, 1),
('Leche condensada', 2000, FALSE, 3),
('Leche entera', 1300, FALSE, 2),
('Leche evaporada', 1900, FALSE, 3),
('Limon', 1000, FALSE, 1),
('Maicena', 1700, FALSE, 1),
('Manjar', 3800, FALSE, 1),
('Manjar sin lactosa Nestle', 6000, FALSE, 1),
('Mantequilla', 10400, FALSE, 1),
('Mantequilla Butter Cream', 4500, FALSE, 1),
('Mantequilla sin lactosa', 13500, FALSE, 1),
('Mantequilla sin sal', 12000, FALSE, 3),
('Margarina Hornito', 4000, FALSE, 1),
('Mermala frutos rojos', 5000, FALSE, 1),
('Mermelada frambuesa', 6000, FALSE, 1),
('Nueces', 7500, FALSE, 1),
('Perlas', 1000, FALSE, 3),
('Piña', 2000, FALSE, 3),
('Pulpa de lucuma', 9000, FALSE, 1),
('Soporte torta', 1500, FALSE, 3),
('Toppers', 3500, FALSE, 3),
('Vela larga', 1000, FALSE, 3),
('Vino blanco', 2500, FALSE, 2),
('Yogurth', 1500, FALSE, 1),
('Pedestal de torta 20', 2500, FALSE, 1),
('Papel de azúcar s/foto', 1500, FALSE, 1),
('Perlas', 20000, FALSE, 1); -- ⚠️ ¡Punto y coma agregado!


