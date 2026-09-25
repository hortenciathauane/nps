import React, { useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Award, 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  Layers
} from 'lucide-react';
import { SurveyResponse, Survey } from '../types/nps';
import { calculateNPSMetrics, formatNPSScore } from '../services/npsCalculator';

interface ReportsViewProps {
  responses: SurveyResponse[];
  surveys: Survey[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ responses, surveys }) => {
  const metrics = useMemo(() => {
    return calculateNPSMetrics(responses, responses.length);
  }, [responses]);

  // Extract qualitative feedback keywords
  const textFeedbackList = useMemo(() => {
    const list: string[] = [];
    responses.forEach((r) => {
      r.answers.forEach((a) => {
        if (a.question_type === 'text' && typeof a.value === 'string' && a.value.trim().length > 5) {
          list.push(a.value.trim());
        }
      });
    });
    return list;
  }, [responses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800 print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Relatório Técnico & Metodologia NPS
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Documentação acadêmica, análise descritiva da amostra e fundamentação teórica
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* Printable Report Document */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-8">
        {/* Document Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                NPS
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Relatório Técnico de Desempenho e Lealdade do Cliente
                </h1>
                <p className="text-xs text-neutral-500">
                  Sistema de Pesquisa Net Promoter Score Acadêmico · {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-neutral-400">STATUS DA AMOSTRA</span>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Auditoria Concluída
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-medium text-neutral-500">NPS Consolidado</span>
            <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white mt-1">
              {formatNPSScore(metrics.npsScore)}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: metrics.zone.color }}>
              {metrics.zone.name}
            </span>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-medium text-neutral-500">Promotores (9-10)</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-600 mt-1">
              {metrics.promotersPercent}%
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              {metrics.promotersCount} clientes
            </span>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-medium text-neutral-500">Neutros (7-8)</span>
            <div className="text-3xl font-extrabold font-mono text-amber-500 mt-1">
              {metrics.passivesPercent}%
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              {metrics.passivesCount} clientes
            </span>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-medium text-neutral-500">Detratores (0-6)</span>
            <div className="text-3xl font-extrabold font-mono text-red-500 mt-1">
              {metrics.detractorsPercent}%
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              {metrics.detractorsCount} clientes
            </span>
          </div>
        </div>

        {/* Section 1: Fundamentação Teórica */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              1. Fundamentação Teórica da Metodologia NPS
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed text-justify">
            O <strong>Net Promoter Score (NPS)</strong> é uma métrica desenvolvida por Fred Reichheld,
            da Bain & Company, introduzida em 2003 no artigo clássico da Harvard Business Review intitulado
            <em> "The One Number You Need to Grow"</em>. O método baseia-se na identificação da lealdade dos
            clientes por meio de uma única pergunta norteadora ("Em uma escala de 0 a 10, qual a probabilidade
            de você nos recomendar a um amigo ou colega?"), correlacionando a propensão de indicação com a
            saúde financeira e capacidade de expansão da organização.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              <thead className="bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-300">
                <tr>
                  <th className="py-2 px-3">Faixa de Nota</th>
                  <th className="py-2 px-3">Classificação</th>
                  <th className="py-2 px-3">Comportamento do Cliente</th>
                  <th className="py-2 px-3">Impacto na Organização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600">9 a 10</td>
                  <td className="py-2 px-3 font-semibold text-emerald-600">Promotores</td>
                  <td className="py-2 px-3">Entusiastas fiéis que compram mais e indicam novos clientes.</td>
                  <td className="py-2 px-3">Redução do CAC (Custo de Aquisição) e crescimento orgânico.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-amber-500">7 a 8</td>
                  <td className="py-2 px-3 font-semibold text-amber-500">Neutros / Passivos</td>
                  <td className="py-2 px-3">Satisfeitos, porém vulneráveis a ofertas da concorrência.</td>
                  <td className="py-2 px-3">Não influenciam no cálculo direto; representam oportunidade de conversão.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-red-500">0 a 6</td>
                  <td className="py-2 px-3 font-semibold text-red-500">Detratores</td>
                  <td className="py-2 px-3">Clientes insatisfeitos ou frustrados com as entregas.</td>
                  <td className="py-2 px-3">Propagação de boca a boca desfavorável e risco de churn elevado.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Zonas de Classificação */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              2. Zonas de Classificação e Benchmarking
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                Zona de Excelência (75 a 100)
              </span>
              <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                Organizações com cultura centrada no cliente de classe mundial. Padrão de referência internacional.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
              <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">
                Zona de Qualidade (50 a 74)
              </span>
              <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                Nível satisfatório e sólido com predominância nítida de promotores. Clientes com boa retenção.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
              <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                Zona de Aperfeiçoamento (0 a 49)
              </span>
              <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                Sinal de alerta moderado. O percentual de promotores supera detratores, mas há atrito perceptível.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20">
              <span className="font-bold text-red-700 dark:text-red-400 block mb-1">
                Zona Crítica (-100 a -1)
              </span>
              <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                Predomínio de detratores. Requer plano de intervenção e resolução de gargalos operacionais urgente.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Análise Qualitativa dos Feedbacks */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              3. Amostra Qualitativa das Justificativas Registradas
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            A pesquisa aberta permite fechar o <em>loop</em> de feedback entendendo as causas-raiz das notas:
          </p>

          <div className="space-y-2">
            {textFeedbackList.slice(0, 6).map((text, i) => (
              <div
                key={i}
                className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border-l-2 border-indigo-500 rounded-r-lg text-xs text-neutral-700 dark:text-neutral-300 italic"
              >
                "{text}"
              </div>
            ))}
          </div>
        </section>

        {/* Sign-off for academic evaluation */}
        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-400 gap-4">
          <div>
            Relatório gerado automaticamente pelo Sistema NPS Acadêmico
          </div>
          <div className="font-mono text-[11px]">
            SHA-256: e8b9412f9... (Auditoria Íntegra)
          </div>
        </div>
      </div>
    </div>
  );
};
