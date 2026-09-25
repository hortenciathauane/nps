import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  CheckCircle2, 
  ArrowLeft, 
  Send, 
  AlertCircle,
  Award,
  Sparkles
} from 'lucide-react';
import { Customer, Survey, SurveyToken, ResponseAnswer } from '../types/nps';
import { dataService } from '../services/dataService';
import { getClassification, getClassificationLabel } from '../services/npsCalculator';

interface PublicSurveyViewProps {
  tokenString: string;
  onResponseSubmitted: () => void;
  onBackToAdmin: () => void;
}

export const PublicSurveyView: React.FC<PublicSurveyViewProps> = ({
  tokenString,
  onResponseSubmitted,
  onBackToAdmin,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<{
    token: SurveyToken;
    customer: Customer;
    survey: Survey;
  } | null>(null);

  // Form state
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasPreviousSubmission, setHasPreviousSubmission] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [tokenString]);

  const loadSurvey = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.getSurveyAndCustomerByToken(tokenString);
      if (!data) {
        setError('Link de pesquisa não encontrado ou expirado.');
      } else {
        setSurveyData(data);
        // If it was completed, allow the simulator user to reset or view, but default to interactive form unless just submitted in this session
        if (data.token.status === 'completed') {
          setHasPreviousSubmission(true);
        }
      }
    } catch (err: any) {
      setError('Erro ao carregar formulário de pesquisa.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (selectedScore === null) {
      setValidationError('Por favor, selecione uma nota de 0 a 10 para a pergunta NPS.');
      return;
    }

    if (!surveyData) return;

    // Check required questions
    for (const q of surveyData.survey.questions) {
      if (q.type === 'text' && q.required) {
        const val = answers[q.id]?.trim();
        if (!val) {
          setValidationError(`Por favor, responda à pergunta obrigatória: "${q.text}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      // Build response answers array
      const responseAnswers: ResponseAnswer[] = surveyData.survey.questions.map((q) => {
        if (q.type === 'nps') {
          return {
            question_id: q.id,
            question_text: q.text,
            question_type: 'nps',
            value: selectedScore,
          };
        }
        return {
          question_id: q.id,
          question_text: q.text,
          question_type: 'text',
          value: answers[q.id] || '',
        };
      });

      await dataService.submitResponse(tokenString, selectedScore, responseAnswers);
      setIsCompleted(true);
      onResponseSubmitted();
    } catch (err: any) {
      setValidationError(err.message || 'Erro ao registrar sua resposta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-neutral-400 font-mono">Carregando pesquisa exclusiva...</span>
        </div>
      </div>
    );
  }

  if (error || !surveyData) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold">Token de Pesquisa: "{tokenString}"</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {error || 'Não encontramos uma pesquisa vinculada a este token.'}
          </p>
          <p className="text-xs text-neutral-500">
            Você pode selecionar um dos clientes ativos para responder e simular agora mesmo:
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={async () => {
                const customers = await dataService.getCustomers();
                const tokens = await dataService.getTokens();
                if (tokens.length > 0) {
                  window.location.hash = `#/pesquisa/${tokens[0].token}`;
                } else if (customers.length > 0) {
                  window.location.hash = `#/pesquisa/nps-${customers[0].code.toLowerCase()}`;
                }
              }}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Testar com o Primeiro Cliente Disponível
            </button>
            <button
              onClick={onBackToAdmin}
              className="w-full px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Voltar ao Painel Administrativo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { customer, survey, token } = surveyData;
  const npsQuestion = survey.questions.find((q) => q.type === 'nps');
  const textQuestions = survey.questions.filter((q) => q.type === 'text');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative">
      {/* Top Academic Testing Bar */}
      <header className="w-full max-w-2xl flex items-center justify-between pb-4 mb-6 border-b border-neutral-800">
        <button
          onClick={onBackToAdmin}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel Administrativo</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            Token: {token.token}
          </span>
        </div>
      </header>

      {/* Main Survey Container */}
      <div className="w-full max-w-2xl">
        {isCompleted ? (
          // Thank you screen
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 sm:p-10 text-center shadow-xl space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Muito Obrigado, {customer.name}!
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Sua avaliação sobre <strong>"{survey.title}"</strong> foi registrada com sucesso e já está computada no painel de indicadores.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl max-w-sm mx-auto text-xs text-left space-y-1.5 font-mono text-neutral-400">
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="text-white">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Código:</span>
                <span className="text-white">{customer.code}</span>
              </div>
              <div className="flex justify-between">
                <span>Data do Registro:</span>
                <span className="text-white">{new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onBackToAdmin}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Retornar ao Dashboard
              </button>

              <button
                onClick={() => {
                  setIsCompleted(false);
                  setSelectedScore(null);
                  setAnswers({});
                }}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                (Teste Acadêmico) Responder Novamente
              </button>
            </div>
          </div>
        ) : (
          // Form active
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Header of survey */}
            <div className="border-b border-neutral-800 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pesquisa de Satisfação & Lealdade</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {survey.title}
              </h1>
              {survey.description && (
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {survey.description}
                </p>
              )}

              {/* Customer Greeting */}
              <div className="mt-4 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-neutral-400">Respondente identificado:</span>{' '}
                  <strong className="text-white">{customer.name}</strong>{' '}
                  <span className="text-neutral-500 font-mono">({customer.code})</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasPreviousSubmission && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-900">
                      Simulação / Resposta Adicional
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">
                    Link Seguro
                  </span>
                </div>
              </div>
            </div>

            {validationError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Question 1: NPS Scale 0 to 10 */}
              {npsQuestion && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <label className="text-sm sm:text-base font-semibold text-white">
                        {npsQuestion.text}
                      </label>
                      <span className="text-xs text-red-400 font-mono">*obrigatória</span>
                    </div>
                    {npsQuestion.description && (
                      <p className="text-xs text-neutral-400">{npsQuestion.description}</p>
                    )}
                  </div>

                  {/* 0-10 Button Grid */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-11 gap-1 sm:gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = selectedScore === num;
                        let activeColor = 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-neutral-500';

                        if (isSelected) {
                          if (num >= 9) activeColor = 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30';
                          else if (num >= 7) activeColor = 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-900/30';
                          else activeColor = 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30';
                        }

                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSelectedScore(num)}
                            className={`h-11 sm:h-12 rounded-lg border font-mono font-bold text-sm sm:text-base transition-all duration-150 flex items-center justify-center cursor-pointer ${activeColor}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-1 px-1">
                      <span>0 - Nada provável</span>
                      <span>10 - Extremamente provável</span>
                    </div>
                  </div>

                  {/* Selected score preview feedback */}
                  {selectedScore !== null && (
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedScore >= 9 ? (
                          <Smile className="w-4 h-4 text-emerald-400" />
                        ) : selectedScore >= 7 ? (
                          <Meh className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Frown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-neutral-300">
                          Classificação correspondente:{' '}
                          <strong
                            className={
                              selectedScore >= 9
                                ? 'text-emerald-400'
                                : selectedScore >= 7
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }
                          >
                            {getClassificationLabel(getClassification(selectedScore))}
                          </strong>
                        </span>
                      </div>
                      <span className="font-mono text-neutral-400 font-semibold">
                        Nota selecionada: {selectedScore}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Text Questions */}
              {textQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-2 pt-4 border-t border-neutral-800">
                  <div className="flex items-baseline justify-between mb-1">
                    <label className="text-sm font-semibold text-white">
                      {q.text}
                    </label>
                    <span className="text-xs text-neutral-400">
                      {q.required ? (
                        <span className="text-red-400 font-mono">*obrigatória</span>
                      ) : (
                        'opcional'
                      )}
                    </span>
                  </div>
                  {q.description && (
                    <p className="text-xs text-neutral-400">{q.description}</p>
                  )}
                  <textarea
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                    placeholder="Digite sua resposta aqui com detalhes..."
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              ))}

              {/* Submit button */}
              <div className="pt-4 border-t border-neutral-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registrando Resposta...' : 'Enviar Minha Avaliação'}</span>
                </button>
                <p className="text-[11px] text-center text-neutral-500 mt-2">
                  Ao enviar, sua nota será imediatamente tabulada no cálculo do NPS institucional.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
