```text
project/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── users/
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   │
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── products/
│   │   │   ├── dto/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.module.ts
│   │   │
│   │   └── orders/
│   │       ├── dto/
│   │       ├── orders.controller.ts
│   │       ├── orders.service.ts
│   │       └── orders.module.ts
│   │
│   ├── i18n/
│   │   └── en/
│   │       ├── common.json
│   │       ├── errors.json
│   │       └── validation.json
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── i18n.module.ts
│   │
│   ├── generated/
│   │   └── i18n.generated.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── .env
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```
