# 🗄️ Setup do Banco de Dados - Neon PostgreSQL

## Informações de Conexão

**Database**: Neon PostgreSQL (EU West 2)
**Connection String**: Configurada em `.env.local`

---

## 📋 Passo a Passo - Setup Completo

### Opção 1: Via psql (Terminal)

#### 1. Conectar ao Banco

```bash
psql 'postgresql://neondb_owner:npg_qpWvJ4TQfih0@ep-polished-tooth-abzovwgl-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

Se psql não estiver instalado:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Baixar de: https://www.postgresql.org/download/windows/
```

#### 2. Executar o Schema

Após conectar, dentro do psql:

```sql
-- Copie e cole TODO o conteúdo do arquivo database/schema.sql
-- ou execute:
\i database/schema.sql
```

#### 3. Verificar Instalação

```sql
-- Listar tabelas criadas
\dt

-- Deve mostrar:
-- story_prompts
-- story_preferences
-- generated_stories
-- story_library
-- story_analytics

-- Ver detalhes de uma tabela
\d story_prompts

-- Sair do psql
\q
```

---

### Opção 2: Via Neon Console (Interface Web)

#### 1. Acessar Neon Console

1. Acesse: https://console.neon.tech/
2. Faça login na sua conta
3. Selecione o projeto atual

#### 2. SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Abra o arquivo `database/schema.sql` no seu editor
3. Copie **TODO o conteúdo** do arquivo
4. Cole no SQL Editor do Neon
5. Clique em **Run** ou pressione `Ctrl+Enter`

#### 3. Verificar Criação

No SQL Editor, execute:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deve retornar:
- generated_stories
- story_analytics
- story_library
- story_preferences
- story_prompts

---

## ✅ Verificação Rápida

Execute este comando para verificar se tudo está OK:

```sql
-- Verificar todas as tabelas e contagem
SELECT
  'story_prompts' as table_name,
  COUNT(*) as count
FROM story_prompts
UNION ALL
SELECT 'story_preferences', COUNT(*) FROM story_preferences
UNION ALL
SELECT 'generated_stories', COUNT(*) FROM generated_stories
UNION ALL
SELECT 'story_library', COUNT(*) FROM story_library
UNION ALL
SELECT 'story_analytics', COUNT(*) FROM story_analytics;
```

**Resultado Esperado:**
```
     table_name     | count
--------------------+-------
 story_prompts      |     1
 story_preferences  |     0
 generated_stories  |     0
 story_library      |     0
 story_analytics    |     0
```

> ✅ O prompt padrão já vem inserido pelo schema!

---

## 🔍 Comandos Úteis

### Ver dados do prompt padrão
```sql
SELECT id, name, is_active
FROM story_prompts;
```

### Ver estrutura completa de uma tabela
```sql
\d+ generated_stories
```

### Ver todas as views criadas
```sql
\dv
```

Deve mostrar:
- patient_story_stats
- popular_stories

### Testar a view de estatísticas
```sql
SELECT * FROM patient_story_stats LIMIT 5;
```

---

## 🐛 Troubleshooting

### Erro: "relation already exists"

Se você já executou o schema antes e quer recomeçar:

```sql
-- ⚠️ ATENÇÃO: Isso apaga TODOS os dados!
DROP TABLE IF EXISTS story_analytics CASCADE;
DROP TABLE IF EXISTS generated_stories CASCADE;
DROP TABLE IF EXISTS story_library CASCADE;
DROP TABLE IF EXISTS story_preferences CASCADE;
DROP TABLE IF EXISTS story_prompts CASCADE;
DROP VIEW IF EXISTS patient_story_stats CASCADE;
DROP VIEW IF EXISTS popular_stories CASCADE;

-- Depois execute o schema.sql novamente
```

### Erro: "psql: command not found"

Instale o PostgreSQL client:
- **macOS**: `brew install postgresql`
- **Ubuntu**: `sudo apt-get install postgresql-client`
- **Windows**: Baixe de postgresql.org

### Erro de conexão SSL

Se der erro de SSL, tente sem `channel_binding`:

```bash
psql 'postgresql://neondb_owner:npg_qpWvJ4TQfih0@ep-polished-tooth-abzovwgl-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
```

---

## 📊 Dados de Exemplo (Opcional)

Após criar as tabelas, você pode inserir dados de teste:

```sql
-- Inserir preferências de exemplo
INSERT INTO story_preferences (
  patient_id,
  environment,
  main_character,
  main_character_name,
  theme,
  age_group
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'espaco',
  'robot',
  'Robo-Max',
  'aventura',
  8
);

-- Verificar inserção
SELECT * FROM story_preferences;
```

---

## 🚀 Próximo Passo: Backend API

Após configurar o banco, você precisará criar a API backend para:

1. **Conectar ao Neon via Node.js**
2. **Expor endpoints REST**
3. **Gerenciar autenticação**
4. **Processar chamadas OpenAI**

### Exemplo de conexão (Node.js)

```javascript
// server.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Teste de conexão
const client = await pool.connect();
console.log('✅ Conectado ao Neon!');
client.release();
```

---

## 📝 Checklist Final

- [ ] ✅ .env.local atualizado com credenciais
- [ ] ✅ psql instalado (ou acesso ao Neon Console)
- [ ] ✅ Conectado ao banco
- [ ] ✅ Schema SQL executado
- [ ] ✅ Tabelas criadas verificadas
- [ ] ✅ Prompt padrão inserido
- [ ] 🔲 Backend API criado (próxima fase)

---

## 🎯 Status Atual

**Banco de Dados**: ✅ Configurado e pronto
**Frontend**: ✅ Completo e funcional
**API Backend**: ⚠️ Pendente (próxima fase)

**Atualmente**: Sistema usa localStorage (temporário)
**Próximo passo**: Criar API para conectar frontend → Neon

---

## 💡 Dicas

1. **Backup**: Neon faz backup automático, mas você pode exportar:
   ```bash
   pg_dump 'postgresql://...' > backup.sql
   ```

2. **Monitoramento**: Acesse o dashboard do Neon para ver:
   - Uso de armazenamento
   - Queries executadas
   - Performance

3. **Limites Free Tier**:
   - 0.5 GB de armazenamento
   - Projetos ilimitados
   - Compute até 300h/mês

---

**Setup concluído! 🎉**

Agora você pode começar a desenvolver a API backend para conectar o frontend ao banco de dados.
