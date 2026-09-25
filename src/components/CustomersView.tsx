import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Upload, 
  Search, 
  Copy, 
  ExternalLink, 
  Check, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Link as LinkIcon,
  RefreshCw,
  Phone,
  Mail,
  Download,
  FileSpreadsheet,
  MessageSquare
} from 'lucide-react';
import { Customer, Survey, SurveyToken } from '../types/nps';
import { exportCustomersToExcel, exportCustomersToCSV, CustomerExportItem } from '../utils/exportUtils';

interface CustomersViewProps {
  customers: Customer[];
  surveys: Survey[];
  tokens: SurveyToken[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'created_at'>) => Promise<void>;
  onImportCSV: (csvContent: string) => Promise<{ added: number; errors: string[] }>;
  onOpenPublicSurvey: (token: string) => void;
  onRefreshTokens: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  surveys,
  tokens,
  onAddCustomer,
  onImportCSV,
  onOpenPublicSurvey,
  onRefreshTokens,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New customer form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<{ added: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Selected survey for individual link column
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(
    surveys.find((s) => s.is_active)?.id || surveys[0]?.id || ''
  );

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
    );
  }, [customers, searchTerm]);

  // Map of tokens by customerId for the active survey
  const tokenByCustomer = useMemo(() => {
    const map = new Map<string, SurveyToken>();
    tokens.forEach((t) => {
      if (t.survey_id === selectedSurveyId) {
        map.set(t.customer_id, t);
      }
    });
    return map;
  }, [tokens, selectedSurveyId]);

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}${window.location.pathname}#/pesquisa/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const getActiveSurveyTitle = () => {
    return surveys.find((s) => s.id === selectedSurveyId)?.title || 'Pesquisa de Satisfação NPS';
  };

  const getExportData = (): CustomerExportItem[] => {
    const surveyTitle = getActiveSurveyTitle();
    const baseUrl = `${window.location.origin}${window.location.pathname}`;

    return filteredCustomers.map((cust) => {
      const tokenItem = tokenByCustomer.get(cust.id);
      const tokenStr = tokenItem?.token || `nps-${cust.code.toLowerCase()}`;
      const surveyLink = `${baseUrl}#/pesquisa/${tokenStr}`;
      const isCompleted = tokenItem?.status === 'completed';
      const status = isCompleted ? 'Respondido' : 'Pendente';
      
      const firstName = cust.name.split(' ')[0] || cust.name;
      const smsMessage = `Olá ${firstName}! Gostaríamos de ouvir sua opinião: ${surveyLink}`;

      return {
        code: cust.code,
        name: cust.name,
        phone: cust.phone || '',
        email: cust.email,
        surveyTitle,
        token: tokenStr,
        surveyLink,
        status,
        smsMessage,
      };
    });
  };

  const handleExportExcelSMS = () => {
    const data = getExportData();
    const filename = `links_pesquisa_sms_${new Date().toISOString().slice(0, 10)}.xls`;
    exportCustomersToExcel(data, filename);
  };

  const handleExportCSVSMS = () => {
    const data = getExportData();
    const filename = `links_pesquisa_sms_${new Date().toISOString().slice(0, 10)}.csv`;
    exportCustomersToCSV(data, filename);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!name.trim() || !email.trim() || !code.trim()) {
      setAddError('Nome, e-mail e código do cliente são campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        code: code.trim().toUpperCase(),
      });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setCode('');
    } catch (err: any) {
      setAddError(err.message || 'Erro ao cadastrar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await onImportCSV(csvText);
      setImportResult(res);
      if (res.added > 0) {
        setCsvText('');
      }
    } catch (err: any) {
      setImportResult({ added: 0, errors: [err.message || 'Falha ao importar CSV'] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content || '');
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sample = `Código;Nome;E-mail;Telefone
CLI-201;Mariana Vasconcelos;mariana@exemplo.com.br;(11) 99111-2233
CLI-202;Lucas Gabriel Souza;lucas@exemplo.com.br;(21) 98222-3344
CLI-203;Juliana Monteiro;juliana@exemplo.com.br;(31) 97333-4455`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_clientes_nps.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Base de Clientes & Links Individuais
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Cada cliente possui um token e link exclusivo <code>/pesquisa/&#123;token&#125;</code> para resposta segura
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcelSMS}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Exportar planilha Excel completa com Código, Nome, Telefone, Link da Pesquisa e Mensagem SMS pronta"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel para SMS</span>
          </button>

          <button
            onClick={handleExportCSVSMS}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Exportar arquivo CSV com colunas de celular e link de pesquisa para sistemas de disparo em massa"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (SMS)</span>
          </button>

          <button
            onClick={() => {
              setCode(`CLI-${Math.floor(100 + Math.random() * 900)}`);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>

          <button
            onClick={() => {
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importar CSV</span>
          </button>
        </div>
      </div>

      {/* Control bar: search & select survey for links */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou código (ex: CLI-101)..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
            Pesquisa vinculada aos links:
          </span>
          <select
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer max-w-[220px] truncate"
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.is_active ? '(Ativa)' : '(Inativa)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Token & Link Exclusivo</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    Nenhum cliente encontrado com os termos pesquisados.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const tokenItem = tokenByCustomer.get(cust.id);
                  const tokenStr = tokenItem?.token || `nps-${cust.code.toLowerCase()}`;
                  const isCompleted = tokenItem?.status === 'completed';

                  return (
                    <tr key={cust.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {cust.code}
                      </td>

                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                        <div>{cust.name}</div>
                        <div className="text-[11px] text-neutral-400">
                          Cadastrado em {new Date(cust.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{cust.email}</span>
                        </div>
                        {cust.phone && (
                          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-[11px] truncate max-w-[140px]">
                            {tokenStr}
                          </span>
                          <button
                            onClick={() => handleCopyLink(tokenStr)}
                            className="p-1 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            title="Copiar Link Individual do Cliente"
                          >
                            {copiedToken === tokenStr ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const baseUrl = `${window.location.origin}${window.location.pathname}`;
                              const link = `${baseUrl}#/pesquisa/${tokenStr}`;
                              const firstName = cust.name.split(' ')[0] || cust.name;
                              const sms = `Olá ${firstName}! Gostaríamos de ouvir sua opinião: ${link}`;
                              navigator.clipboard.writeText(sms);
                              setCopiedToken(`sms-${tokenStr}`);
                              setTimeout(() => setCopiedToken(null), 2500);
                            }}
                            className="p-1 text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Copiar texto pronto para SMS / WhatsApp com o link do cliente"
                          >
                            {copiedToken === `sms-${tokenStr}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isCompleted ? 'Respondido' : 'Pendente'}
                        </span>
                        {tokenItem?.completed_at && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {new Date(tokenItem.completed_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenPublicSurvey(tokenStr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded text-xs font-medium transition-colors cursor-pointer"
                          title="Abre a tela de resposta pública simulando o acesso deste cliente"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir Pesquisa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Cadastrar Novo Cliente
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Código do Cliente *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: CLI-109"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono uppercase text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel Moreira Silva"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gabriel.silva@empresa.com.br"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar & Gerar Links'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Customers CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Importação de Clientes em Lote (CSV)
                </h3>
                <p className="text-xs text-neutral-500">
                  Carregue um arquivo .csv ou cole os dados com as colunas Nome, E-mail, Telefone e Código
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <span className="text-xs text-neutral-600 dark:text-neutral-300">
                  Precisa de um modelo compatível?
                </span>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Exemplo .CSV</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Selecionar Arquivo .CSV do Computador
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-neutral-600 dark:text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-700 dark:file:text-neutral-200 hover:file:bg-neutral-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Ou Cole o Texto CSV abaixo:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={5}
                  placeholder={`Código;Nome;E-mail;Telefone\nCLI-201;Mariana Vasconcelos;mariana@exemplo.com.br;(11) 99111-2233`}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {importResult && (
                <div
                  className={`p-3 rounded-lg text-xs space-y-1 ${
                    importResult.added > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-800 dark:text-red-300'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    {importResult.added > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{importResult.added} cliente(s) importado(s) com sucesso!</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="text-[11px] text-red-700 dark:text-red-400 mt-1 pl-5">
                      {importResult.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !csvText.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? 'Importando...' : 'Processar & Importar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
