-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cliente (
  cli_id uuid NOT NULL DEFAULT gen_random_uuid(),
  cli_nombre character varying NOT NULL,
  cli_apellido character varying NOT NULL,
  cli_instagram text,
  cli_telefono text,
  CONSTRAINT cliente_pkey PRIMARY KEY (cli_id)
);
CREATE TABLE public.cotizacion (
  cot_id uuid NOT NULL DEFAULT gen_random_uuid(),
  cot_fecha timestamp with time zone DEFAULT now(),
  cot_total numeric NOT NULL,
  cot_nombre text,
  CONSTRAINT cotizacion_pkey PRIMARY KEY (cot_id)
);
CREATE TABLE public.cotizacion_detalle (
  cot_id uuid NOT NULL,
  ing_id uuid NOT NULL,
  cantidad_usada numeric NOT NULL,
  precio_unitario_fijo numeric NOT NULL,
  CONSTRAINT cotizacion_detalle_pkey PRIMARY KEY (cot_id, ing_id),
  CONSTRAINT cotizacion_detalle_cot_id_fkey FOREIGN KEY (cot_id) REFERENCES public.cotizacion(cot_id),
  CONSTRAINT cotizacion_detalle_ing_id_fkey FOREIGN KEY (ing_id) REFERENCES public.ingredientes(ing_id)
);
CREATE TABLE public.estado_pedido (
  est_id uuid NOT NULL DEFAULT gen_random_uuid(),
  est_nombre text NOT NULL,
  CONSTRAINT estado_pedido_pkey PRIMARY KEY (est_id)
);
CREATE TABLE public.ingredientes (
  ing_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ing_nombre character varying NOT NULL,
  ing_precio numeric NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  unmed_id uuid NOT NULL,
  ing_cantidad_base integer,
  CONSTRAINT ingredientes_pkey PRIMARY KEY (ing_id),
  CONSTRAINT ingredientes_unmed_id_fkey FOREIGN KEY (unmed_id) REFERENCES public.unidad_medida(unmed_id)
);
CREATE TABLE public.pedido (
  ped_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ped_fecha_entrega timestamp without time zone NOT NULL,
  ped_precio numeric NOT NULL,
  cli_id uuid NOT NULL,
  cot_id uuid,
  est_id uuid,
  CONSTRAINT pedido_pkey PRIMARY KEY (ped_id),
  CONSTRAINT pedido_cli_id_fkey FOREIGN KEY (cli_id) REFERENCES public.cliente(cli_id),
  CONSTRAINT pedido_cot_id_fkey FOREIGN KEY (cot_id) REFERENCES public.cotizacion(cot_id),
  CONSTRAINT pedido_est_id_fkey FOREIGN KEY (est_id) REFERENCES public.estado_pedido(est_id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'simple'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.unidad_medida (
  unmed_id uuid NOT NULL DEFAULT gen_random_uuid(),
  unmed_nombre character varying NOT NULL,
  CONSTRAINT unidad_medida_pkey PRIMARY KEY (unmed_id)
);