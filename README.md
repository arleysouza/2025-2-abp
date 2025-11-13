## Visão Geral

API Node.js (Express + PostgreSQL) para gerenciamento de notícias, publicações, oportunidades e usuários. Endpoints da API expõem CRUD protegido por JWT e a pasta `public/` fornece uma UI administrativa (login + páginas `/admin/*`) que consome a mesma API.

## Requisitos

- Node.js 18+ e npm
- PostgreSQL 13+

## Clonar e Instalar

```
git clone https://github.com/arleysouza/2025-2-abp
cd server
npm install
```

## Configurar Ambiente

- Ajuste `server/.env` conforme seu ambiente:
  - `PORT=3000`
  - `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
  - `JWT_SECRET` (obrigatório para login emitir tokens JWT)

## Criar Banco e Tabelas

- Crie o banco (ex.: `abp`) no PostgreSQL
- Cole o conteúdo de `src/controllers/db.sql` no pgAdmin e execute para criar as tabelas e o usuário `admin` com a senha `123456`

## Executar

- Desenvolvimento: `npm run dev`
- Produção/local: `npm start`

O servidor sobe em `http://localhost:3000` e expõe:

- API: `http://localhost:3000/api`
- Uploads: `http://localhost:3000/uploads/<arquivo>`
- UI administrativa:
  - `/login`
  Rotas protegidas, é necessário estar logado para acessar:
  - `/admin/usuarios` (rotas)
  - `/admin/noticias`
  - `/admin/publicacoes`
  - `/admin/oportunidades`


