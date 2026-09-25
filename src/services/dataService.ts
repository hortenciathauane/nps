import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Customer, Survey, SurveyQuestion, SurveyResponse, SurveyToken, SupabaseConfig, ResponseAnswer } from '../types/nps';
import { getClassification } from './npsCalculator';

const STORAGE_KEYS = {
  SURVEYS: 'nps_academic_surveys',
  CUSTOMERS: 'nps_academic_customers',
  TOKENS: 'nps_academic_tokens',
  RESPONSES: 'nps_academic_responses',
  CONFIG: 'nps_academic_supabase_config',
};

// Default initial academic sample dataset
const DEFAULT_SURVEYS: Survey[] = [
  {
    id: 'srv-001',
    title: 'Pesquisa Geral de Satisfação e Recomendação - 2026.1',
    description: 'Avalie sua experiência geral com nossos serviços educacionais, infraestrutura e atendimento.',
    is_active: true,
    created_at: '2026-03-01T10:00:00.000Z',
    updated_at: '2026-03-01T10:00:00.000Z',
    questions: [
      {
        id: 'q-nps-1',
        survey_id: 'srv-001',
        type: 'nps',
        text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        description: '0 significa "nada provável" e 10 significa "extremamente provável".',
        required: true,
        order_index: 0,
      },
      {
        id: 'q-text-1',
        survey_id: 'srv-001',
        type: 'text',
        text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        description: 'Compartilhe detalhes sobre os pontos fortes ou aspectos que motivaram sua avaliação.',
        required: true,
        order_index: 1,
      },
      {
        id: 'q-text-2',
        survey_id: 'srv-001',
        type: 'text',
        text: 'Quais aspectos dos nossos serviços ou atendimento poderiam ser aprimorados?',
        description: 'Sugestões de melhoria são muito bem-vindas para o nosso desenvolvimento contínuo.',
        required: false,
        order_index: 2,
      },
    ],
  },
  {
    id: 'srv-002',
    title: 'Avaliação de Suporte Técnico e Atendimento ao Aluno',
    description: 'Pesquisa específica sobre agilidade e eficácia nos chamados de suporte técnico.',
    is_active: true,
    created_at: '2026-03-10T14:30:00.000Z',
    updated_at: '2026-03-10T14:30:00.000Z',
    questions: [
      {
        id: 'q-nps-2',
        survey_id: 'srv-002',
        type: 'nps',
        text: 'Em uma escala de 0 a 10, como você avalia a resolução do seu último atendimento?',
        description: 'Considerando presteza, clareza e solução do problema.',
        required: true,
        order_index: 0,
      },
      {
        id: 'q-text-3',
        survey_id: 'srv-002',
        type: 'text',
        text: 'Descreva brevemente como foi sua experiência com nosso time.',
        required: false,
        order_index: 1,
      },
    ],
  },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: 'c-001', code: 'CLI-101', name: 'Ana Clara Vasconcelos', email: 'ana.vasconcelos@academico.br', phone: '(11) 98765-4321', created_at: '2026-03-02T09:00:00.000Z' },
  { id: 'c-002', code: 'CLI-102', name: 'Bruno Henrique Silveira', email: 'bruno.silveira@techcorp.com.br', phone: '(21) 97654-3210', created_at: '2026-03-02T09:15:00.000Z' },
  { id: 'c-003', code: 'CLI-103', name: 'Camila Duarte Ribeiro', email: 'camila.duarte@inovacao.edu.br', phone: '(31) 99876-1122', created_at: '2026-03-02T09:30:00.000Z' },
  { id: 'c-004', code: 'CLI-104', name: 'Diego Alcantara Martins', email: 'diego.martins@empresa.com.br', phone: '(41) 98123-4567', created_at: '2026-03-02T09:45:00.000Z' },
  { id: 'c-005', code: 'CLI-105', name: 'Elena Souza Ferreira', email: 'elena.souza@startup.io', phone: '(51) 98456-7890', created_at: '2026-03-03T11:00:00.000Z' },
  { id: 'c-006', code: 'CLI-106', name: 'Felipe Mendes Nogueira', email: 'felipe.mendes@consultoria.com.br', phone: '(61) 99345-6789', created_at: '2026-03-03T11:15:00.000Z' },
  { id: 'c-007', code: 'CLI-107', name: 'Gabriela Rocha Lima', email: 'gabriela.rocha@universidade.edu.br', phone: '(71) 98877-6655', created_at: '2026-03-04T14:00:00.000Z' },
  { id: 'c-008', code: 'CLI-108', name: 'Henrique Costa Carvalho', email: 'henrique.costa@digital.com.br', phone: '(81) 99122-3344', created_at: '2026-03-04T14:30:00.000Z' },
];

const DEFAULT_TOKENS: SurveyToken[] = [
  { id: 'tok-001', customer_id: 'c-001', survey_id: 'srv-001', token: 'nps-ana-9831', status: 'completed', created_at: '2026-03-05T08:00:00.000Z', completed_at: '2026-03-05T10:14:22.000Z' },
  { id: 'tok-002', customer_id: 'c-002', survey_id: 'srv-001', token: 'nps-bruno-4412', status: 'completed', created_at: '2026-03-05T08:00:00.000Z', completed_at: '2026-03-06T11:20:10.000Z' },
  { id: 'tok-003', customer_id: 'c-003', survey_id: 'srv-001', token: 'nps-camila-7789', status: 'completed', created_at: '2026-03-05T08:00:00.000Z', completed_at: '2026-03-08T15:45:00.000Z' },
  { id: 'tok-004', customer_id: 'c-004', survey_id: 'srv-001', token: 'nps-diego-1234', status: 'completed', created_at: '2026-03-05T08:00:00.000Z', completed_at: '2026-03-10T09:30:15.000Z' },
  { id: 'tok-005', customer_id: 'c-005', survey_id: 'srv-001', token: 'nps-elena-5561', status: 'completed', created_at: '2026-03-05T08:00:00.000Z', completed_at: '2026-03-12T16:05:40.000Z' },
  { id: 'tok-006', customer_id: 'c-006', survey_id: 'srv-001', token: 'nps-felipe-9090', status: 'completed', created_at: '2026-03-05T08:00:00.000Z', completed_at: '2026-03-15T14:10:00.000Z' },
  { id: 'tok-007', customer_id: 'c-007', survey_id: 'srv-001', token: 'nps-gabriela-3341', status: 'pending', created_at: '2026-03-05T08:00:00.000Z' },
  { id: 'tok-008', customer_id: 'c-008', survey_id: 'srv-001', token: 'nps-henrique-8812', status: 'pending', created_at: '2026-03-05T08:00:00.000Z' },
];

const DEFAULT_RESPONSES: SurveyResponse[] = [
  {
    id: 'resp-001',
    survey_id: 'srv-001',
    survey_title: 'Pesquisa Geral de Satisfação e Recomendação - 2026.1',
    customer_id: 'c-001',
    customer_name: 'Ana Clara Vasconcelos',
    customer_email: 'ana.vasconcelos@academico.br',
    customer_code: 'CLI-101',
    customer_phone: '(11) 98765-4321',
    token: 'nps-ana-9831',
    nps_score: 10,
    classification: 'promoter',
    created_at: '2026-03-05T10:14:22.000Z',
    answers: [
      {
        question_id: 'q-nps-1',
        question_text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        question_type: 'nps',
        value: 10,
      },
      {
        question_id: 'q-text-1',
        question_text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        question_type: 'text',
        value: 'A experiência acadêmica e o suporte dos professores foram impecáveis. Materiais sempre atualizados e atendimento veloz.',
      },
      {
        question_id: 'q-text-2',
        question_text: 'Quais aspectos dos nossos serviços ou atendimento poderiam ser aprimorados?',
        question_type: 'text',
        value: 'Poderiam disponibilizar mais estudos de caso práticos em vídeo.',
      },
    ],
  },
  {
    id: 'resp-002',
    survey_id: 'srv-001',
    survey_title: 'Pesquisa Geral de Satisfação e Recomendação - 2026.1',
    customer_id: 'c-002',
    customer_name: 'Bruno Henrique Silveira',
    customer_email: 'bruno.silveira@techcorp.com.br',
    customer_code: 'CLI-102',
    customer_phone: '(21) 97654-3210',
    token: 'nps-bruno-4412',
    nps_score: 9,
    classification: 'promoter',
    created_at: '2026-03-06T11:20:10.000Z',
    answers: [
      {
        question_id: 'q-nps-1',
        question_text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        question_type: 'nps',
        value: 9,
      },
      {
        question_id: 'q-text-1',
        question_text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        question_type: 'text',
        value: 'Interface muito limpa, moderna e transparente. Sempre que precisei de ajuda fui atendido com presteza.',
      },
      {
        question_id: 'q-text-2',
        question_text: 'Quais aspectos dos nossos serviços ou atendimento poderiam ser aprimorados?',
        question_type: 'text',
        value: 'Ajustes finos no módulo de relatórios analíticos.',
      },
    ],
  },
  {
    id: 'resp-003',
    survey_id: 'srv-001',
    survey_title: 'Pesquisa Geral de Satisfação e Recomendação - 2026.1',
    customer_id: 'c-003',
    customer_name: 'Camila Duarte Ribeiro',
    customer_email: 'camila.duarte@inovacao.edu.br',
    customer_code: 'CLI-103',
    customer_phone: '(31) 99876-1122',
    token: 'nps-camila-7789',
    nps_score: 8,
    classification: 'passive',
    created_at: '2026-03-08T15:45:00.000Z',
    answers: [
      {
        question_id: 'q-nps-1',
        question_text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        question_type: 'nps',
        value: 8,
      },
      {
        question_id: 'q-text-1',
        question_text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        question_type: 'text',
        value: 'O serviço entrega o que promete e tem bom custo-benefício. Não dei 10 porque a navegação mobile pode melhorar.',
      },
      {
        question_id: 'q-text-2',
        question_text: 'Quais aspectos dos nossos serviços ou atendimento poderiam ser aprimorados?',
        question_type: 'text',
        value: 'Melhorar a responsividade em celulares com telas menores.',
      },
    ],
  },
  {
    id: 'resp-004',
    survey_id: 'srv-001',
    survey_title: 'Pesquisa Geral de Satisfação e Recomendação - 2026.1',
    customer_id: 'c-004',
    customer_name: 'Diego Alcantara Martins',
    customer_email: 'diego.martins@empresa.com.br',
    customer_code: 'CLI-104',
    customer_phone: '(41) 98123-4567',
    token: 'nps-diego-1234',
    nps_score: 7,
    classification: 'passive',
    created_at: '2026-03-10T09:30:15.000Z',
    answers: [
      {
        question_id: 'q-nps-1',
        question_text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        question_type: 'nps',
        value: 7,
      },
      {
        question_id: 'q-text-1',
        question_text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        question_type: 'text',
        value: 'Atende às necessidades essenciais, mas senti falta de integrações automáticas e maior documentação.',
      },
    ],
  },
  {
    id: 'resp-005',
    survey_id: 'srv-001',
    survey_title: 'Pesquisa Geral de Satisfação e Recomendação - 2026.1',
    customer_id: 'c-005',
    customer_name: 'Elena Souza Ferreira',
    customer_email: 'elena.souza@startup.io',
    customer_code: 'CLI-105',
    customer_phone: '(51) 98456-7890',
    token: 'nps-elena-5561',
    nps_score: 4,
    classification: 'detractor',
    created_at: '2026-03-12T16:05:40.000Z',
    answers: [
      {
        question_id: 'q-nps-1',
        question_text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        question_type: 'nps',
        value: 4,
      },
      {
        question_id: 'q-text-1',
        question_text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        question_type: 'text',
        value: 'Tive um problema operacional urgente e o retorno do suporte demorou mais de dois dias úteis. Isso impactou meus prazos.',
      },
      {
        question_id: 'q-text-2',
        question_text: 'Quais aspectos dos nossos serviços ou atendimento poderiam ser aprimorados?',
        question_type: 'text',
        value: 'Canal de suporte síncrono ou SLA mais rigoroso para questões críticas.',
      },
    ],
  },
  {
    id: 'resp-006',
    survey_id: 'srv-001',
    survey_title: 'Pesquisa Geral de Satisfação e Recomendação - 2026.1',
    customer_id: 'c-006',
    customer_name: 'Felipe Mendes Nogueira',
    customer_email: 'felipe.mendes@consultoria.com.br',
    customer_code: 'CLI-106',
    customer_phone: '(61) 99345-6789',
    token: 'nps-felipe-9090',
    nps_score: 10,
    classification: 'promoter',
    created_at: '2026-03-15T14:10:00.000Z',
    answers: [
      {
        question_id: 'q-nps-1',
        question_text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        question_type: 'nps',
        value: 10,
      },
      {
        question_id: 'q-text-1',
        question_text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        question_type: 'text',
        value: 'Projeto acadêmico de altíssima qualidade! Fácil de utilizar, métricas calculadas em tempo real e visual impecável.',
      },
    ],
  },
];

let supabaseInstance: SupabaseClient | null = null;

export const dataService = {
  // Initialize storage with defaults if empty
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SURVEYS)) {
      localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(DEFAULT_SURVEYS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(DEFAULT_TOKENS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESPONSES)) {
      localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(DEFAULT_RESPONSES));
    }

    // Self-healing check: Ensure every customer has a token for each active survey
    try {
      const rawSurveys = localStorage.getItem(STORAGE_KEYS.SURVEYS);
      const rawCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const rawTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);

      if (rawSurveys && rawCustomers && rawTokens) {
        const surveys: Survey[] = JSON.parse(rawSurveys);
        const customers: Customer[] = JSON.parse(rawCustomers);
        const tokens: SurveyToken[] = JSON.parse(rawTokens);
        let tokensUpdated = false;

        surveys.filter((s) => s.is_active).forEach((s) => {
          customers.forEach((c) => {
            const hasTok = tokens.some((t) => t.customer_id === c.id && t.survey_id === s.id);
            if (!hasTok) {
              const randomSuffix = Math.random().toString(36).substring(2, 6);
              tokens.push({
                id: `tok-${Date.now().toString(36)}-${randomSuffix}`,
                customer_id: c.id,
                survey_id: s.id,
                token: `nps-${c.code.toLowerCase().replace(/[^a-z0-9]/g, '')}-${randomSuffix}`,
                status: 'pending',
                created_at: new Date().toISOString(),
              });
              tokensUpdated = true;
            }
          });
        });

        if (tokensUpdated) {
          localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
        }
      }
    } catch (e) {
      console.warn('Erro na auto-geração de tokens:', e);
    }

    this.initSupabaseClient();
  },

  // Supabase Configuration
  getSupabaseConfig(): SupabaseConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      isConnected: false,
    };
  },

  saveSupabaseConfig(config: Partial<SupabaseConfig>): SupabaseConfig {
    const current = this.getSupabaseConfig();
    const updated: SupabaseConfig = { ...current, ...config };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    this.initSupabaseClient();
    return updated;
  },

  initSupabaseClient(): SupabaseClient | null {
    const config = this.getSupabaseConfig();
    if (config.url && config.anonKey) {
      try {
        supabaseInstance = createClient(config.url, config.anonKey);
        return supabaseInstance;
      } catch (err) {
        console.warn('Erro ao inicializar cliente Supabase:', err);
        supabaseInstance = null;
      }
    }
    supabaseInstance = null;
    return null;
  },

  async testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
    const config = this.getSupabaseConfig();
    if (!config.url || !config.anonKey) {
      return { success: false, message: 'URL e Chave Anônima do Supabase são obrigatórias.' };
    }

    try {
      const client = createClient(config.url, config.anonKey);
      // Try a lightweight query
      const { error } = await client.from('surveys').select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist yet, it's still reachable
        if (error.message.includes('relation "surveys" does not exist') || error.message.includes('does not exist')) {
          this.saveSupabaseConfig({ isConnected: true, lastChecked: new Date().toISOString() });
          return {
            success: true,
            message: 'Conectado ao Supabase! As tabelas ainda não foram criadas. Copie e execute o script SQL abaixo.',
          };
        }
        return { success: false, message: `Erro no Supabase: ${error.message}` };
      }

      this.saveSupabaseConfig({ isConnected: true, lastChecked: new Date().toISOString() });
      return { success: true, message: 'Conexão com Supabase efetuada com sucesso!' };
    } catch (err: any) {
      return { success: false, message: `Falha na requisição: ${err?.message || err}` };
    }
  },

  getSqlMigrationScript(): string {
    return `-- ==============================================================================
-- SISTEMA NPS ACADÊMICO - SCRIPT SQL COMPLETO COM POLÍTICAS DE ARMAZENAMENTO (SUPABASE)
-- Tabelas, Relacionamentos, Índices, RLS e Storage Buckets / Políticas
-- ==============================================================================

-- 1. TABELA DE PESQUISAS (surveys)
CREATE TABLE IF NOT EXISTS public.surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PERGUNTAS (questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('nps', 'text')),
  text TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0
);

-- 3. TABELA DE CLIENTES (customers)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE TOKENS E LINKS INDIVIDUAIS (survey_tokens)
CREATE TABLE IF NOT EXISTS public.survey_tokens (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  survey_id TEXT NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. TABELA DE RESPOSTAS NPS (survey_responses)
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  survey_title TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_code TEXT NOT NULL,
  customer_phone TEXT,
  token TEXT NOT NULL,
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  classification TEXT NOT NULL CHECK (classification IN ('promoter', 'passive', 'detractor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answers JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON public.questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_tokens_token ON public.survey_tokens(token);
CREATE INDEX IF NOT EXISTS idx_survey_tokens_customer_id ON public.survey_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_classification ON public.survey_responses(classification);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.survey_responses(created_at DESC);

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA EM NÍVEL DE LINHA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Surveys
DROP POLICY IF EXISTS "surveys_select_policy" ON public.surveys;
DROP POLICY IF EXISTS "surveys_all_policy" ON public.surveys;
CREATE POLICY "surveys_select_policy" ON public.surveys FOR SELECT USING (true);
CREATE POLICY "surveys_all_policy" ON public.surveys FOR ALL USING (true);

-- Questions
DROP POLICY IF EXISTS "questions_select_policy" ON public.questions;
DROP POLICY IF EXISTS "questions_all_policy" ON public.questions;
CREATE POLICY "questions_select_policy" ON public.questions FOR SELECT USING (true);
CREATE POLICY "questions_all_policy" ON public.questions FOR ALL USING (true);

-- Customers
DROP POLICY IF EXISTS "customers_all_policy" ON public.customers;
CREATE POLICY "customers_all_policy" ON public.customers FOR ALL USING (true);

-- Survey Tokens
DROP POLICY IF EXISTS "survey_tokens_select_policy" ON public.survey_tokens;
DROP POLICY IF EXISTS "survey_tokens_all_policy" ON public.survey_tokens;
CREATE POLICY "survey_tokens_select_policy" ON public.survey_tokens FOR SELECT USING (true);
CREATE POLICY "survey_tokens_all_policy" ON public.survey_tokens FOR ALL USING (true);

-- Survey Responses
DROP POLICY IF EXISTS "survey_responses_select_policy" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_insert_policy" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_all_policy" ON public.survey_responses;
CREATE POLICY "survey_responses_select_policy" ON public.survey_responses FOR SELECT USING (true);
CREATE POLICY "survey_responses_insert_policy" ON public.survey_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "survey_responses_all_policy" ON public.survey_responses FOR ALL USING (true);

-- ==============================================================================
-- 6. POLÍTICAS DE ARMAZENAMENTO (SUPABASE STORAGE BUCKETS & STORAGE.OBJECTS RLS)
-- Utilizados para:
--  a) 'nps-exports': Relatórios e exportações (CSV, XLS, PDF)
--  b) 'nps-attachments': Importação de bases de clientes e anexos
-- ==============================================================================

-- Criação dos Buckets de Armazenamento no schema storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('nps-exports', 'nps-exports', true, 52428800, ARRAY['text/csv', 'application/vnd.ms-excel', 'application/pdf', 'application/json']),
  ('nps-attachments', 'nps-attachments', false, 20971520, ARRAY['text/csv', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Armazenamento para storage.objects

-- 6.1 Permitir leitura pública dos relatórios e exportações do bucket 'nps-exports'
DROP POLICY IF EXISTS "Storage Leitura Pública nps-exports" ON storage.objects;
CREATE POLICY "Storage Leitura Pública nps-exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'nps-exports');

-- 6.2 Permitir upload/criação de exportações no bucket 'nps-exports'
DROP POLICY IF EXISTS "Storage Upload nps-exports" ON storage.objects;
CREATE POLICY "Storage Upload nps-exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nps-exports');

-- 6.3 Permitir atualização de arquivos no bucket 'nps-exports'
DROP POLICY IF EXISTS "Storage Update nps-exports" ON storage.objects;
CREATE POLICY "Storage Update nps-exports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nps-exports');

-- 6.4 Permitir exclusão de arquivos no bucket 'nps-exports'
DROP POLICY IF EXISTS "Storage Delete nps-exports" ON storage.objects;
CREATE POLICY "Storage Delete nps-exports"
ON storage.objects FOR DELETE
USING (bucket_id = 'nps-exports');

-- 6.5 Políticas para o bucket privado 'nps-attachments' (CSVs e arquivos administrativos)
DROP POLICY IF EXISTS "Storage Select nps-attachments" ON storage.objects;
CREATE POLICY "Storage Select nps-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'nps-attachments');

DROP POLICY IF EXISTS "Storage Insert nps-attachments" ON storage.objects;
CREATE POLICY "Storage Insert nps-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nps-attachments');

DROP POLICY IF EXISTS "Storage Delete nps-attachments" ON storage.objects;
CREATE POLICY "Storage Delete nps-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'nps-attachments');
`;
  },

  // SURVEYS
  async getSurveys(): Promise<Survey[]> {
    this.init();
    if (supabaseInstance) {
      try {
        const { data, error } = await supabaseInstance
          .from('surveys')
          .select('*, questions (*)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Fallback para local storage:', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SURVEYS);
    return raw ? JSON.parse(raw) : DEFAULT_SURVEYS;
  },

  async saveSurvey(survey: Partial<Survey> & { title: string; questions: SurveyQuestion[] }): Promise<Survey> {
    const surveys = await this.getSurveys();
    const now = new Date().toISOString();
    let updatedSurvey: Survey;

    if (survey.id) {
      // Edit existing
      updatedSurvey = {
        ...surveys.find((s) => s.id === survey.id)!,
        ...survey,
        updated_at: now,
      };
      const idx = surveys.findIndex((s) => s.id === survey.id);
      if (idx >= 0) surveys[idx] = updatedSurvey;
      else surveys.unshift(updatedSurvey);
    } else {
      // Create new
      const newId = `srv-${Date.now().toString(36)}`;
      updatedSurvey = {
        id: newId,
        title: survey.title,
        description: survey.description || '',
        is_active: survey.is_active ?? true,
        created_at: now,
        updated_at: now,
        questions: survey.questions.map((q, idx) => ({
          ...q,
          id: q.id || `q-${newId}-${idx}`,
          survey_id: newId,
          order_index: idx,
        })),
      };
      surveys.unshift(updatedSurvey);
    }

    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));

    // Try Supabase sync
    if (supabaseInstance) {
      try {
        await supabaseInstance.from('surveys').upsert({
          id: updatedSurvey.id,
          title: updatedSurvey.title,
          description: updatedSurvey.description,
          is_active: updatedSurvey.is_active,
          updated_at: updatedSurvey.updated_at,
        });
      } catch (e) {
        console.warn('Erro ao salvar no Supabase:', e);
      }
    }

    return updatedSurvey;
  },

  async toggleSurveyStatus(id: string): Promise<boolean> {
    const surveys = await this.getSurveys();
    const target = surveys.find((s) => s.id === id);
    if (!target) return false;
    target.is_active = !target.is_active;
    target.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
    
    if (supabaseInstance) {
      try {
        await supabaseInstance.from('surveys').update({ is_active: target.is_active }).eq('id', id);
      } catch (e) {
        console.warn(e);
      }
    }
    return target.is_active;
  },

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    this.init();
    if (supabaseInstance) {
      try {
        const { data, error } = await supabaseInstance
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Fallback localStorage para customers:', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : DEFAULT_CUSTOMERS;
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const customers = await this.getCustomers();
    const id = `c-${Date.now().toString(36)}`;
    const newCustomer: Customer = {
      ...customer,
      id,
      created_at: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    // Auto-generate tokens for active surveys
    const surveys = await this.getSurveys();
    const activeSurveys = surveys.filter((s) => s.is_active);
    for (const survey of activeSurveys) {
      await this.generateTokenForCustomer(newCustomer.id, survey.id);
    }

    if (supabaseInstance) {
      try {
        await supabaseInstance.from('customers').insert([newCustomer]);
      } catch (e) {
        console.warn('Erro ao inserir cliente no Supabase:', e);
      }
    }

    return newCustomer;
  },

  async importCustomersFromCSV(csvText: string): Promise<{ added: number; errors: string[] }> {
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { added: 0, errors: ['Arquivo CSV vazio.'] };

    const errors: string[] = [];
    let addedCount = 0;
    const existing = await this.getCustomers();
    const existingCodes = new Set(existing.map((c) => c.code.toLowerCase()));
    const existingEmails = new Set(existing.map((c) => c.email.toLowerCase()));

    // Detect separator: comma or semicolon
    const headerLine = lines[0];
    const sep = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(sep).map((h) => h.trim().toLowerCase());

    const nameIdx = headers.findIndex((h) => h.includes('nome') || h.includes('name'));
    const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('e-mail'));
    const phoneIdx = headers.findIndex((h) => h.includes('fone') || h.includes('phone') || h.includes('telefone') || h.includes('celular'));
    const codeIdx = headers.findIndex((h) => h.includes('cod') || h.includes('código') || h.includes('codigo') || h.includes('code') || h.includes('id'));

    if (nameIdx === -1 || emailIdx === -1) {
      return {
        added: 0,
        errors: ['O arquivo CSV precisa conter pelo menos as colunas de "Nome" e "E-mail".'],
      };
    }

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(sep).map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
      if (row.length <= 1 && !row[0]) continue;

      const name = row[nameIdx];
      const email = row[emailIdx];
      const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : '';
      let code = codeIdx !== -1 && row[codeIdx] ? row[codeIdx] : `CLI-${Math.floor(100 + Math.random() * 900)}`;

      if (!name || !email) {
        errors.push(`Linha ${i + 1}: Nome e E-mail são obrigatórios.`);
        continue;
      }

      if (existingCodes.has(code.toLowerCase())) {
        code = `CLI-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 100)}`;
      }

      try {
        await this.addCustomer({ name, email, phone, code });
        existingCodes.add(code.toLowerCase());
        existingEmails.add(email.toLowerCase());
        addedCount++;
      } catch (err: any) {
        errors.push(`Linha ${i + 1} (${name}): ${err?.message || 'Erro ao processar'}`);
      }
    }

    return { added: addedCount, errors };
  },

  // TOKENS & LINKS
  async getTokens(surveyId?: string): Promise<SurveyToken[]> {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.TOKENS);
    const tokens: SurveyToken[] = raw ? JSON.parse(raw) : DEFAULT_TOKENS;
    if (surveyId) {
      return tokens.filter((t) => t.survey_id === surveyId);
    }
    return tokens;
  },

  async generateTokenForCustomer(customerId: string, surveyId: string): Promise<SurveyToken> {
    const tokens = await this.getTokens();
    const existing = tokens.find((t) => t.customer_id === customerId && t.survey_id === surveyId);
    if (existing) return existing;

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const tokenStr = `nps-${Date.now().toString(36)}-${randomSuffix}`;
    const newToken: SurveyToken = {
      id: `tok-${Date.now().toString(36)}-${randomSuffix}`,
      customer_id: customerId,
      survey_id: surveyId,
      token: tokenStr,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    tokens.push(newToken);
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    if (supabaseInstance) {
      try {
        await supabaseInstance.from('survey_tokens').insert([newToken]);
      } catch (e) {
        console.warn(e);
      }
    }

    return newToken;
  },

  async getSurveyAndCustomerByToken(tokenStr: string): Promise<{
    token: SurveyToken;
    customer: Customer;
    survey: Survey;
  } | null> {
    this.init();
    const cleanToken = (tokenStr || '').trim();
    const tokens = await this.getTokens();
    let token = tokens.find((t) => t.token.toLowerCase() === cleanToken.toLowerCase());

    const customers = await this.getCustomers();
    const surveys = await this.getSurveys();
    const defaultSurvey = surveys.find((s) => s.is_active) || surveys[0];

    // If token wasn't found directly, check if token was formatted like nps-{customerCode} or matches customer code/id
    if (!token && customers.length > 0 && defaultSurvey) {
      const matchedCustomer = customers.find(
        (c) =>
          `nps-${c.code.toLowerCase()}` === cleanToken.toLowerCase() ||
          c.code.toLowerCase() === cleanToken.toLowerCase() ||
          cleanToken.toLowerCase().includes(c.code.toLowerCase())
      );

      if (matchedCustomer) {
        // Auto-generate or get token for this customer
        token = await this.generateTokenForCustomer(matchedCustomer.id, defaultSurvey.id);
      }
    }

    if (!token) return null;

    const customer = customers.find((c) => c.id === token.customer_id);
    if (!customer) return null;

    const survey = surveys.find((s) => s.id === token.survey_id) || defaultSurvey;
    if (!survey) return null;

    return { token, customer, survey };
  },

  // RESPONSES
  async getResponses(surveyId?: string): Promise<SurveyResponse[]> {
    this.init();
    if (supabaseInstance) {
      try {
        let query = supabaseInstance.from('survey_responses').select('*').order('created_at', { ascending: false });
        if (surveyId) query = query.eq('survey_id', surveyId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Fallback responses:', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    const responses: SurveyResponse[] = raw ? JSON.parse(raw) : DEFAULT_RESPONSES;
    if (surveyId) {
      return responses.filter((r) => r.survey_id === surveyId);
    }
    return responses;
  },

  async submitResponse(tokenStr: string, npsScore: number, answers: ResponseAnswer[]): Promise<SurveyResponse> {
    const info = await this.getSurveyAndCustomerByToken(tokenStr);
    if (!info) {
      throw new Error('Token de pesquisa inválido ou não encontrado.');
    }

    const { token, customer, survey } = info;
    const classification = getClassification(npsScore);
    const now = new Date().toISOString();

    const responseRecord: SurveyResponse = {
      id: `resp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      survey_id: survey.id,
      survey_title: survey.title,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_code: customer.code,
      customer_phone: customer.phone,
      token: tokenStr,
      nps_score: npsScore,
      classification,
      created_at: now,
      answers,
    };

    // Update responses list
    const responses = await this.getResponses();
    responses.unshift(responseRecord);
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));

    // Update token status to completed
    const tokens = await this.getTokens();
    const tokenItem = tokens.find((t) => t.token === tokenStr);
    if (tokenItem) {
      tokenItem.status = 'completed';
      tokenItem.completed_at = now;
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    }

    // Try sync to Supabase
    if (supabaseInstance) {
      try {
        await supabaseInstance.from('survey_responses').insert([responseRecord]);
        await supabaseInstance.from('survey_tokens').update({ status: 'completed', completed_at: now }).eq('token', tokenStr);
      } catch (err) {
        console.warn('Erro ao sincronizar resposta no Supabase:', err);
      }
    }

    return responseRecord;
  },

  async deleteResponse(id: string): Promise<boolean> {
    const responses = await this.getResponses();
    const filtered = responses.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(filtered));

    if (supabaseInstance) {
      try {
        await supabaseInstance.from('survey_responses').delete().eq('id', id);
      } catch (e) {
        console.warn(e);
      }
    }
    return true;
  },

  resetToSampleData() {
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(DEFAULT_SURVEYS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(DEFAULT_TOKENS));
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(DEFAULT_RESPONSES));
  },
};
