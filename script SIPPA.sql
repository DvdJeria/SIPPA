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
    ing_precio int NOT NULL,
    ing_cantidad_base int NOT NULL,
    
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
INSERT INTO ingredientes (ing_nombre, ing_precio,ing_cantidad_base, unmed_id)
VALUES 
('Azúcar flor', 2250, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Azúcar granulada', 1100, 1000,'335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Base de tortas 30', 3150, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Base de tortas 35', 1800, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Base de tortas 40', 2000, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Base de tortas 45', 4000, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Brillo matizador', 5000, 5, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Cacao', 1500, 150, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Caja de torta 30', 2650, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Chips de chocolate', 6000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Chocolate botones', 6200, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Colorantes', 1000, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Crema chantilli', 4300, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Crema de leche', 1500, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Decoración', 0, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Durazno', 1500, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Fondant de kilo', 6400, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Fondant de medio', 3900, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Frambuesa', 6000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Frutilla', 1200, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Gelatina', 1000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Harina', 1000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Huevos', 280, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Kiwi', 1500, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Leche condensada', 2000, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Leche entera', 1300, 1000, 'b86e0efd-861c-4d53-896c-f683dd77e628'),
('Leche evaporada', 1900, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Limon', 1000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Maicena', 1700, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Manjar', 3800, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Manjar sin lactosa Nestle', 6000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Mantequilla', 10400, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Mantequilla Butter Cream', 4500, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Mantequilla sin lactosa', 13500, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Mantequilla sin sal', 12000, 1000, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Margarina Hornito', 4000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Mermala frutos rojos', 5000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Mermelada frambuesa', 6000, 1000,'335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Nueces', 7500, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Perlas', 1000, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Piña', 2000, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Pulpa de lucuma', 9000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Soporte torta', 1500, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Toppers', 3500, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Vela larga', 1000, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Vino blanco', 2500, 1000, 'b86e0efd-861c-4d53-896c-f683dd77e628'),
('Yogurth', 1500, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017'),
('Pedestal de torta 20', 2500, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Papel de azúcar s/foto', 1500, 1, '836d98b0-aab7-41c2-8757-4183f73e23e8'),
('Perlas', 20000, 1000, '335c2911-88b0-47ff-9fd7-5f2d603de017');
