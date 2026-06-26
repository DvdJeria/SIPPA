# 🍰 SIPPA

> **Sistema Integral para Pastelerías y Producción Artesanal**

SIPPA es una plataforma diseñada para administrar la operación diaria de una pastelería, centralizando la gestión de materias primas, cotizaciones, clientes y pedidos en una única aplicación.

El proyecto nació para resolver una necesidad real dentro de una pastelería artesanal, pero actualmente evoluciona con el objetivo de convertirse en una plataforma escalable para pequeños y medianos negocios gastronómicos.

---

# ✨ Características

* 📦 Gestión de materias primas.
* 💰 Cálculo automático de costos.
* 🧾 Generación de cotizaciones.
* 👥 Administración de clientes (En desarrollo).
* 📋 Gestión de pedidos (En desarrollo).
* 📱 Aplicación Android.
* 🌐 Aplicación Web.
* ☁️ Sincronización con Supabase.
* 💾 Base de datos local SQLite.
* 🔄 Arquitectura Offline First (En desarrollo).

---

# 🚀 Tecnologías utilizadas

## Frontend

* Angular
* Ionic Framework
* TypeScript

## Aplicación móvil

* Capacitor
* SQLite

## Backend actual

* Supabase
* PostgreSQL

## Control de versiones

* Git
* GitHub

## Backend futuro

* Java
* Spring Boot

---

# 📈 Estado del proyecto

| Módulo        | Estado           |
| ------------- | ---------------- |
| Login         | ✅ Finalizado     |
| Materia Prima | ✅ Finalizado     |
| Cotizaciones  | 🚧 En desarrollo |
| Clientes      | 📅 Planificado   |
| Pedidos       | 📅 Planificado   |
| Offline First | 🚧 En desarrollo |
| Dashboard     | 📅 Planificado   |
| Reportes      | 📅 Planificado   |

---

# 🏗 Arquitectura general

```text
                    Internet
                        │
                ┌───────▼────────┐
                │    Supabase     │
                └───────▲────────┘
                        │
                 Sync Up / Down
                        │
                ┌───────▼────────┐
                │ SQLite (Local) │
                └───────▲────────┘
                        │
                Servicios Angular
                        │
                ┌───────▼────────┐
                │ Componentes UI │
                └────────────────┘
```

---

# 📱 Plataformas soportadas

* ✅ Android
* ✅ Web

Próximamente

* 🍎 iOS

---

# ⚙ Instalación

Clonar el repositorio

```bash
git clone https://github.com/DvdJeria/SIPPA.git
```

Ingresar al proyecto

```bash
cd SIPPA
```

Instalar dependencias

```bash
npm install
```

Ejecutar versión Web

```bash
ionic serve
```

---

# 🤖 Generar APK Android

Compilar la aplicación

```bash
ionic build
```

Copiar archivos hacia Android

```bash
npx cap copy android
```

Sincronizar Capacitor

```bash
npx cap sync android
```

Abrir Android Studio

```bash
npx cap open android
```

---

# 📦 Releases

Las versiones oficiales del proyecto pueden descargarse desde la sección **Releases** del repositorio.

Cada Release contiene la APK correspondiente a dicha versión.

---

# 🗺 Roadmap

## Versión 0.x

* ✅ Gestión de Materia Prima
* 🚧 Offline First
* 🚧 Cotizaciones
* 📅 Clientes
* 📅 Pedidos

## Versión 1.0

* Dashboard
* Reportes
* Roles de usuarios
* Sincronización completa
* Instalador Android estable

## Futuro

* Backend Java + Spring Boot
* API REST propia
* Panel de administración
* Sistema multiempresa
* Publicación para iOS

---

# 🤝 Contribuciones

Actualmente el proyecto se encuentra en desarrollo privado.

En futuras versiones se evaluará abrir el proyecto a colaboradores externos.

---

# 📄 Licencia

Licencia pendiente de definir.

---

# 👨‍💻 Autor

**David Jeria**

Desarrollador del proyecto SIPPA.

El objetivo de SIPPA es evolucionar desde una solución desarrollada para una pastelería artesanal hacia una plataforma ERP especializada para pequeños y medianos negocios gastronómicos.

---

# ❤️ Agradecimientos

A todas las personas que han permitido probar el sistema en un entorno real, aportando ideas y detectando oportunidades de mejora para convertir SIPPA en una plataforma cada vez más completa.
