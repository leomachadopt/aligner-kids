# Sistema Multi-Língua - Kids Aligner

## 📋 Visão Geral

Sistema de internacionalização (i18n) implementado usando **react-i18next**, permitindo que a aplicação se adapte automaticamente ao idioma preferido do paciente.

## 🌍 Idiomas Suportados

- **pt-BR** - Português (Brasil) - Padrão
- **en-US** - Inglês (Estados Unidos)
- **es-ES** - Espanhol (Espanha)

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── locales/
│   ├── pt-BR.json          # Traduções em português
│   ├── en-US.json          # Traduções em inglês
│   └── es-ES.json          # Traduções em espanhol
├── i18n/
│   └── config.ts           # Configuração do i18next
├── context/
│   └── LanguageContext.tsx # Provider de idioma
└── components/
    └── LanguageSelector.tsx # Componente seletor de idioma
```

### Fluxo de Funcionamento

```
1. Usuário faz login
   ↓
2. AuthContext carrega user.preferredLanguage
   ↓
3. LanguageProvider detecta e aplica idioma
   ↓
4. i18next muda idioma automaticamente
   ↓
5. Todos os componentes com useTranslation() atualizam
```

## 🔧 Configuração

### 1. Instalação (✅ Completo)

```bash
pnpm add i18next react-i18next i18next-browser-languagedetector
```

### 2. Configuração i18next (✅ Completo)

Arquivo: `src/i18n/config.ts`

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'es-ES': { translation: esES },
    },
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  })
```

### 3. Providers (✅ Completo)

Arquivo: `src/App.tsx`

```typescript
import '@/i18n/config'
import { LanguageProvider } from '@/context/LanguageContext'

<AuthProvider>
  <LanguageProvider>  {/* Deve vir depois do AuthProvider */}
    {/* outros providers */}
  </LanguageProvider>
</AuthProvider>
```

## 📝 Como Usar

### Em Componentes React

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('patient.dashboard.title')}</h1>
      <p>{t('patient.dashboard.nextMission')}</p>
    </div>
  )
}
```

### Com Pluralização

```typescript
// No arquivo de tradução
{
  "patient": {
    "dashboard": {
      "daysRemaining_one": "{{count}} dia",
      "daysRemaining_other": "{{count}} dias"
    }
  }
}

// No componente
<p>{t('patient.dashboard.daysRemaining', { count: daysRemaining })}</p>
```

### Com Interpolação

```typescript
// No arquivo de tradução
{
  "aligner": {
    "number": "Alinhador #{{number}}"
  }
}

// No componente
<p>{t('aligner.number', { number: currentAligner?.number })}</p>
```

### Trocar Idioma

```typescript
import { useLanguage } from '@/context/LanguageContext'

function LanguageSettings() {
  const { currentLanguage, changeLanguage } = useLanguage()

  return (
    <button onClick={() => changeLanguage('en-US')}>
      Switch to English
    </button>
  )
}
```

## 🎨 Componente Seletor de Idioma (✅ Completo)

### Uso Básico

```typescript
import { LanguageSelector } from '@/components/LanguageSelector'

// No header ou menu
<LanguageSelector variant="dropdown" />

// Em configurações
<LanguageSelector variant="select" showLabel />
```

### Variantes

1. **Dropdown** (padrão) - Ícone de globo que abre menu
2. **Select** - Select box com bandeiras e nomes

## 📋 Estrutura de Traduções

### Namespaces Organizados

```json
{
  "common": {
    "welcome": "Bem-vindo",
    "loading": "Carregando...",
    "save": "Salvar"
  },
  "auth": {
    "login": "Entrar",
    "register": "Cadastrar"
  },
  "patient": {
    "dashboard": {
      "title": "E aí, Campeão!",
      "startTreatment": "Pronto para Começar?"
    },
    "missions": {
      "activeMissions": "Missões Ativas"
    },
    "aligner": {
      "currentAligner": "Alinhador Atual"
    }
  },
  "missions": {
    "usage": {},
    "hygiene": {},
    "milestones": {}
  },
  "timeline": {},
  "gamification": {},
  "settings": {},
  "errors": {}
}
```

## 🔄 Migração de Componentes

### Antes (Hard-coded)

```typescript
function Dashboard() {
  return (
    <div>
      <h1>E aí, Campeão!</h1>
      <p>Próxima Missão: Trocar Alinhador!</p>
      <p>{daysRemaining} dias</p>
    </div>
  )
}
```

### Depois (i18n)

```typescript
import { useTranslation } from 'react-i18next'

function Dashboard() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('patient.dashboard.title')}</h1>
      <p>{t('patient.dashboard.nextMission')}</p>
      <p>{t('patient.dashboard.daysRemaining', { count: daysRemaining })}</p>
    </div>
  )
}
```

## 🎯 Componentes para Migrar

### Prioridade Alta (Pacientes)
- [x] LanguageSelector
- [ ] PatientDashboard
- [ ] PatientMissions
- [ ] AlignerTracker
- [ ] TreatmentTimeline

### Prioridade Média
- [ ] Profile
- [ ] Settings
- [ ] Photos
- [ ] Chat
- [ ] Education

### Prioridade Baixa (Admin)
- [ ] Admin panels
- [ ] Reports
- [ ] Configurations

## 🔐 Backend

### Endpoint de Atualização

```typescript
PUT /api/users/:userId
{
  "preferredLanguage": "en-US"
}
```

### Campo no Banco de Dados

```sql
-- Já existe no schema
preferredLanguage VARCHAR(10) DEFAULT 'pt-BR'
```

## 📱 Detecção Automática

O sistema detecta o idioma nesta ordem:

1. **Idioma do usuário logado** (`user.preferredLanguage`)
2. **localStorage** (`i18nextLng`)
3. **Navegador** (`navigator.language`)
4. **Fallback** (`pt-BR`)

## 🎨 Exemplo Completo: PatientDashboard

```typescript
import { useTranslation } from 'react-i18next'

function PatientDashboard() {
  const { t } = useTranslation()
  const { isChild } = useUserRole()

  if (isChild) {
    return (
      <div className="space-y-6">
        <h1>{t('patient.dashboard.title')}</h1>

        {needsToStart ? (
          <>
            <p>{t('patient.dashboard.startMessage')}</p>
            <Button onClick={handleStart}>
              {t('patient.dashboard.startButton')}
            </Button>
          </>
        ) : (
          <>
            <p>{t('patient.dashboard.daysRemaining', { count: daysRemaining })}</p>
            <p>{t('patient.dashboard.alignerNumber', { number: currentAligner.number })}</p>
            <Button onClick={handleChange}>
              {t('patient.dashboard.switchButton')}
            </Button>
          </>
        )}
      </div>
    )
  }
}
```

## 🚀 Próximos Passos

1. **Migrar componentes principais** (PatientDashboard, Missions)
2. **Adicionar mais traduções** conforme necessário
3. **Testar com usuários** de diferentes idiomas
4. **Adicionar mais idiomas** se necessário
5. **Criar ferramenta de gerenciamento** de traduções para admin

## 📊 Métricas de Sucesso

- [ ] 100% dos textos visíveis ao paciente traduzidos
- [x] Seletor de idioma funcionando
- [x] Persistência de idioma no perfil
- [ ] Testes com 3 idiomas
- [ ] Documentação completa

## 🐛 Troubleshooting

### Traduções não aparecem

```typescript
// Verificar se i18n foi inicializado
import '@/i18n/config'

// Verificar se está no Provider
<LanguageProvider>
  <MyComponent />
</LanguageProvider>
```

### Idioma não muda

```typescript
// Verificar se LanguageProvider está DEPOIS do AuthProvider
<AuthProvider>
  <LanguageProvider>  {/* CORRETO */}
```

### Pluralização não funciona

```json
// Use _one e _other (não _singular e _plural)
{
  "key_one": "{{count}} item",
  "key_other": "{{count}} items"
}
```

## 📚 Recursos

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Pluralization Rules](https://www.i18next.com/translation-function/plurals)
- [Interpolation](https://www.i18next.com/translation-function/interpolation)

## ✅ Status Atual

- ✅ Bibliotecas instaladas
- ✅ Configuração i18next criada
- ✅ Arquivos de tradução criados (PT, EN, ES)
- ✅ LanguageProvider implementado
- ✅ LanguageSelector criado
- ✅ Integrado ao AuthContext
- ⏳ Migração de componentes (em andamento)
- ⏳ Testes multi-idioma (pendente)
- ⏳ Documentação de uso (este arquivo!)

---

**Última atualização**: 2025-12-21
**Autor**: Sistema Multi-Língua Kids Aligner
