import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Terminal, 
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import { SupabaseConfig } from '../types/nps';
import { dataService } from '../services/dataService';

interface SettingsViewProps {
  config: SupabaseConfig;
  onSaveConfig: (config: Partial<SupabaseConfig>) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onResetData,
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Save inputs first
    onSaveConfig({ url, anonKey });

    const result = await dataService.testSupabaseConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({ url, anonKey });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(dataService.getSqlMigrationScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Configuração do Banco de Dados & Supabase
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Conecte seu projeto Supabase ou utilize a camada de persistência local acadêmica
        </p>
      </div>

      {/* Supabase Connection Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Integração com Supabase
              </h3>
              <p className="text-xs text-neutral-500">
                Armazenamento relacional PostgreSQL na nuvem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                config.isConnected
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  config.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>
                {config.isConnected ? 'Supabase Conectado' : 'Modo Local Storage Ativo'}
              </span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Project URL do Supabase
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Anon Key / Public API Key do Supabase
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-800 dark:text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{testResult.message}</span>
              </div>
            </div>
          )}

          {saveToast && (
            <div className="p-2.5 bg-neutral-800 text-white rounded-lg text-xs flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Salvar Credenciais
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url || !anonKey}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão Supabase'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SQL Migration Script Ready for Supabase SQL Editor */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Script DDL SQL para o Supabase SQL Editor
            </h3>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Script SQL</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-neutral-500">
          Abra seu dashboard no Supabase, acesse o menu <strong>SQL Editor</strong> e cole o código abaixo. Ele cria as tabelas relacionais, índices, regras de RLS e os <strong>Buckets de Armazenamento (Storage)</strong> com todas as políticas configuradas:
        </p>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Inclui buckets de storage: <code>nps-exports</code> (público) e <code>nps-attachments</code> (privado) com políticas RLS para <code>storage.objects</code>.</span>
        </div>

        <div className="relative">
          <pre className="bg-neutral-950 text-neutral-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-neutral-800">
            {dataService.getSqlMigrationScript()}
          </pre>
        </div>
      </div>

      {/* Academic Demonstration Reset Option */}
      <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Restaurar Base de Dados Acadêmica de Demonstração
          </h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            Recarrega as pesquisas, 8 clientes e 6 respostas de exemplo para apresentação e testes
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Deseja recarregar o conjunto de dados acadêmicos de exemplo?')) {
              onResetData();
              alert('Dados de exemplo restaurados com sucesso!');
            }
          }}
          className="px-3.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          Restaurar Dados de Exemplo
        </button>
      </div>
    </div>
  );
};
