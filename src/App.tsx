import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Survey, SurveyQuestion, SurveyResponse, SurveyToken, SupabaseConfig } from './types/nps';
import { dataService } from './services/dataService';
import { LoginView } from './components/LoginView';
import { AdminLayout, AdminTab } from './components/AdminLayout';
import { DashboardView } from './components/DashboardView';
import { SurveysView } from './components/SurveysView';
import { CustomersView } from './components/CustomersView';
import { ResponsesView } from './components/ResponsesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PublicSurveyView } from './components/PublicSurveyView';

export default function App() {
  // Navigation & Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nps_admin_logged') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem('nps_admin_email') || 'admin@npsacademico.edu.br';
  });

  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [publicSurveyToken, setPublicSurveyToken] = useState<string | null>(null);

  // Response Filter pass-through from dashboard clicks
  const [responsesCategoryFilter, setResponsesCategoryFilter] = useState<string>('all');
  const [responsesSurveyFilter, setResponsesSurveyFilter] = useState<string>('all');

  // Core Data State
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tokens, setTokens] = useState<SurveyToken[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() =>
    dataService.getSupabaseConfig()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all system data
  const loadData = useCallback(async () => {
    try {
      const [surveysData, customersData, tokensData, responsesData] = await Promise.all([
        dataService.getSurveys(),
        dataService.getCustomers(),
        dataService.getTokens(),
        dataService.getResponses(),
      ]);

      setSurveys(surveysData);
      setCustomers(customersData);
      setTokens(tokensData);
      setResponses(responsesData);
      setSupabaseConfig(dataService.getSupabaseConfig());
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to hash / URL tokens (e.g. #/pesquisa/nps-123 or ?token=nps-123)
  useEffect(() => {
    dataService.init();
    loadData();

    const parseRouteFromUrl = () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('token');

      if (queryToken) {
        setPublicSurveyToken(queryToken);
        return;
      }

      if (hash.startsWith('#/pesquisa/')) {
        const token = hash.replace('#/pesquisa/', '');
        if (token) {
          setPublicSurveyToken(token);
        }
      }
    };

    parseRouteFromUrl();
    window.addEventListener('hashchange', parseRouteFromUrl);
    return () => window.removeEventListener('hashchange', parseRouteFromUrl);
  }, [loadData]);

  // Auth handlers
  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setAdminEmail(email);
    localStorage.setItem('nps_admin_logged', 'true');
    localStorage.setItem('nps_admin_email', email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nps_admin_logged');
  };

  // Open public survey
  const handleOpenPublicSurvey = (token: string) => {
    window.location.hash = `#/pesquisa/${token}`;
    setPublicSurveyToken(token);
  };

  const handleBackToAdmin = () => {
    window.location.hash = '';
    setPublicSurveyToken(null);
  };

  // Survey handlers
  const handleSaveSurvey = async (
    surveyData: Partial<Survey> & { title: string; questions: SurveyQuestion[] }
  ) => {
    await dataService.saveSurvey(surveyData);
    await loadData();
  };

  const handleToggleSurveyStatus = async (id: string) => {
    await dataService.toggleSurveyStatus(id);
    await loadData();
  };

  // Customer handlers
  const handleAddCustomer = async (newCustomer: Omit<Customer, 'id' | 'created_at'>) => {
    await dataService.addCustomer(newCustomer);
    await loadData();
  };

  const handleImportCSV = async (csvContent: string) => {
    const result = await dataService.importCustomersFromCSV(csvContent);
    await loadData();
    return result;
  };

  // Response handlers
  const handleDeleteResponse = async (id: string) => {
    await dataService.deleteResponse(id);
    await loadData();
  };

  // Configuration handlers
  const handleSaveSupabaseConfig = (newConfig: Partial<SupabaseConfig>) => {
    const updated = dataService.saveSupabaseConfig(newConfig);
    setSupabaseConfig(updated);
  };

  const handleResetData = () => {
    dataService.resetToSampleData();
    loadData();
  };

  // If URL points to public survey token, render public customer survey view
  if (publicSurveyToken) {
    return (
      <PublicSurveyView
        tokenString={publicSurveyToken}
        onResponseSubmitted={() => {
          loadData();
        }}
        onBackToAdmin={handleBackToAdmin}
      />
    );
  }

  // If not authenticated, render Admin Login screen
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-neutral-400 font-mono">Inicializando Sistema NPS...</span>
        </div>
      </div>
    );
  }

  // Render Admin Workspace
  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        if (tab !== 'responses') {
          setResponsesCategoryFilter('all');
          setResponsesSurveyFilter('all');
        }
      }}
      onLogout={handleLogout}
      adminEmail={adminEmail}
      supabaseConfig={supabaseConfig}
      tokens={tokens}
      customers={customers}
      onOpenCustomerSurvey={handleOpenPublicSurvey}
    >
      {currentTab === 'dashboard' && (
        <DashboardView
          surveys={surveys}
          responses={responses}
          tokens={tokens}
          onOpenPublicSurvey={handleOpenPublicSurvey}
          onNavigateToResponses={(category) => {
            setResponsesCategoryFilter(category || 'all');
            setCurrentTab('responses');
          }}
        />
      )}

      {currentTab === 'surveys' && (
        <SurveysView
          surveys={surveys}
          onSaveSurvey={handleSaveSurvey}
          onToggleStatus={handleToggleSurveyStatus}
          onViewResults={(surveyId) => {
            setResponsesSurveyFilter(surveyId);
            setResponsesCategoryFilter('all');
            setCurrentTab('responses');
          }}
          onOpenPublicSurvey={(surveyId) => {
            const match = tokens.find((t) => t.survey_id === surveyId);
            if (match) handleOpenPublicSurvey(match.token);
            else if (tokens.length > 0) handleOpenPublicSurvey(tokens[0].token);
          }}
        />
      )}

      {currentTab === 'customers' && (
        <CustomersView
          customers={customers}
          surveys={surveys}
          tokens={tokens}
          onAddCustomer={handleAddCustomer}
          onImportCSV={handleImportCSV}
          onOpenPublicSurvey={handleOpenPublicSurvey}
          onRefreshTokens={loadData}
        />
      )}

      {currentTab === 'responses' && (
        <ResponsesView
          responses={responses}
          surveys={surveys}
          initialCategoryFilter={responsesCategoryFilter}
          initialSurveyFilter={responsesSurveyFilter}
          onDeleteResponse={handleDeleteResponse}
        />
      )}

      {currentTab === 'reports' && (
        <ReportsView responses={responses} surveys={surveys} />
      )}

      {currentTab === 'settings' && (
        <SettingsView
          config={supabaseConfig}
          onSaveConfig={handleSaveSupabaseConfig}
          onResetData={handleResetData}
        />
      )}
    </AdminLayout>
  );
}
