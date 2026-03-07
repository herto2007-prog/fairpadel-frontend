# FairPadel V2 - Estructura de Carpetas

```
v2/
├── README.md
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── package.json
│   ├── railway.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── app.module.ts
│       ├── main.ts
│       ├── common/
│       │   └── filters/          (vacío - para filtros de excepciones)
│       ├── modules/
│       │   ├── alquileres/
│       │   │   ├── dto/
│       │   │   │   ├── create-alquiler-config.dto.ts
│       │   │   │   ├── create-reserva.dto.ts
│       │   │   │   └── disponibilidad.dto.ts
│       │   │   ├── alquileres.controller.ts
│       │   │   ├── alquileres.module.ts
│       │   │   └── alquileres.service.ts
│       │   ├── auth/
│       │   │   ├── decorators/
│       │   │   │   └── roles.decorator.ts
│       │   │   └── guards/
│       │   │       ├── jwt-auth.guard.ts
│       │   │       └── roles.guard.ts
│       │   ├── instructores/
│       │   │   ├── dto/
│       │   │   │   ├── create-pago.dto.ts
│       │   │   │   ├── create-reserva-instructor.dto.ts
│       │   │   │   └── create-solicitud.dto.ts
│       │   │   ├── instructores.controller.ts
│       │   │   ├── instructores.module.ts
│       │   │   └── instructores.service.ts
│       │   ├── sedes/
│       │   │   ├── dto/
│       │   │   │   ├── create-cancha.dto.ts
│       │   │   │   ├── create-sede.dto.ts
│       │   │   │   └── update-sede.dto.ts
│       │   │   ├── sedes.controller.ts
│       │   │   ├── sedes.module.ts
│       │   │   └── sedes.service.ts
│       │   ├── tournaments/
│       │   │   ├── tournaments.controller.ts
│       │   │   ├── tournaments.module.ts
│       │   │   └── tournaments.service.ts
│       │   └── users/
│       │       ├── users.controller.ts
│       │       ├── users.module.ts
│       │       └── users.service.ts
│       └── prisma/
│           ├── prisma.module.ts
│           └── prisma.service.ts
│
└── frontend/
    ├── .env.example
    ├── .gitignore
    ├── Dockerfile
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── railway.json
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── components/
        │   └── layout/             (vacío - para componentes de layout)
        ├── features/
        │   ├── alquileres/
        │   │   └── pages/
        │   │       ├── AlquileresPage.tsx
        │   │       └── MisReservasPage.tsx
        │   ├── auth/
        │   │   └── pages/
        │   │       └── LoginPage.tsx
        │   ├── instructores/
        │   │   └── pages/
        │   │       ├── InstructorDetailPage.tsx
        │   │       └── InstructoresListPage.tsx
        │   └── sedes/
        │       └── pages/
        │           ├── SedeDetailPage.tsx
        │           └── SedesListPage.tsx
        └── services/
            ├── alquileresService.ts
            ├── api.ts
            ├── instructoresService.ts
            └── sedesService.ts
```

## Archivos Eliminados

- ✅ `node_modules/` - Instalables vía npm
- ✅ `dist/` - Generados en build
- ✅ `.env` - Locales (se mantiene `.env.example`)
- ✅ `*.tsbuildinfo` - Cache de TypeScript
- ✅ Archivos `.js` y `.d.ts` generados

## Listo para Deploy

1. Backend: 32 archivos fuente TypeScript
2. Frontend: 16 archivos fuente TypeScript
3. Configuración: 14 archivos de config
4. Total: ~62 archivos (limpio y organizado)
