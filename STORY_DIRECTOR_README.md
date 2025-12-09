# 📚 Sistema de Histórias Personalizadas - Story Director

## Visão Geral

O **Story Director** é uma funcionalidade inovadora que permite às crianças criarem suas próprias histórias personalizadas usando IA. A criança atua como "diretora" da história, escolhendo ambiente, personagens, tema e outros elementos, resultando em uma narrativa única e mágica.

## 🎯 Recursos Implementados

### ✅ Frontend
- **Story Director** (Wizard multi-step)
  - Seleção de ambiente (8 opções)
  - Seleção de personagem principal (10 opções)
  - Seleção de ajudante/sidekick (opcional)
  - Seleção de tema da aventura (7 opções)
  - Personalização (nome do personagem, idade)
  - Loading animado durante geração

- **Story Reader** (Visualizador de histórias)
  - Layout imersivo otimizado para leitura
  - Botão de "curtir" com animação
  - Contador de leituras
  - Botões de compartilhamento e download (preparados)
  - Botão para criar nova história
  - Primeira letra destacada (drop cap)
  - Tempo estimado de leitura

- **Admin Panel** (Gestão de prompts)
  - CRUD completo de prompts
  - Ativar/desativar prompts
  - Configuração por faixa etária (3-5, 6-8, 9-12)
  - Templates com variáveis
  - Interface intuitiva para super admins

### ✅ Backend/Infraestrutura
- **Schema SQL completo** para Neon PostgreSQL
  - Tabela `story_prompts` (gerenciamento de prompts)
  - Tabela `story_preferences` (preferências de cada criança)
  - Tabela `generated_stories` (histórias geradas)
  - Tabela `story_library` (biblioteca compartilhável)
  - Tabela `story_analytics` (analytics)
  - Views para estatísticas
  - Triggers automáticos

- **Serviço OpenAI**
  - Integração completa com GPT-4
  - Interpolação de variáveis no prompt
  - Adaptação por faixa etária
  - Parsing de resposta
  - Contagem de tokens e palavras
  - Estimativa de tempo de leitura

### ✅ Sistema de Roles
- **3 papéis**: criança, dentista, super-admin
- Controle de acesso por role
- Contexto global de usuário

## 🚀 Como Usar

### Para Crianças

1. Acesse a página **Gamificação** (`/gamification`)
2. Clique no card **"Diretor de Histórias"**
3. Siga o wizard de 5 passos:
   - Passo 1: Escolha onde quer viver sua aventura
   - Passo 2: Escolha seu personagem principal
   - Passo 3: Escolha um ajudante (ou pule)
   - Passo 4: Escolha o tema da aventura
   - Passo 5: Personalize com seu nome e idade
4. Clique em **"Criar Minha História"**
5. Aguarde a magia acontecer! ✨
6. Leia sua história personalizada
7. Curta, compartilhe ou crie outra!

### Para Super Admins

1. Acesse o painel admin (`/admin/prompts`)
2. Gerencie os prompts do sistema:
   - Criar novos prompts
   - Editar prompts existentes
   - Ativar/desativar prompts
   - Configurar instruções por faixa etária
3. Os prompts ativos serão usados na geração

## 🔧 Configuração

### 1. Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
# OpenAI
VITE_OPENAI_API_KEY=sk-proj-...sua-chave-aqui...

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# API
VITE_API_URL=http://localhost:3001/api

# Feature Flags
VITE_ENABLE_STORY_DIRECTOR=true
```

### 2. Banco de Dados Neon

#### ✅ Configuração Completa:

**Connection String já configurada em `.env.local`**

Execute o schema SQL:

```bash
# Conecte ao banco Neon
psql 'postgresql://neondb_owner:npg_qpWvJ4TQfih0@ep-polished-tooth-abzovwgl-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Dentro do psql, execute:
\i database/schema.sql

# Verificar tabelas criadas:
\dt

# Sair:
\q
```

**Ou use a interface web**: [Neon Console](https://console.neon.tech/) → SQL Editor

📖 **Guia detalhado**: Consulte `DATABASE_SETUP.md`

### 3. Backend API (Próximo Passo)

**Status**: Atualmente usando localStorage (temporário)
**Próximo**: Criar API REST com Node.js/Express

Endpoints necessários:
```
POST   /api/stories/generate
GET    /api/stories/:patientId
GET    /api/stories/:id
PUT    /api/stories/:id
DELETE /api/stories/:id
POST   /api/stories/:id/like

GET    /api/prompts (admin only)
POST   /api/prompts (admin only)
PUT    /api/prompts/:id (admin only)
DELETE /api/prompts/:id (admin only)
```

## 📁 Estrutura de Arquivos

```
src/
├── pages/
│   ├── StoryDirector.tsx       # Wizard de criação
│   ├── StoryReader.tsx         # Visualizador de histórias
│   └── AdminPrompts.tsx        # Painel admin
├── services/
│   └── storyAI.ts              # Serviço OpenAI
├── types/
│   └── story.ts                # Tipos TypeScript
├── config/
│   └── storyOptions.ts         # Opções configuráveis
└── context/
    └── UserRoleContext.tsx     # Sistema de roles

database/
└── schema.sql                  # Schema PostgreSQL

.env.local                      # Variáveis de ambiente
```

## 💡 Opções de Personalização

### Ambientes
- 🌳 Floresta Mágica
- 🚀 Espaço Sideral
- 🏰 Reino Encantado
- 🌊 Fundo do Mar
- 🦁 Selva Aventureira
- ⛰️ Montanhas Geladas
- 🏜️ Deserto Misterioso
- ✨ Cidade Mágica

### Personagens
- 🐉 Dragão Amigável
- 🦄 Unicórnio Mágico
- 🤖 Robô Esperto
- 🧚 Fada Aventureira
- 🦸 Super-Herói
- 👸 Princesa Guerreira
- ⚔️ Cavaleiro Valente
- 👨‍🚀 Astronauta Explorador
- 🏴‍☠️ Pirata Aventureiro
- 🧙 Mago Sábio

### Temas
- ⚔️ Grande Aventura
- 🔍 Mistério Emocionante
- ❤️ Poder da Amizade
- 💪 Jornada Corajosa
- 🔬 Grande Descoberta
- ✨ Mundo Mágico
- 🚨 Missão de Resgate

## 🎨 Customizações

### Adicionar Novo Ambiente

Edite `src/config/storyOptions.ts`:

```typescript
{
  id: 'novo-ambiente',
  name: 'Nome do Ambiente',
  icon: '🌟',
  color: 'bg-blue-500',
  description: 'Descrição interessante',
}
```

### Adicionar Novo Personagem

```typescript
{
  id: 'novo-personagem',
  name: 'Nome do Personagem',
  icon: '🦖',
  color: 'bg-green-500',
  description: 'Descrição do personagem',
}
```

## 🔒 Segurança

### Variáveis de Ambiente
- ✅ `.env.local` está no `.gitignore`
- ✅ Chave OpenAI não é commitada
- ⚠️ **Importante**: Em produção, mover a chamada OpenAI para o backend

### Moderação de Conteúdo
- Prompts incluem instruções para conteúdo apropriado
- Sistema prompt enfatiza histórias educativas
- Incluir mensagens sobre saúde bucal

## 📊 Métricas e Analytics

O sistema rastreia:
- Total de histórias geradas
- Histórias curtidas
- Número de leituras
- Tokens usados (OpenAI)
- Tempo de geração
- Preferências populares

## 🚧 Próximos Passos

### Fase 2 - Backend
- [ ] Criar API REST com Express/Fastify
- [ ] Conectar com Neon PostgreSQL
- [ ] Implementar autenticação JWT
- [ ] Migrar lógica OpenAI para backend
- [ ] Implementar cache com Redis

### Fase 3 - Recursos Avançados
- [ ] Text-to-Speech (narração por voz)
- [ ] Geração de imagens (DALL-E 3)
- [ ] Histórias em série (continuação)
- [ ] Compartilhamento via link
- [ ] Export para PDF
- [ ] Biblioteca de histórias

### Fase 4 - Otimizações
- [ ] Cache de histórias populares
- [ ] Rate limiting
- [ ] Moderação automática de conteúdo
- [ ] A/B testing de prompts
- [ ] Analytics dashboard

## 💰 Custos Estimados

### OpenAI API
- Modelo: GPT-4-mini
- ~500-800 tokens por história
- Custo: ~$0.002-0.005 por história
- **Estimativa mensal** (500 histórias): $2.50-5.00

### Neon PostgreSQL
- Plano Free: Até 0.5 GB
- Plano Pro: $19/mês (3 GB)

### Recursos Opcionais
- Text-to-Speech (AWS Polly): ~$4/milhão caracteres
- DALL-E 3: ~$0.04 por imagem

## 🐛 Troubleshooting

### Erro: "OpenAI API key inválida"
- Verifique se a chave está correta no `.env.local`
- Reinicie o servidor de desenvolvimento

### Erro: "Não foi possível gerar história"
- Verifique conexão com internet
- Verifique limite de uso da API OpenAI
- Veja console para detalhes do erro

### História não aparece
- Limpe o localStorage do navegador
- Verifique console para erros

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte a documentação do OpenAI
3. Consulte a documentação do Neon

## 🎉 Conclusão

O sistema de Story Director está **completo e funcional** para MVP!

**Implementado:**
- ✅ Frontend completo e polido
- ✅ Integração com OpenAI
- ✅ Schema de banco de dados
- ✅ Sistema de roles
- ✅ Admin panel
- ✅ Configuração de ambientes

**Pronto para:**
- ✅ Testes com crianças
- ✅ Feedback e iterações
- ✅ Deploy em staging
- ⚠️ Produção (necessita backend)

---

**Desenvolvido com ❤️ para o Kids Aligner**
