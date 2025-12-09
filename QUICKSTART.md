# 🚀 Quickstart - Story Director

## Iniciar em 3 Passos

### 1️⃣ Banco de Dados (5 minutos)

```bash
# Conectar ao Neon
psql 'postgresql://neondb_owner:npg_qpWvJ4TQfih0@ep-polished-tooth-abzovwgl-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

Dentro do psql, copie e cole TODO o conteúdo de `database/schema.sql` e execute.

Ou use: https://console.neon.tech/ → SQL Editor

### 2️⃣ Iniciar Aplicação

```bash
npm run dev
```

### 3️⃣ Testar

Abra: http://localhost:5173

1. Login (qualquer usuário)
2. Navegue para **Gamificação**
3. Clique em **"Diretor de Histórias"**
4. Crie sua primeira história! 🎉

---

## ✅ Configurações

**Tudo já está configurado em `.env.local`:**

- ✅ OpenAI API Key
- ✅ Neon Database URL
- ✅ Feature flags

**Não precisa alterar nada!**

---

## 🎬 Fluxo de Uso

```
Gamificação → Diretor de Histórias → Escolher opções → Criar → Ler história
```

**Tempo total**: ~2 minutos para criar uma história

---

## 📱 Telas Principais

1. **`/gamification`** - Botão "Diretor de Histórias"
2. **`/story-director`** - Wizard de criação (5 passos)
3. **`/story-reader/:id`** - Ler história gerada
4. **`/admin/prompts`** - Gerenciar prompts (super admin)

---

## 🐛 Problemas?

**História não aparece?**
- Verifique console do navegador (F12)
- Veja se OpenAI API key está correta

**Erro de banco?**
- Atualmente usa localStorage (temporário)
- Backend será necessário para produção

**Build falha?**
- Execute: `npm install`
- Depois: `npm run build:dev`

---

## 📚 Documentação Completa

- `STORY_DIRECTOR_README.md` - Guia completo
- `DATABASE_SETUP.md` - Setup detalhado do banco
- `database/schema.sql` - Schema SQL

---

**Pronto para testar! 🎉**
