# Contribuyendo a SIPPA

¡Gracias por tu interés en contribuir a SIPPA!

Este documento describe las reglas de trabajo utilizadas durante el desarrollo del proyecto para mantener un historial limpio, estable y fácil de mantener.

---

# Flujo de trabajo

El proyecto utiliza Git con ramas por funcionalidad.

Nunca se desarrolla directamente sobre `main`.

El flujo recomendado es:

```
main
   │
   ├── feature/nueva-funcionalidad
   │
   ├── fix/correccion
   │
   └── docs/documentacion
```

---

# Convención para nombres de ramas

## Nuevas funcionalidades

```
feature/nombre-modulo
```

Ejemplo

```
feature/clientes
feature/recetas
feature/dashboard
```

---

## Correcciones

```
fix/nombre-del-error
```

Ejemplo

```
fix/sqlite-sync
fix/login
fix/cotizaciones
```

---

## Documentación

```
docs/readme
docs/changelog
docs/api
```

---

# Commits

Los commits deben ser pequeños y representar un único cambio.

Formato recomendado:

```
tipo(modulo): descripción
```

Ejemplos

```
feat(clientes): agregar búsqueda por nombre

fix(sync): corregir sincronización offline

docs: actualizar README

refactor(cotizaciones): simplificar cálculo de costos
```

---

# Pull Requests

Antes de realizar un Merge verificar:

- El proyecto compila correctamente.
- No existen errores en consola.
- La funcionalidad fue probada.
- No existen archivos temporales.
- No existen secretos o credenciales.

---

# Versionado

El proyecto utiliza Versionado Semántico.

```
MAJOR.MINOR.PATCH
```

Ejemplo

```
0.1.0
0.1.1
0.2.0
1.0.0
```

---

# Releases

Cada versión publicada debe incluir:

- APK correspondiente.
- CHANGELOG actualizado.
- Tag de Git.
- Notas de la versión.

---

# Roadmap

Las funcionalidades futuras deben desarrollarse mediante ramas independientes.

Ejemplos:

- Offline First
- Dashboard
- Recetas
- Roles de usuario
- Backend Java
- Aplicación iOS

---

# Filosofía del proyecto

SIPPA busca convertirse en una plataforma escalable para la administración de negocios gastronómicos.

Las decisiones técnicas deben privilegiar:

- Código limpio.
- Arquitectura mantenible.
- Escalabilidad.
- Bajo acoplamiento.
- Simplicidad.
- Seguridad.

---

# Principios de desarrollo

Durante el desarrollo de SIPPA se priorizan los siguientes principios:

- Realizar cambios pequeños y fáciles de revisar.
- Mantener la aplicación funcionando después de cada cambio.
- Documentar las decisiones importantes.
- Evitar duplicación de código.
- Favorecer la simplicidad antes que la complejidad.
- Pensar siempre en la escalabilidad del sistema.
- Validar los cambios tanto en Web como en Android antes de integrarlos a `main`.