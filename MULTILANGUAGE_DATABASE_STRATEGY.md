# 🌍 Estratégia de Multi-idioma para Conteúdo Dinâmico (Banco de Dados)

## 📊 Situação Atual

### ✅ O Que JÁ Funciona
- **UI/Interface:** Tradução completa via i18next para textos estáticos
  - Menus, botões, labels, mensagens
  - 4 idiomas: pt-BR, pt-PT, en-US, es-ES
  - Componentes traduzidos: AppSidebar, Header, PatientDashboard, AlignerTracker, PatientMissions

- **Campo de idioma:** Tabela `users` já possui `preferred_language` (padrão: 'pt-BR')

### ❌ O Que NÃO Funciona
- **Conteúdo dinâmico do banco** ainda está apenas em português:
  - Nomes e descrições de missões (`mission_templates`)
  - Nomes e descrições de recompensas/loja (`reward_programs`, store items)
  - Conteúdo educacional
  - Títulos de conquistas/badges
  - Story options (histórias personalizadas)

### 📄 Páginas Ainda Não Traduzidas
- `/photos` - Fotos de progresso
- `/chat` - Sistema de chat
- `/my-treatment` - Linha do tempo do tratamento
- `/store` - Loja de recompensas
- `/education` - Conteúdo educacional
- `/gamification` - Sistema de gamificação detalhado
- `/my-rewards` - Recompensas do paciente

---

## 🎯 Problema Identificado

**Exemplo prático:**
1. Paciente inglês (preferred_language: 'en-US') faz login
2. Interface aparece em inglês ✅
3. MAS as missões aparecem em português ❌
   - "Use o alinhador por 22 horas" ao invés de "Wear aligner for 22 hours"

**Por quê?**
- Tabelas como `mission_templates` têm apenas:
  ```sql
  "name" varchar(255) NOT NULL,
  "description" text NOT NULL,
  ```
- Não há campos para traduções em outros idiomas

---

## 🔧 Soluções Possíveis

### Opção 1: Campos Múltiplos por Idioma ❌ NÃO RECOMENDADO
```sql
ALTER TABLE mission_templates ADD COLUMN name_pt_br VARCHAR(255);
ALTER TABLE mission_templates ADD COLUMN name_en_us VARCHAR(255);
ALTER TABLE mission_templates ADD COLUMN name_es_es VARCHAR(255);
ALTER TABLE mission_templates ADD COLUMN name_pt_pt VARCHAR(255);
-- Repetir para description, etc
```

**Problemas:**
- Tabelas ficam muito largas
- Dificulta adicionar novos idiomas
- Muito trabalho para atualizar

---

### Opção 2: Tabela de Traduções (Normalizada) ✅ RECOMENDADO

Criar uma tabela genérica de traduções:

```sql
CREATE TABLE translations (
  id VARCHAR(255) PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,  -- 'mission_template', 'reward_program', etc
  entity_id VARCHAR(255) NOT NULL,     -- ID da entidade original
  field_name VARCHAR(100) NOT NULL,    -- 'name', 'description', etc
  language VARCHAR(10) NOT NULL,       -- 'pt-BR', 'en-US', etc
  value TEXT NOT NULL,                 -- Texto traduzido
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, field_name, language)
);

CREATE INDEX idx_translations_lookup
  ON translations(entity_type, entity_id, language);
```

**Vantagens:**
- ✅ Escalável - fácil adicionar novos idiomas
- ✅ Flexível - funciona para qualquer tabela
- ✅ Eficiente - uma única tabela para todas as traduções
- ✅ Manutenção simples

**Como usar:**
```sql
-- Buscar missão em inglês
SELECT
  mt.*,
  COALESCE(t_name.value, mt.name) as name,
  COALESCE(t_desc.value, mt.description) as description
FROM mission_templates mt
LEFT JOIN translations t_name ON (
  t_name.entity_type = 'mission_template'
  AND t_name.entity_id = mt.id
  AND t_name.field_name = 'name'
  AND t_name.language = 'en-US'
)
LEFT JOIN translations t_desc ON (
  t_desc.entity_type = 'mission_template'
  AND t_desc.entity_id = mt.id
  AND t_desc.field_name = 'description'
  AND t_desc.language = 'en-US'
)
WHERE mt.id = '...';
```

---

### Opção 3: Coluna JSONB ⚠️ ALTERNATIVA

```sql
ALTER TABLE mission_templates
  ADD COLUMN translations JSONB DEFAULT '{}';

-- Exemplo de dados:
{
  "name": {
    "pt-BR": "Use o alinhador por 22 horas",
    "en-US": "Wear aligner for 22 hours",
    "es-ES": "Usa el alineador por 22 horas",
    "pt-PT": "Usa o alinhador durante 22 horas"
  },
  "description": {
    "pt-BR": "...",
    "en-US": "..."
  }
}
```

**Vantagens:**
- Simples de implementar
- Bom para PostgreSQL (índices em JSONB)

**Desvantagens:**
- Mais difícil de validar
- Queries mais complexas
- Dificulta buscas textuais

---

## 📋 Implementação Recomendada (Opção 2)

### Fase 1: Migração do Banco ✅ CRÍTICO
1. Criar tabela `translations`
2. Popular com traduções iniciais das missões existentes
3. Criar helper functions no backend

### Fase 2: Atualizar Backend
Criar service para buscar conteúdo traduzido:

```typescript
// server/services/translationService.ts
export class TranslationService {
  static async getTranslatedMissions(
    language: string,
    clinicId?: string
  ) {
    // Busca missões com traduções aplicadas
    const missions = await db
      .select({
        id: missionTemplates.id,
        name: sql`COALESCE(
          ${translations.value},
          ${missionTemplates.name}
        )`,
        // ... outros campos
      })
      .from(missionTemplates)
      .leftJoin(
        translations,
        and(
          eq(translations.entityType, 'mission_template'),
          eq(translations.entityId, missionTemplates.id),
          eq(translations.fieldName, 'name'),
          eq(translations.language, language)
        )
      );

    return missions;
  }
}
```

### Fase 3: Atualizar Frontend
Páginas devem buscar dados já traduzidos do backend:

```typescript
// src/pages/Photos.tsx
const Photos = () => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  // Backend já retorna traduzido baseado em user.preferredLanguage
  const loadPhotos = async () => {
    const response = await fetch(
      `/api/photos/${user.id}?language=${user.preferredLanguage}`
    )
    // ...
  }
}
```

---

## 🎬 Roadmap de Implementação

### Sprint 1: Base de Dados (2-3 dias)
- [ ] Criar migration para tabela `translations`
- [ ] Popular traduções iniciais (missões, recompensas principais)
- [ ] Criar TranslationService no backend
- [ ] Testar queries de tradução

### Sprint 2: Backend APIs (3-4 dias)
- [ ] Atualizar `/api/missions/templates` para retornar traduzido
- [ ] Atualizar `/api/rewards/*` para retornar traduzido
- [ ] Atualizar `/api/education/*` para retornar traduzido
- [ ] Adicionar query param `?language=` em todas as APIs

### Sprint 3: Frontend - Páginas (4-5 dias)
- [ ] Traduzir página Photos
- [ ] Traduzir página Chat
- [ ] Traduzir página MyTreatment
- [ ] Traduzir página Store
- [ ] Traduzir página Education
- [ ] Traduzir página Gamification
- [ ] Traduzir página MyRewards

### Sprint 4: Admin & Ferramentas (2-3 dias)
- [ ] Criar interface de administração de traduções
- [ ] Tool para exportar/importar traduções
- [ ] Validação de traduções faltantes

---

## 🚀 Quick Win: Solução Híbrida Temporária

Enquanto não implementamos a Opção 2 completa, podemos:

1. **Para missões**: Usar i18n no frontend para templates conhecidos
```typescript
// Manter IDs fixos de missões e traduzir no frontend
const MISSION_TRANSLATIONS = {
  'daily-22h': {
    name: t('missions.usage.dailyPerfect'),
    description: t('missions.usage.dailyPerfectDesc')
  }
}
```

2. **Para conteúdo novo**: Criar já com suporte a JSONB
```sql
-- Novas tabelas já nascem com suporte multi-idioma
CREATE TABLE new_content (
  id VARCHAR(255),
  translations JSONB DEFAULT '{}'
)
```

---

## ✅ Decisão Necessária

**Qual abordagem seguir?**

1. **Opção 2 (Tabela de Traduções)** - Recomendado para longo prazo
2. **Quick Win Híbrida** - Para ganhar tempo agora
3. **Opção 3 (JSONB)** - Compromisso entre as duas

**Minha recomendação:**
Começar com **Quick Win** para desbloquear agora + planejar **Opção 2** para próxima sprint.
