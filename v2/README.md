# FairPadel V2

Plataforma de gestión de torneos de pádel - Versión 2.0

## 📁 Estructura del Proyecto

```
v2/
├── backend/                 # NestJS + Prisma + PostgreSQL
│   ├── src/
│   │   ├── modules/        # Módulos de negocio
│   │   │   ├── auth/       # Guards y decorators
│   │   │   ├── users/      # Gestión de usuarios
│   │   │   ├── tournaments/# Torneos
│   │   │   ├── sedes/      # Sedes y canchas ✅
│   │   │   ├── alquileres/ # Alquiler de canchas ✅
│   │   │   └── instructores/# Sistema de instructores ✅
│   │   ├── prisma/         # Prisma module y service
│   │   ├── app.module.ts   # Root module
│   │   └── main.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── Dockerfile
│   ├── railway.json
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/               # React + Vite + TailwindCSS
    ├── src/
    │   ├── features/       # Feature-based modules
    │   │   ├── auth/
    │   │   ├── sedes/      # ✅
    │   │   ├── alquileres/ # ✅
    │   │   └── instructores/# ✅
    │   ├── services/       # API clients
    │   ├── App.tsx
    │   └── main.tsx
    ├── Dockerfile
    ├── railway.json
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## 🚀 Deploy en Railway

### Backend

```bash
cd v2/backend
# Configurar variables de entorno en Railway:
# - DATABASE_URL
# - JWT_SECRET
# - FRONTEND_URL

git add .
git commit -m "Backend V2 - Semana 6"
git push origin main
```

### Frontend

```bash
cd v2/frontend
# Configurar variables de entorno en Railway:
# - VITE_API_URL (URL del backend)

git add .
git commit -m "Frontend V2 - Semana 6"
git push origin main
```

## 🏃 Desarrollo Local

### Backend

```bash
cd v2/backend
cp .env.example .env
# Editar .env con tus variables

npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd v2/frontend
cp .env.example .env
# Editar .env con la URL del backend

npm install
npm run dev
```

## 📚 API Documentation

Ver documentación completa en `Kimi_Context_Fairpadel.md`

## 🎯 Módulos Implementados

- ✅ **Semana 1**: Auth, Users, Tournaments
- ✅ **Semana 6**: Sedes, Alquileres, Instructores

## 📝 Notas

- Puerto backend: 3000
- Puerto frontend: 5173 (dev) / dinámico (producción)
- Base de datos: PostgreSQL con Prisma ORM
