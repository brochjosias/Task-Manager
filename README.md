# Gerenciador de tarefas

Aplicação demonstrativa de CRUD com Next.js 15, TypeScript e tRPC. Os dados ficam em memória e são apagados quando o servidor reinicia.

## Requisitos

- Node.js 20.9 ou superior
- pnpm

## Primeira execução

No terminal, estando na pasta `Task Manger` (a pasta principal que contém `task-manager`):

```bash
cd task-manager
pnpm install
pnpm dev
```

Abra http://localhost:3000. Nas próximas vezes, se o terminal já estiver dentro de `task-manager`, execute apenas `pnpm dev`.

Para gerar uma build de produção e iniciá-la:

```bash
pnpm build
pnpm start
```

## Funcionalidades

- CRUD de tarefas via tRPC, com validação Zod.
- Listagem inicial renderizada no servidor (SSR), exclusão e carregamento incremental ao rolar.
- Formulário de criação e edição com estados de carregamento, sucesso e erro.
- Sem banco de dados ou credenciais: o armazenamento é apenas em memória para este desafio.

O endpoint tRPC é `/api/trpc`. As procedures estão em `src/server/trpc.ts`.
