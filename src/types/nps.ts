export type NPSCategory = 'promoter' | 'passive' | 'detractor';

export type QuestionType = 'nps' | 'text';

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  order_index: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions: SurveyQuestion[];
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface SurveyToken {
  id: string;
  customer_id: string;
  survey_id: string;
  token: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface ResponseAnswer {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  value: string | number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  survey_title: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_code: string;
  customer_phone?: string;
  token: string;
  nps_score: number;
  classification: NPSCategory;
  created_at: string;
  answers: ResponseAnswer[];
}

export interface NPSDistributionItem {
  score: number;
  count: number;
  percentage: number;
  classification: NPSCategory;
}

export interface NPSMetrics {
  totalSent: number;
  totalResponses: number;
  responseRate: number;
  promotersCount: number;
  promotersPercent: number;
  passivesCount: number;
  passivesPercent: number;
  detractorsCount: number;
  detractorsPercent: number;
  npsScore: number;
  scoreDistribution: NPSDistributionItem[];
  zone: {
    name: string;
    description: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
}
