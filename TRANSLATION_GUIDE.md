# 🌍 Guia de Tradução - Kids Aligner

## Estrutura de Arquivos de Tradução

Os arquivos de tradução estão em `src/locales/` e são organizados por **funcionalidade**, não por componente:

```
src/locales/
├── pt-BR.json  (Português Brasil - padrão)
├── pt-PT.json  (Português Portugal)
├── en-US.json  (Inglês)
└── es-ES.json  (Espanhol)
```

## Estrutura de Namespaces

### 1. `common` - Textos comuns reutilizáveis
Botões, ações, estados globais, etc.

```json
"common": {
  "actions": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Deletar",
    "edit": "Editar",
    "close": "Fechar"
  },
  "states": {
    "loading": "Carregando...",
    "success": "Sucesso!",
    "error": "Erro",
    "empty": "Nenhum item encontrado"
  }
}
```

### 2. `navigation` - Navegação do app
Menus, sidebar, breadcrumbs

```json
"navigation": {
  "appName": "App Alinhadores",
  "patient": { ... },
  "childPatient": { ... }
}
```

### 3. `patient` - Funcionalidades do paciente
Dashboard, tratamento, fotos, chat, etc.

```json
"patient": {
  "dashboard": { ... },
  "treatment": { ... },
  "photos": { ... },
  "chat": { ... }
}
```

### 4. `aligner` - Componentes de alinhador
Tracker, cartões, estatísticas

### 5. `missions` - Sistema de gamificação
Missões, conquistas, recompensas

### 6. `forms` - Formulários
Labels, placeholders, validações

## Como Usar Traduções

### Em Componentes React

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('patient.dashboard.title')}</h1>
      <button>{t('common.actions.save')}</button>
    </div>
  )
}
```

### Com Interpolação (variáveis)

```typescript
// JSON
"welcome": "Olá, {{name}}!"

// Componente
<h1>{t('common.welcome', { name: user.name })}</h1>
```

### Com Pluralização

```typescript
// JSON
"daysRemaining_one": "{{count}} dia restante"
"daysRemaining_other": "{{count}} dias restantes"

// Componente
<p>{t('patient.daysRemaining', { count: days })}</p>
```

## Regras de Tradução

1. **NUNCA** escreva texto diretamente no JSX
   ❌ `<button>Salvar</button>`
   ✅ `<button>{t('common.actions.save')}</button>`

2. **Use namespaces claros** seguindo a hierarquia
   ❌ `t('saveButton')`
   ✅ `t('common.actions.save')`

3. **Reutilize textos comuns** do namespace `common`

4. **Mantenha consistência** entre idiomas

5. **Teste em todos os idiomas** antes de fazer commit

## Adicionando Novas Traduções

1. Adicione a chave em **todos os 4 idiomas** (pt-BR, pt-PT, en-US, es-ES)
2. Use a mesma estrutura de namespace
3. Teste a tradução no app
4. Commit apenas quando todos os idiomas estiverem completos

## Idioma Padrão

- **Padrão**: pt-BR
- **Sincroniza** com `user.preferredLanguage` no login
- **Selector**: 🌐 no header

## Debugging

Para ver qual idioma está ativo:
```typescript
const { i18n } = useTranslation()
console.log('Current language:', i18n.language)
```

## Componentes Prioritários

### ✅ Já Traduzidos
- AppSidebar
- Header
- PatientDashboard
- LanguageSelector

### 🔄 Em Progresso
- AlignerTracker
- PatientMissions
- GamificationStats

### ⏳ Pendentes (prioridade alta)
- Photos
- Chat
- MyTreatment
- Store
- Education
