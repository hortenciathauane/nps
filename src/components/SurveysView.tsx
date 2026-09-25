import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Power, 
  Trash2, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  GripVertical,
  HelpCircle,
  Eye
} from 'lucide-react';
import { Survey, SurveyQuestion, QuestionType } from '../types/nps';

interface SurveysViewProps {
  surveys: Survey[];
  onSaveSurvey: (survey: Partial<Survey> & { title: string; questions: SurveyQuestion[] }) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onViewResults: (surveyId: string) => void;
  onOpenPublicSurvey: (surveyId: string) => void;
}

export const SurveysView: React.FC<SurveysViewProps> = ({
  surveys,
  onSaveSurvey,
  onToggleStatus,
  onViewResults,
  onOpenPublicSurvey,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Array<Omit<SurveyQuestion, 'survey_id'>>>([
    {
      id: 'temp-nps',
      type: 'nps',
      text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
      description: '0 significa "nada provável" e 10 significa "extremamente provável".',
      required: true,
      order_index: 0,
    },
    {
      id: 'temp-q1',
      type: 'text',
      text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
      description: 'Compartilhe os motivos da sua avaliação.',
      required: true,
      order_index: 1,
    },
  ]);

  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingSurvey(null);
    setTitle('');
    setDescription('');
    setIsActive(true);
    setQuestions([
      {
        id: 'q-nps-' + Date.now(),
        type: 'nps',
        text: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?',
        description: '0 significa "nada provável" e 10 significa "extremamente provável".',
        required: true,
        order_index: 0,
      },
      {
        id: 'q-text-reason-' + Date.now(),
        type: 'text',
        text: 'Qual é o principal motivo que justifica a nota atribuída acima?',
        description: 'Conte com suas palavras o que mais pesou na sua nota.',
        required: true,
        order_index: 1,
      },
    ]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setTitle(survey.title);
    setDescription(survey.description);
    setIsActive(survey.is_active);
    setQuestions(survey.questions.map((q) => ({ ...q })));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddQuestion = (type: QuestionType) => {
    const newQ: Omit<SurveyQuestion, 'survey_id'> = {
      id: `q-temp-${Date.now()}-${questions.length}`,
      type,
      text: type === 'nps' ? 'Em uma escala de 0 a 10, como você avalia...' : 'Pergunta personalizada de texto aberto...',
      description: '',
      required: type === 'nps',
      order_index: questions.length,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    // Keep at least one NPS question
    const target = questions[index];
    const npsCount = questions.filter((q) => q.type === 'nps').length;
    if (target.type === 'nps' && npsCount <= 1) {
      setFormError('A pesquisa deve conter pelo menos 1 pergunta métrica de NPS (0 a 10).');
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Informe o título da pesquisa.');
      return;
    }

    if (questions.length === 0) {
      setFormError('Adicione pelo menos uma pergunta à pesquisa.');
      return;
    }

    const hasNPS = questions.some((q) => q.type === 'nps');
    if (!hasNPS) {
      setFormError('A pesquisa deve conter obrigatoriamente a pergunta de pontuação NPS (0 a 10).');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveSurvey({
        id: editingSurvey?.id,
        title,
        description,
        is_active: isActive,
        questions: questions.map((q, idx) => ({
          ...q,
          id: q.id || `q-${idx}`,
          survey_id: editingSurvey?.id || '',
          order_index: idx,
        })) as SurveyQuestion[],
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar pesquisa.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Gerenciador de Pesquisas
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Crie, personalize formulários com perguntas abertas/NPS e gerencie o ciclo de vida
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Pesquisa NPS</span>
        </button>
      </div>

      {/* Surveys List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {surveys.map((survey) => {
          const npsQuestions = survey.questions.filter((q) => q.type === 'nps');
          const textQuestions = survey.questions.filter((q) => q.type === 'text');

          return (
            <div
              key={survey.id}
              className={`bg-white dark:bg-neutral-900 border rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                survey.is_active
                  ? 'border-neutral-200 dark:border-neutral-800'
                  : 'border-neutral-200/60 dark:border-neutral-800/40 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {survey.title}
                  </h3>
                  <button
                    onClick={() => onToggleStatus(survey.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      survey.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-300 dark:border-neutral-700'
                    }`}
                    title={survey.is_active ? 'Clique para desativar' : 'Clique para ativar'}
                  >
                    <Power className="w-3 h-3" />
                    <span>{survey.is_active ? 'Ativa' : 'Inativa'}</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                  {survey.description || 'Sem descrição cadastrada.'}
                </p>

                {/* Questions Summary */}
                <div className="space-y-1.5 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Estrutura do Formulário ({survey.questions.length} perguntas)
                  </div>
                  {survey.questions.map((q, idx) => (
                    <div key={q.id || idx} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 truncate">
                      <span className="font-mono text-[10px] text-neutral-400">#{idx + 1}</span>
                      <span className="text-[11px] px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 rounded font-medium text-neutral-600 dark:text-neutral-400 shrink-0">
                        {q.type === 'nps' ? 'NPS 0-10' : 'Texto'}
                      </span>
                      <span className="truncate">{q.text}</span>
                      {q.required && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono shrink-0">
                          *obrigatória
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="text-[11px] text-neutral-400 font-mono">
                  Criada em: {new Date(survey.created_at).toLocaleDateString('pt-BR')}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewResults(survey.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Resultados</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(survey)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Survey */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {editingSurvey ? 'Editar Pesquisa' : 'Criar Nova Pesquisa NPS'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Configure o título, introdução e as perguntas do questionário
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-lg cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Título da Pesquisa *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Pesquisa de Satisfação de Clientes 2026"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Instrução / Mensagem de Abertura
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Ex: Sua opinião é fundamental para melhorarmos continuamente nossos produtos..."
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    Pesquisa ativa e disponível para envio de respostas
                  </label>
                </div>
              </div>

              {/* Questions Builder */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Perguntas do Formulário
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Adicione perguntas NPS de 0 a 10 e perguntas abertas de texto
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('text')}
                      className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Pergunta de Texto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('nps')}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Pergunta NPS</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-3.5 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-400">
                            #{idx + 1}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              q.type === 'nps'
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {q.type === 'nps' ? 'Escala NPS 0 a 10' : 'Resposta de Texto Aberto'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => handleQuestionChange(idx, 'required', e.target.checked)}
                              className="rounded text-indigo-600 w-3.5 h-3.5"
                            />
                            <span>Obrigatória</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            title="Remover pergunta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                          placeholder="Texto da pergunta..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.description || ''}
                          onChange={(e) => handleQuestionChange(idx, 'description', e.target.value)}
                          placeholder="Dica ou instrução complementar para o cliente (opcional)..."
                          className="w-full px-3 py-1 bg-white/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 rounded-md text-[11px] text-neutral-600 dark:text-neutral-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingSurvey ? 'Atualizar Pesquisa' : 'Criar Pesquisa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
