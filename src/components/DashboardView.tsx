import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Send, 
  MessageSquare, 
  Percent, 
  TrendingUp, 
  Smile, 
  Meh, 
  Frown, 
  ArrowUpRight,
  Filter,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Survey, SurveyResponse, SurveyToken } from '../types/nps';
import { calculateNPSMetrics, calculateTimelineTrend, formatNPSScore } from '../services/npsCalculator';

interface DashboardViewProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  tokens: SurveyToken[];
  onOpenPublicSurvey: (token: string) => void;
  onNavigateToResponses: (filterCategory?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  surveys,
  responses,
  tokens,
  onOpenPublicSurvey,
  onNavigateToResponses,
}) => {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('all');

  // Filter responses and tokens by selected survey
  const filteredResponses = useMemo(() => {
    if (selectedSurveyId === 'all') return responses;
    return responses.filter((r) => r.survey_id === selectedSurveyId);
  }, [responses, selectedSurveyId]);

  const filteredTokens = useMemo(() => {
    if (selectedSurveyId === 'all') return tokens;
    return tokens.filter((t) => t.survey_id === selectedSurveyId);
  }, [tokens, selectedSurveyId]);

  const metrics = useMemo(() => {
    return calculateNPSMetrics(filteredResponses, filteredTokens.length);
  }, [filteredResponses, filteredTokens]);

  const timelineData = useMemo(() => {
    return calculateTimelineTrend(filteredResponses);
  }, [filteredResponses]);

  // Pick a sample pending token to allow direct testing from dashboard
  const samplePendingToken = useMemo(() => {
    const pending = filteredTokens.find((t) => t.status === 'pending');
    if (pending) return pending.token;
    return filteredTokens[0]?.token || '';
  }, [filteredTokens]);

  const maxDistributionCount = useMemo(() => {
    return Math.max(...metrics.scoreDistribution.map((d) => d.count), 1);
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Top action & survey selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Painel Executivo NPS
          </h2>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span>Metodologia Net Promoter Score®</span>
            <span aria-hidden="true">·</span>
            <span>Atualização contínua em tempo real</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 rounded-lg shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedSurveyId}
              onChange={(e) => setSelectedSurveyId(e.target.value)}
              className="text-xs bg-transparent border-none text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Pesquisas ({surveys.length})</option>
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {samplePendingToken && (
            <button
              onClick={() => onOpenPublicSurvey(samplePendingToken)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Abre a pesquisa pública como um cliente para responder e testar"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Testar como Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* NPS Card */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              NPS Atual
            </span>
            <div
              className={`w-2.5 h-2.5 rounded-full`}
              style={{ backgroundColor: metrics.zone.color }}
              title={metrics.zone.name}
            />
          </div>

          <div className="my-4 text-center">
            <div className="text-5xl font-extrabold tracking-tight font-mono tabular-nums text-neutral-900 dark:text-white">
              {formatNPSScore(metrics.npsScore)}
            </div>
            <div className="mt-2 text-xs font-semibold" style={{ color: metrics.zone.color }}>
              {metrics.zone.name}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug px-2">
              {metrics.zone.description}
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Fórmula:</span>
            <span className="font-mono text-neutral-700 dark:text-neutral-300">
              {metrics.promotersPercent}% - {metrics.detractorsPercent}%
            </span>
          </div>
        </div>

        {/* 3 Secondary Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Pesquisas Enviadas
              </span>
              <Send className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {metrics.totalSent}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Convites únicos com link individual
              </div>
            </div>
            <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              Tokens gerados no sistema
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Total de Respostas
              </span>
              <MessageSquare className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {metrics.totalResponses}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Avaliações computadas
              </div>
            </div>
            <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              Atualização automática
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Taxa de Resposta
              </span>
              <Percent className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {metrics.responseRate}%
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                {metrics.totalResponses} de {metrics.totalSent} clientes responderam
              </div>
            </div>
            <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              Engajamento da base
            </div>
          </div>
        </div>
      </div>

      {/* Promoters, Neutrals, Detractors Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Promoters */}
        <div 
          onClick={() => onNavigateToResponses('promoter')}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Promotores (9 e 10)
              </span>
            </div>
            <span className="text-xs text-neutral-400 group-hover:text-emerald-500 transition-colors flex items-center">
              Ver lista <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div className="text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {metrics.promotersCount}
            </div>
            <div className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 font-mono">
              {metrics.promotersPercent}%
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.promotersPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Clientes altamente leais que estimulam o crescimento orgânico.
          </p>
        </div>

        {/* Neutrals */}
        <div 
          onClick={() => onNavigateToResponses('passive')}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs hover:border-amber-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Meh className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Neutros (7 e 8)
              </span>
            </div>
            <span className="text-xs text-neutral-400 group-hover:text-amber-500 transition-colors flex items-center">
              Ver lista <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div className="text-3xl font-bold font-mono tabular-nums text-amber-500 dark:text-amber-400">
              {metrics.passivesCount}
            </div>
            <div className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 font-mono">
              {metrics.passivesPercent}%
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.passivesPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Clientes satisfeitos porém vulneráveis a ofertas da concorrência.
          </p>
        </div>

        {/* Detractors */}
        <div 
          onClick={() => onNavigateToResponses('detractor')}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs hover:border-red-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Frown className="w-5 h-5 text-red-500 dark:text-red-400" />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Detratores (0 a 6)
              </span>
            </div>
            <span className="text-xs text-neutral-400 group-hover:text-red-500 transition-colors flex items-center">
              Ver lista <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div className="text-3xl font-bold font-mono tabular-nums text-red-500 dark:text-red-400">
              {metrics.detractorsCount}
            </div>
            <div className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 font-mono">
              {metrics.detractorsPercent}%
            </div>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.detractorsPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Clientes insatisfeitos com risco de cancelamento e boca a boca negativo.
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart (0 to 10) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Distribuição das Notas (0 a 10)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Frequência de respostas por pontuação
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" /> 0-6
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 7-8
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> 9-10
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-11 gap-1.5 sm:gap-2 h-44 items-end">
              {metrics.scoreDistribution.map((item) => {
                const heightPercent = maxDistributionCount > 0 
                  ? Math.max(8, Math.round((item.count / maxDistributionCount) * 100))
                  : 8;
                
                const barColor =
                  item.score >= 9
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : item.score >= 7
                    ? 'bg-amber-400 hover:bg-amber-500'
                    : 'bg-red-400 hover:bg-red-500';

                return (
                  <div key={item.score} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mb-1 group-hover:font-bold">
                      {item.count}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${barColor}`}
                      style={{ height: `${item.count === 0 ? 4 : heightPercent}%` }}
                      title={`Nota ${item.score}: ${item.count} resposta(s) (${item.percentage}%)`}
                    />
                    <span className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 mt-2 border-t border-neutral-200 dark:border-neutral-800 w-full text-center pt-1">
                      {item.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* NPS Evolution Timeline */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Evolução Temporal do NPS
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Trajetória acumulada do indicador
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-neutral-400" />
          </div>

          {timelineData.length > 0 ? (
            <div className="pt-2">
              <div className="relative h-44 flex items-end">
                {/* SVG Line representation */}
                <svg className="w-full h-36 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="npsLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal zero line */}
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#e5e7eb" strokeDasharray="3 3" />

                  {/* Area and Line */}
                  {(() => {
                    const step = timelineData.length > 1 ? 400 / (timelineData.length - 1) : 400;
                    const points = timelineData.map((d, idx) => {
                      const x = idx * step;
                      // map score -100 to 100 to y (110 to 10)
                      const y = 60 - (d.score / 100) * 50;
                      return `${x},${y}`;
                    });
                    const pathD = `M ${points.join(' L ')}`;
                    const areaD = `${pathD} L 400,120 L 0,120 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#npsLineGrad)" />
                        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                        {timelineData.map((d, idx) => {
                          const x = idx * step;
                          const y = 60 - (d.score / 100) * 50;
                          return (
                            <g key={idx}>
                              <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Timeline date axis */}
              <div className="flex justify-between items-center text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {timelineData.map((t, idx) => (
                  <div key={idx} className="text-center">
                    <div>{t.date}</div>
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {formatNPSScore(t.score)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-neutral-400">
              Nenhum dado temporal registrado ainda.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table preview */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Últimas Respostas Recebidas
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Registros imediatos vinculados aos clientes
            </p>
          </div>
          <button
            onClick={() => onNavigateToResponses()}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Ver todas as {responses.length} respostas →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider">
                <th className="pb-2.5 font-medium">Cliente</th>
                <th className="pb-2.5 font-medium">Pesquisa</th>
                <th className="pb-2.5 font-medium text-center">Nota</th>
                <th className="pb-2.5 font-medium">Classificação</th>
                <th className="pb-2.5 font-medium">Comentário Principal</th>
                <th className="pb-2.5 font-medium text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredResponses.slice(0, 5).map((resp) => {
                const comment = resp.answers.find((a) => a.question_type === 'text')?.value || '-';
                return (
                  <tr key={resp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                      <div>{resp.customer_name}</div>
                      <div className="text-[10px] font-mono text-neutral-400">{resp.customer_code}</div>
                    </td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-300 max-w-[200px] truncate">
                      {resp.survey_title}
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-neutral-900 dark:text-white">
                      {resp.nps_score}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`font-semibold ${
                          resp.classification === 'promoter'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : resp.classification === 'passive'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {resp.classification === 'promoter'
                          ? 'Promotor'
                          : resp.classification === 'passive'
                          ? 'Neutro'
                          : 'Detrator'}
                      </span>
                    </td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400 max-w-[280px] truncate">
                      {String(comment)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-neutral-500">
                      {new Date(resp.created_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(resp.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
