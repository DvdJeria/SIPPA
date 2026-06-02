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