import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Eye, 
  Trash2, 
  FileSpreadsheet, 
  Smile, 
  Meh, 
  Frown, 
  ArrowUpDown,
  Clock,
  User,
  X
} from 'lucide-react';
import { SurveyResponse, Survey, NPSCategory } from '../types/nps';
import { getClassificationLabel } from '../services/npsCalculator';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';

interface ResponsesViewProps {
  responses: SurveyResponse[];
  surveys: Survey[];
  initialCategoryFilter?: string;
  initialSurveyFilter?: string;
  onDeleteResponse: (id: string) => Promise<void>;
}

export const ResponsesView: React.FC<ResponsesViewProps> = ({
  responses,
  surveys,
  initialCategoryFilter = 'all',
  initialSurveyFilter = 'all',
  onDeleteResponse,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<string>(initialSurveyFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryFilter);
  const [selectedScore, setSelectedScore] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Detail Modal state (Requirement 7: Resultado individual)
  const [activeResponse, setActiveResponse] = useState<SurveyResponse | null>(null);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter logic
  const filteredResponses = useMemo(() => {
    let result = [...responses];

    // Filter by Survey
    if (selectedSurvey !== 'all') {
      result = result.filter((r) => r.survey_id === selectedSurvey);
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.classification === selectedCategory);
    }

    // Filter by Score
    if (selectedScore !== 'all') {
      const scoreNum = parseInt(selectedScore, 10);
      result = result.filter((r) => r.nps_score === scoreNum);
    }

    // Filter by Period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      result = result.filter((r) => {
        const respDate = new Date(r.created_at);
        const diffDays = (now.getTime() - respDate.getTime()) / (1000 * 3600 * 24);

        if (selectedPeriod === '7d') return diffDays <= 7;
        if (selectedPeriod === '30d') return diffDays <= 30;
        if (selectedPeriod === 'month') {
          return (
            respDate.getMonth() === now.getMonth() &&
            respDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    // Filter by Search Term (customer name, email, code)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(term) ||
          r.customer_code.toLowerCase().includes(term) ||
          r.customer_email.toLowerCase().includes(term) ||
          r.survey_title.toLowerCase().includes(term)
      );
    }

    // Sort by date
    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [
    responses,
    selectedSurvey,
    selectedCategory,
    selectedScore,
    selectedPeriod,
    searchTerm,
    sortOrder,
  ]);

  const handleExportCSV = () => {
    const filename = `respostas_nps_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(filteredResponses, filename);
  };

  const handleExportExcel = () => {
    const filename = `respostas_nps_${new Date().toISOString().slice(0, 10)}.xls`;
    exportToExcel(filteredResponses, filename);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSurvey('all');
    setSelectedCategory('all');
    setSelectedScore('all');
    setSelectedPeriod('all');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Respostas & Avaliações
          </h2>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span>{filteredResponses.length} de {responses.length} respostas registradas</span>
            <span aria-hidden="true">·</span>
            <span>Exportação para auditoria acadêmica</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Exportar dados filtrados em formato CSV (UTF-8 com BOM)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Exportar planilha formatada para Microsoft Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar (Requirement 8) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span>Filtros Avançados</span>
          </div>

          {(searchTerm ||
            selectedSurvey !== 'all' ||
            selectedCategory !== 'all' ||
            selectedScore !== 'all' ||
            selectedPeriod !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search by customer */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente ou código..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter by Survey */}
          <div>
            <select
              value={selectedSurvey}
              onChange={(e) => setSelectedSurvey(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer truncate"
            >
              <option value="all">Todas as Pesquisas</option>
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Classification */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Classificações</option>
              <option value="promoter">Promotores (9 e 10)</option>
              <option value="passive">Neutros (7 e 8)</option>
              <option value="detractor">Detratores (0 a 6)</option>
            </select>
          </div>

          {/* Filter by Score */}
          <div>
            <select
              value={selectedScore}
              onChange={(e) => setSelectedScore(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Notas (0 a 10)</option>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((score) => (
                <option key={score} value={score}>
                  Nota {score}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Period */}
          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">Todo o Período</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="month">Neste Mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responses Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Pesquisa</th>
                <th className="py-3 px-4 text-center">Nota NPS</th>
                <th className="py-3 px-4">Classificação</th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Data e Hora</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Nenhuma resposta corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((resp) => {
                  const isPromoter = resp.classification === 'promoter';
                  const isPassive = resp.classification === 'passive';

                  return (
                    <tr key={resp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {resp.customer_name}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          {resp.customer_code} · {resp.customer_email}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 max-w-[200px] truncate">
                        {resp.survey_title}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                          {resp.nps_score}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            isPromoter
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isPassive
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {getClassificationLabel(resp.classification)}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-500">
                        <div>{new Date(resp.created_at).toLocaleDateString('pt-BR')}</div>
                        <div className="text-[10px] text-neutral-400">
                          {new Date(resp.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Concluído
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveResponse(resp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded text-xs font-medium transition-colors cursor-pointer"
                            title="Abrir resultado individual completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalhes</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm('Deseja realmente excluir esta resposta?')) {
                                await onDeleteResponse(resp.id);
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Excluir resposta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Resultado Individual Detalhado (Requirement 7) */}
      {activeResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Resultado Individual NPS
                </span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {activeResponse.customer_name}
                </h3>
              </div>
              <button
                onClick={() => setActiveResponse(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-lg cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Score Highlight Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Classificação Net Promoter Score:
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {activeResponse.classification === 'promoter' ? (
                      <Smile className="w-5 h-5 text-emerald-500" />
                    ) : activeResponse.classification === 'passive' ? (
                      <Meh className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Frown className="w-5 h-5 text-red-500" />
                    )}
                    <span
                      className={`text-base font-bold ${
                        activeResponse.classification === 'promoter'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : activeResponse.classification === 'passive'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {getClassificationLabel(activeResponse.classification)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-neutral-500">Nota Atribuída:</span>
                  <div className="text-4xl font-extrabold font-mono text-neutral-900 dark:text-white">
                    {activeResponse.nps_score}
                    <span className="text-sm text-neutral-400 font-normal"> / 10</span>
                  </div>
                </div>
              </div>

              {/* Customer & Survey Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-neutral-400">Código do Cliente:</span>
                  <div className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeResponse.customer_code}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-400">E-mail:</span>
                  <div className="text-neutral-800 dark:text-neutral-200">
                    {activeResponse.customer_email}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-400">Telefone:</span>
                  <div className="text-neutral-800 dark:text-neutral-200">
                    {activeResponse.customer_phone || 'Não informado'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-400">Data e Hora do Registro:</span>
                  <div className="font-mono text-neutral-800 dark:text-neutral-200">
                    {new Date(activeResponse.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <span className="text-neutral-400">Pesquisa:</span>
                  <div className="font-medium text-neutral-800 dark:text-neutral-200">
                    {activeResponse.survey_title}
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <span className="text-neutral-400">Token Individual:</span>
                  <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded inline-block">
                    {activeResponse.token}
                  </div>
                </div>
              </div>

              {/* All Survey Answers */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
                  Respostas Fornecidas pelo Cliente ({activeResponse.answers.length})
                </h4>

                <div className="space-y-3">
                  {activeResponse.answers.map((ans, idx) => (
                    <div
                      key={ans.question_id || idx}
                      className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs"
                    >
                      <div className="font-semibold text-neutral-900 dark:text-neutral-200 mb-1.5 flex items-start gap-1.5">
                        <span className="text-neutral-400 font-mono">Q{idx + 1}.</span>
                        <span>{ans.question_text}</span>
                      </div>
                      <div className="pl-5 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-2.5 rounded border border-neutral-100 dark:border-neutral-800">
                        {ans.question_type === 'nps' ? (
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                            {ans.value} de 10
                          </span>
                        ) : (
                          <p className="whitespace-pre-wrap">{String(ans.value || '(Sem resposta)')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setActiveResponse(null)}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 text-white dark:text-neutral-900 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
