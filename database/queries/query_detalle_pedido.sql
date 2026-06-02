SELECT 
    p.ped_id AS pedido_id,
    p.ped_fecha_entrega AS fecha_entrega,
    ep.est_nombre AS estado_pedido,
    c.cli_nombre || ' ' || c.cli_apellido AS cliente,
    i.ing_nombre AS ingrediente,
    cd.cantidad_usada AS cantidad,
    um.unmed_nombre AS unidad_medida,
    cd.precio_unitario_fijo AS precio_unitario_en_pedido,
    (cd.cantidad_usada * cd.precio_unitario_fijo) AS subtotal_ingrediente
FROM public.pedido p
-- Conectamos con el cliente y el estado del pedido para dar contexto
INNER JOIN public.cliente c ON p.cli_id = c.cli_id
LEFT JOIN public.estado_pedido ep ON p.est_id = ep.est_id
-- Conectamos el pedido con su cotización
INNER JOIN public.cotizacion cot ON p.cot_id = cot.cot_id
-- Desglosamos el detalle de la cotización (donde viven los ingredientes)
INNER JOIN public.cotizacion_detalle cd ON cot.cot_id = cd.cot_id
-- Traemos el nombre del ingrediente y su unidad de medida
INNER JOIN public.ingredientes i ON cd.ing_id = i.ing_id
INNER JOIN public.unidad_medida um ON i.unmed_id = um.unmed_id
-- Reemplaza este UUID por el ID del pedido específico que quieres consultar
WHERE p.ped_id = '6592b362-f4ef-4ee4-bea6-f07424e739f9';