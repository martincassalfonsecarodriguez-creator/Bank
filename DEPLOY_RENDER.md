# Desplegar Banco Familiar en Render sin pagar disco

Esta guia publica la app para que familiares puedan entrar desde otras redes usando una URL de Render.

La app ahora soporta dos modos:

- Local: SQLite con `DATABASE_FILE`.
- Produccion: PostgreSQL con `DATABASE_URL`.

## 1. Crear base PostgreSQL gratis

Usa un proveedor con plan gratuito, por ejemplo Neon o Supabase.

Pasos generales:

1. Crea una cuenta en Neon o Supabase.
2. Crea un proyecto nuevo.
3. Busca la cadena de conexion PostgreSQL.
4. Copia la URL completa.

La URL suele verse parecida a:

```txt
postgresql://usuario:password@host:5432/base?sslmode=require
```

Esa URL sera la variable `DATABASE_URL` en Render.

## 2. Subir el proyecto a GitHub

Render necesita leer el codigo desde un repositorio.

Sube esta carpeta a GitHub, GitLab o Bitbucket. No subas `.env`, `node_modules` ni archivos `.sqlite`.

## 3. Crear Web Service en Render

En Render crea un **Web Service** desde el repositorio.

Valores:

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

Variables de entorno:

- `NODE_ENV`: `production`
- `SESSION_SECRET`: un texto largo y secreto
- `DATABASE_URL`: la URL de PostgreSQL de Neon/Supabase

No necesitas Persistent Disk si usas PostgreSQL.

## 4. Usuario administrador inicial

Cuando la base se crea por primera vez:

- CI: `ADMIN`
- Contrasena: `admin123`

Cambia esa contrasena o crea otro administrador apenas publiques la app.

## 5. URL final

Render te dara una URL parecida a:

```txt
https://banco-familiar.onrender.com
```

Esa URL si puede abrirse desde otras casas y redes.

## Sobre Google Drive

No uses Google Drive como base activa sincronizada. Drive sirve para guardar copias o exportaciones, pero la base activa en internet debe ser PostgreSQL.

Si ejecutas la app localmente con SQLite, el panel admin puede descargar el archivo `.sqlite` como backup manual para guardarlo en Drive.
