
-- ============================================================
-- INGREDIENTES
-- ============================================================
-- Admin: CRUD completo
CREATE POLICY admin_full_access_ingredientes
ON public.ingredientes
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- User: solo SELECT de activos
CREATE POLICY user_select_active_ingredientes
ON public.ingredientes
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- ============================================================
-- UNIDAD_MEDIDA
-- ============================================================
-- Todos pueden leer
CREATE POLICY all_select_unidad_medida
ON public.unidad_medida
FOR SELECT
TO authenticated
USING (true);

-- Admin CRUD
CREATE POLICY admin_crud_unidad_medida
ON public.unidad_medida
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- ============================================================
-- CLIENTE
-- ============================================================
-- Admin CRUD
CREATE POLICY admin_crud_cliente
ON public.cliente
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- User: puede ver todos (si en el futuro quieres limitar, agrega columna user_id)
CREATE POLICY user_select_cliente
ON public.cliente
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- COTIZACION
-- ============================================================
-- Admin CRUD
CREATE POLICY admin_crud_cotizacion
ON public.cotizacion
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- User: puede ver todas (igual que cliente, si quieres limitar agrega user_id)
CREATE POLICY user_select_cotizacion
ON public.cotizacion
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- COTIZACION_DETALLE
-- ============================================================
-- Admin CRUD
CREATE POLICY admin_crud_cotizacion_detalle
ON public.cotizacion_detalle
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- User: puede ver todas
CREATE POLICY user_select_cotizacion_detalle
ON public.cotizacion_detalle
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- PEDIDO
-- ============================================================
-- Admin CRUD
CREATE POLICY admin_crud_pedido
ON public.pedido
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- User: puede ver todas (si quieres limitar, agrega user_id)
CREATE POLICY user_select_pedido
ON public.pedido
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- ESTADO_PEDIDO
-- ============================================================
-- Todos pueden leer
CREATE POLICY all_select_estado_pedido
ON public.estado_pedido
FOR SELECT
TO authenticated
USING (true);

-- Admin CRUD
CREATE POLICY admin_crud_estado_pedido
ON public.estado_pedido
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- ============================================================
-- PROFILES
-- ============================================================
-- Admin puede ver todos los perfiles
CREATE POLICY admin_select_profiles
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

-- Cada usuario puede ver su propio perfil
CREATE POLICY user_select_own_profile
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
