# Guia de Deploy - Kids Aligner

Este guia contém todas as instruções para fazer deploy da aplicação Kids Aligner no Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Neon](https://neon.tech) com banco de dados configurado
- Projeto conectado ao GitHub

## 🗄️ 1. Configurar Banco de Dados Neon

### 1.1 Criar Banco de Dados

1. Acesse [Neon Console](https://console.neon.tech)
2. Crie um novo projeto ou use o existente
3. Copie a **DATABASE_URL** (Connection String)

### 1.2 Push do Schema

Execute localmente:

```bash
# Certifique-se que DATABASE_URL está no .env
pnpm db:push

# Execute o seed para criar super-admins e clínica demo
pnpm db:seed
```

## 🚀 2. Deploy no Vercel

### 2.1 Configurar Variáveis de Ambiente

No Vercel Dashboard → Settings → Environment Variables, adicione:

#### Variáveis Obrigatórias:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NODE_ENV=production
VITE_API_URL=https://aligner-kids.vercel.app/api
```

#### Variáveis Opcionais:

```
VITE_OPENAI_API_KEY=sk-...
```

**⚠️ IMPORTANTE**: A `VITE_API_URL` deve apontar para o domínio de produção, não para localhost!

### 2.2 Fazer Deploy

```bash
git add .
git commit -m "Deploy: Migração para Neon concluída"
git push
```

### 2.3 Verificar Deploy

Acesse: `https://aligner-kids.vercel.app/api/health`

Deve retornar: `{"status":"healthy","database":"connected"}`

## 🧪 3. Testar

- Login: `leomachadopt@gmail.com` / `Admin123`
- Criar clínica, registrar pacientes, etc.

## 🐛 4. Troubleshooting

### CORS Error
Verificar `server/app.ts` tem a URL correta em `cors.origin`

### Failed to fetch
Adicionar `VITE_API_URL` no Vercel e fazer redeploy

### Database Error
Verificar `DATABASE_URL` no Vercel Environment Variables
