# AX Network Solutions Group · Sistema de Control de Servicio Técnico

Aplicación web profesional para la gestión operativa y financiera del taller y soporte técnico de **AX Network Solutions Group** en Panamá (soporte remoto, presencial y taller).

---

## 🛠️ Stack Tecnológico
- **Frontend**: React 18 + Vite + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui patterns + Tema Claro (por defecto) / Tema Oscuro
- **Iconografía**: Lucide React
- **Gestión de Estado y Formularios**: React Router, TanStack Query, React Hook Form + Zod
- **Base de Datos & Auth**: Supabase (PostgreSQL, Row Level Security, Storage)
- **Local Fallback**: Almacenamiento interactivo persistente para pruebas sin configuración inicial obligatoria

---

## 🚀 Inicio Rápido en Desarrollo Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://127.0.0.1:5173](http://127.0.0.1:5173) en tu navegador.

3. **Modo Demostración / Roles**:
   En el encabezado superior encontrarás el selector **"Modo Demo"** que te permite alternar con un solo clic entre las vistas y permisos de:
   - **Dueño / Administrador** (Carlos Ramos): Acceso completo a módulos y finanzas.
   - **Recepción** (Mariana Castillo): Gestión de clientes, órdenes, citas y cobros.
   - **Técnico Especialista** (Alejandro Mendoza): Gestión técnica sin visualización de gastos ni balances financieros.

---

## 📦 Configuración de Supabase (Paso a Paso)

### 1. Crear el Proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com/) e inicia sesión.
2. Haz clic en **"New project"**.
3. Selecciona tu organización, asigna un nombre (ej. `ax-network-app`), contraseña segura para la base de datos y selecciona la región más cercana (ej. `us-east-1` Norteamérica).
4. Espera a que el proyecto termine de aprovisionarse.

### 2. Ejecutar el Script SQL
1. En el menú lateral izquierdo de Supabase, entra a **SQL Editor**.
2. Haz clic en **"New query"**.
3. Abre el archivo [`ax_network_schema.sql`](./ax_network_schema.sql) de este repositorio, copia todo su contenido, pégalo en el editor y presiona **"Run"**.
4. Esto creará automáticamente todas las tablas, secuencias, tipos enum, funciones, triggers de auditoría, vistas analíticas (`v_*`) y políticas de seguridad RLS.

### 3. Crear los Buckets de Storage
1. Ve a **Storage** en el panel lateral de Supabase.
2. Haz clic en **"New bucket"**:
   - Nombre: `fotos` (Activa **Private bucket** para que requiera URLs firmadas o token autenticado).
   - Haz clic en **"Save"**.
3. Repite para el bucket de firmas:
   - Nombre: `firmas` (Activa **Private bucket**).
   - Haz clic en **"Save"**.

### 4. Desactivar Registro Público y Crear el Primer Usuario Dueño
1. Dirígete a **Authentication > Providers > Email**.
2. Desactiva la opción **"Allow new users to sign up"** (así evitas registros no autorizados).
3. Ve a **Authentication > Users** y haz clic en **"Add user" > "Create user"**.
4. Ingresa el correo electrónico del dueño (ej. `carlos@axnetwork.com`) y su contraseña.
5. Copia el **User UID** generado.
6. Ve a **SQL Editor** y ejecuta la siguiente consulta para promoverlo a `dueno`:
   ```sql
   update public.perfiles
   set rol = 'dueno',
       nombre = 'Carlos Ramos (Dueño)',
       telefono = '+507 6911-0901',
       activo = true
   where id = '<PEGA_AQUÍ_EL_UUID_DEL_USUARIO>';
   ```

### 5. Conectar Variables de Entorno en la Aplicación
1. En Supabase, ve a **Project Settings > API**.
2. Copia la **Project URL** y la clave **anon (public)**.
3. En la raíz de este proyecto crea un archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

---

## 🌐 Despliegue en Vercel

1. Sube tu código a un repositorio en **GitHub** o **GitLab**.
2. Ingresa a [vercel.com](https://vercel.com/) y haz clic en **"Add New Project"**.
3. Importa tu repositorio.
4. Framework Preset: **Vite**.
5. En **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Haz clic en **"Deploy"**.

---

## 💾 Respaldos de la Base de Datos

### Opción A (Automática desde Supabase)
Los proyectos en Supabase Pro cuentan con **Point-in-Time Recovery (PITR)** y respaldos diarios automáticos en **Project Settings > Backups**.

### Opción B (Respaldo Manual con pg_dump)
Puedes generar un respaldo completo de tu base de datos en cualquier momento desde tu terminal:
```bash
pg_dump -h db.<TU-PROYECTO>.supabase.co -U postgres -d postgres -F c -b -v -f ax_backup_$(date +%Y%m%d).dump
```
Para restaurar:
```bash
pg_restore -h db.<TU-PROYECTO>.supabase.co -U postgres -d postgres -v ax_backup_XXXXXX.dump
```
