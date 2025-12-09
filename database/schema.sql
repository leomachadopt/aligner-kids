-- Kids Aligner - Database Schema for Neon PostgreSQL
-- Sistema de Histórias Personalizadas com IA
-- v2.0 - Arquitetura Multi-Tenancy com Clínicas

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para bcrypt

-- ============================================
-- TABELA: clinics
-- Clínicas cadastradas na plataforma
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Informações da Clínica
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL amigável (ex: clinica-smile)
  logo_url TEXT,

  -- Contato
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),

  -- Endereço
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),

  -- Configurações
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Cor primária da marca
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',

  -- Gamificação personalizada (JSON)
  gamification_config JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
  subscription_expires_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_clinics_slug ON clinics(slug);
CREATE INDEX idx_clinics_active ON clinics(is_active) WHERE is_active = true;
CREATE INDEX idx_clinics_tier ON clinics(subscription_tier);

-- ============================================
-- TABELA: users
-- Sistema de autenticação e gerenciamento de usuários
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Credenciais (email dos PAIS se for child-patient)
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Tipo de usuário (SEM 'guardian' - removido!)
  role VARCHAR(50) NOT NULL CHECK (role IN ('child-patient', 'patient', 'orthodontist', 'super-admin')),

  -- Informações pessoais (DA CRIANÇA se for child-patient)
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE, -- Opcional
  birth_date DATE,
  phone VARCHAR(20), -- Telefone de contato

  -- Informações do responsável (apenas informativo para child-patient)
  guardian_name VARCHAR(255), -- Nome do pai/mãe
  guardian_cpf VARCHAR(14), -- CPF do responsável
  guardian_phone VARCHAR(20), -- Telefone alternativo do responsável

  -- Específico para ortodontistas
  cro VARCHAR(20) UNIQUE, -- Registro profissional
  clinic_name VARCHAR(255), -- DEPRECATED: usar clinics.name

  -- Vínculo com clínica (multi-tenancy)
  clinic_id UUID,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true, -- False para ortodontistas até aprovação
  email_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT fk_users_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
  CONSTRAINT check_orthodontist_cro CHECK (role != 'orthodontist' OR cro IS NOT NULL),
  CONSTRAINT check_orthodontist_clinic CHECK (role != 'orthodontist' OR clinic_id IS NOT NULL),
  CONSTRAINT check_patient_clinic CHECK (role NOT IN ('patient', 'child-patient') OR clinic_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_users_cro ON users(cro) WHERE cro IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_clinic ON users(clinic_id) WHERE clinic_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_pending_approval ON users(is_approved, role) WHERE is_approved = false AND role = 'orthodontist';

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: treatments
-- Tratamentos ortodônticos
-- ============================================
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  patient_id UUID NOT NULL,
  orthodontist_id UUID NOT NULL,
  clinic_id UUID NOT NULL,

  -- Informações do Tratamento
  treatment_code VARCHAR(50) UNIQUE NOT NULL,
  total_aligners INTEGER NOT NULL,
  current_aligner INTEGER DEFAULT 1,

  -- Datas
  start_date DATE NOT NULL,
  estimated_end_date DATE NOT NULL,
  actual_end_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled')),

  -- Notas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT fk_treatments_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_treatments_orthodontist FOREIGN KEY (orthodontist_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_treatments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
  CONSTRAINT check_current_aligner_range CHECK (current_aligner >= 1 AND current_aligner <= total_aligners)
);

-- Índices
CREATE INDEX idx_treatments_patient ON treatments(patient_id);
CREATE INDEX idx_treatments_orthodontist ON treatments(orthodontist_id);
CREATE INDEX idx_treatments_clinic ON treatments(clinic_id);
CREATE INDEX idx_treatments_status ON treatments(status);
CREATE INDEX idx_treatments_code ON treatments(treatment_code);

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: story_prompts
-- Gerenciamento de prompts pela super admin
-- ============================================
CREATE TABLE IF NOT EXISTS story_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  age_ranges JSONB NOT NULL DEFAULT '{"3-5": "", "6-8": "", "9-12": ""}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL, -- ref: users.id (super admin)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT story_prompts_name_unique UNIQUE (name),
  CONSTRAINT fk_prompts_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Índices para performance
CREATE INDEX idx_story_prompts_active ON story_prompts(is_active);
CREATE INDEX idx_story_prompts_created_at ON story_prompts(created_at DESC);

-- ============================================
-- TABELA: story_series
-- UMA série de história por paciente (V3)
-- ============================================
CREATE TABLE IF NOT EXISTS story_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL UNIQUE, -- Uma história por paciente
  orthodontist_id UUID, -- Quem gerencia (referência ao ortodontista)

  -- Informações da história
  title VARCHAR(200) NOT NULL,
  description TEXT,
  total_chapters INTEGER NOT NULL,
  total_aligners INTEGER NOT NULL, -- Mesmo que total_chapters

  -- Preferências usadas na geração
  preferences JSONB NOT NULL,

  -- Status
  is_complete BOOLEAN DEFAULT false,
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_series_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_series_orthodontist FOREIGN KEY (orthodontist_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_story_series_patient ON story_series(patient_id);
CREATE INDEX idx_story_series_orthodontist ON story_series(orthodontist_id);
CREATE INDEX idx_story_series_complete ON story_series(is_complete);

-- ============================================
-- TABELA: generated_stories
-- Capítulos individuais das histórias (V3)
-- ============================================
CREATE TABLE IF NOT EXISTS generated_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vínculo com série
  story_series_id UUID NOT NULL, -- ref: story_series.id
  patient_id UUID NOT NULL, -- ref: users.id (criança)

  -- Informações do capítulo
  chapter_number INTEGER NOT NULL,
  required_aligner_number INTEGER NOT NULL, -- Qual alinhador desbloqueia

  -- Conteúdo
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER,
  estimated_reading_time INTEGER, -- em minutos

  -- Metadata de geração
  prompt_id UUID, -- ref: story_prompts.id (opcional)
  model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  generation_time_ms INTEGER,

  -- Interações do usuário
  is_read BOOLEAN DEFAULT false,
  read_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE,
  liked BOOLEAN DEFAULT false,

  -- Recursos multimídia
  audio_url TEXT, -- URL da narração ElevenLabs
  audio_duration_seconds INTEGER,
  image_url TEXT, -- Futuro: ilustração do capítulo

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_chapter_series FOREIGN KEY (story_series_id) REFERENCES story_series(id) ON DELETE CASCADE,
  CONSTRAINT fk_chapter_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chapter_prompt FOREIGN KEY (prompt_id) REFERENCES story_prompts(id) ON DELETE SET NULL,
  CONSTRAINT unique_chapter_per_series UNIQUE (story_series_id, chapter_number)
);

-- Índices para busca e performance
CREATE INDEX idx_generated_stories_series ON generated_stories(story_series_id);
CREATE INDEX idx_generated_stories_patient ON generated_stories(patient_id);
CREATE INDEX idx_generated_stories_chapter_num ON generated_stories(chapter_number);
CREATE INDEX idx_generated_stories_required_aligner ON generated_stories(required_aligner_number);
CREATE INDEX idx_generated_stories_created_at ON generated_stories(created_at DESC);

-- ============================================
-- TABELA: story_library
-- Biblioteca de histórias compartilháveis
-- ============================================
CREATE TABLE IF NOT EXISTS story_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  environment VARCHAR(50) NOT NULL,
  theme VARCHAR(50) NOT NULL,
  age_range VARCHAR(10) NOT NULL, -- '3-5', '6-8', '9-12'
  tags TEXT[] DEFAULT '{}',

  -- Estatísticas
  times_used INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),

  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL, -- ref: users.id (admin)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_library_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Índices
CREATE INDEX idx_story_library_environment ON story_library(environment);
CREATE INDEX idx_story_library_theme ON story_library(theme);
CREATE INDEX idx_story_library_age_range ON story_library(age_range);
CREATE INDEX idx_story_library_active ON story_library(is_active);

-- ============================================
-- TABELA: story_analytics
-- Analytics de uso do sistema de histórias
-- ============================================
CREATE TABLE IF NOT EXISTS story_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL, -- 'generated', 'read', 'liked', 'shared'
  story_id UUID, -- ref: generated_stories.id
  patient_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_analytics_story FOREIGN KEY (story_id) REFERENCES generated_stories(id) ON DELETE SET NULL,
  CONSTRAINT fk_analytics_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_story_analytics_event_type ON story_analytics(event_type);
CREATE INDEX idx_story_analytics_patient ON story_analytics(patient_id);
CREATE INDEX idx_story_analytics_created_at ON story_analytics(created_at DESC);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Aplicar trigger nas tabelas relevantes
CREATE TRIGGER update_story_prompts_updated_at BEFORE UPDATE ON story_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_series_updated_at BEFORE UPDATE ON story_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_stories_updated_at BEFORE UPDATE ON generated_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_library_updated_at BEFORE UPDATE ON story_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Estatísticas de uso por paciente
CREATE OR REPLACE VIEW patient_story_stats AS
SELECT
  p.patient_id,
  COUNT(*) as total_stories,
  COUNT(*) FILTER (WHERE p.liked = true) as liked_stories,
  SUM(p.read_count) as total_reads,
  MAX(p.created_at) as last_story_created,
  MAX(p.last_read_at) as last_story_read
FROM generated_stories p
GROUP BY p.patient_id;

-- View: Histórias populares
CREATE OR REPLACE VIEW popular_stories AS
SELECT
  id,
  title,
  patient_id,
  read_count,
  liked,
  created_at,
  RANK() OVER (ORDER BY read_count DESC, liked DESC) as popularity_rank
FROM generated_stories
WHERE read_count > 0
ORDER BY read_count DESC, liked DESC
LIMIT 100;

-- View: Estatísticas por clínica
CREATE OR REPLACE VIEW clinic_stats AS
SELECT
  c.id as clinic_id,
  c.name as clinic_name,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'orthodontist') as total_orthodontists,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role IN ('patient', 'child-patient')) as total_patients,
  COUNT(DISTINCT t.id) as total_treatments,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active') as active_treatments,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_treatments,
  COUNT(DISTINCT gs.id) as total_stories_generated
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id
LEFT JOIN treatments t ON t.clinic_id = c.id
LEFT JOIN generated_stories gs ON gs.patient_id IN (
  SELECT id FROM users WHERE clinic_id = c.id AND role IN ('patient', 'child-patient')
)
WHERE c.is_active = true
GROUP BY c.id, c.name;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE clinics IS 'Clínicas cadastradas na plataforma (multi-tenancy)';
COMMENT ON TABLE users IS 'Usuários do sistema (pacientes, ortodontistas, super-admins)';
COMMENT ON TABLE treatments IS 'Tratamentos ortodônticos vinculados a pacientes e clínicas';
COMMENT ON TABLE story_prompts IS 'Gerenciamento de prompts do sistema pela super admin';
COMMENT ON TABLE story_series IS 'Uma série/história completa por paciente (V3 - 1 alinhador = 1 capítulo)';
COMMENT ON TABLE generated_stories IS 'Capítulos individuais das histórias geradas pela IA';
COMMENT ON TABLE story_library IS 'Biblioteca de histórias pré-aprovadas compartilháveis';
COMMENT ON TABLE story_analytics IS 'Analytics e tracking de uso do sistema de histórias';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas sensíveis
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_stories ENABLE ROW LEVEL SECURITY;

-- Políticas serão criadas quando conectar ao Neon com autenticação real

-- ============================================
-- DADOS INICIAIS (SEED)
-- ============================================

-- Clínica de demonstração
INSERT INTO clinics (
  id,
  name,
  slug,
  email,
  phone,
  address_city,
  address_state,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Clínica Demo Kids Aligner',
  'clinica-demo',
  'contato@demo.com',
  '(11) 99999-9999',
  'São Paulo',
  'SP',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Prompt padrão inicial (aguarda super-admin criado)
-- INSERT INTO story_prompts será feito após criar super-admin
