import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X,
  Award,
  Database,
  ChevronDown
} from 'lucide-react';
import { SupabaseConfig, SurveyToken, Customer } from '../types/nps';

export type AdminTab = 'dashboard' | 'surveys' | 'customers' | 'responses' | 'reports' | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  adminEmail: string;
  supabaseConfig: SupabaseConfig;
  tokens: SurveyToken[];
  customers: Customer[];
  onOpenCustomerSurvey: (token: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  adminEmail,
  supabaseConfig,
  tokens,
  customers,
  onOpenCustomerSurvey,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickTestOpen, setQuickTestOpen] = useState(false);

  const menuItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'surveys', label: 'Pesquisas', icon: ClipboardList },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'responses', label: 'Respostas', icon: MessageSquare },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col md:flex-row text-neutral-900 dark:text-neutral-100">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 text-white z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
            NPS
          </div>
          <span className="font-bold text-sm">NPS Acadêmico</span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex flex-col justify-between w-full md:w-64 bg-neutral-900 border-r border-neutral-800 shrink-0 z-20 transition-all`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-neutral-800 hidden md:flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white">NPS Acadêmico</h1>
                <p className="text-[10px] text-neutral-400 font-mono">Gestão Net Promoter Score</p>
              </div>
            </div>
          </div>

          {/* Database indicator in sidebar */}
          <div className="px-4 pt-4 pb-2">
            <div
              onClick={() => onSelectTab('settings')}
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-xs cursor-pointer hover:border-neutral-600 transition-colors"
              title="Clique para abrir as configurações do Supabase"
            >
              <div className="flex items-center gap-2 truncate">
                <Database className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="text-[11px] text-neutral-300 truncate">
                  {supabaseConfig.isConnected ? 'Supabase Conectado' : 'Local Storage Ativo'}
                </span>
              </div>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  supabaseConfig.isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Fast Test Dropdown & Profile */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          {/* Quick Client Test link */}
          <div className="relative">
            <button
              onClick={() => setQuickTestOpen(!quickTestOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">Testar como Cliente</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {quickTestOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl p-2 z-40 max-h-48 overflow-y-auto space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">
                  Selecione um cliente para responder:
                </div>
                {tokens.slice(0, 6).map((tok) => {
                  const cust = customers.find((c) => c.id === tok.customer_id);
                  if (!cust) return null;
                  return (
                    <button
                      key={tok.id}
                      onClick={() => {
                        onOpenCustomerSurvey(tok.token);
                        setQuickTestOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-700 text-xs text-neutral-200 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{cust.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400 ml-1">
                        {cust.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-semibold text-white truncate">Administrador</div>
              <div className="text-[10px] font-mono text-neutral-400 truncate">{adminEmail}</div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Encerrar sessão administrativa"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>NPS Acadêmico</span>
            <span>/</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
              {menuItems.find((m) => m.id === currentTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (tokens.length > 0) {
                  onOpenCustomerSurvey(tokens[0].token);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
              <span>Simular Acesso Público do Cliente</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
