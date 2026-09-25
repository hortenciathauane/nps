import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, HelpCircle, CheckCircle2, Award } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@npsacademico.edu.br');
  const [password, setPassword] = useState('admin123');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(email);
    }, 400);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  };

  const fillAcademicDemo = () => {
    setEmail('admin@npsacademico.edu.br');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient subtle gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-indigo-500/10 via-neutral-900/50 to-neutral-900 pointer-events-none blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-indigo-400 mb-4 shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">NPS Acadêmico</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Sistema de Gestão & Pesquisa Net Promoter Score
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-neutral-700/60">
            <div>
              <h2 className="text-base font-semibold text-white">Autenticação Administrativa</h2>
              <p className="text-xs text-neutral-400">Acesse o painel de controle e métricas</p>
            </div>
            <span className="text-xs font-mono text-neutral-400 bg-neutral-900/60 px-2.5 py-1 rounded border border-neutral-700">
              v1.0
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="email">
                E-mail Administrativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@npsacademico.edu.br"
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-300" htmlFor="password">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotSent(false);
                    setForgotEmail(email);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Academic quick demonstration button */}
          <div className="mt-6 pt-5 border-t border-neutral-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Ambiente de Avaliação Acadêmica:</span>
              <button
                type="button"
                onClick={fillAcademicDemo}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Preencher Acesso Rápido
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-neutral-500">
          Uso acadêmico e institucional · Metodologia Net Promoter Score®
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Recuperar Senha</h3>
            {forgotSent ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-200">
                  Instruções enviadas para <strong>{forgotEmail}</strong>.
                </p>
                <p className="text-xs text-neutral-400 mt-2">
                  (Simulação acadêmica: você pode utilizar a senha padrão <code>admin123</code>).
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="mt-5 w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p className="text-xs text-neutral-400 mb-4">
                  Informe o seu e-mail cadastrado para receber um link de redefinição de senha.
                </p>
                <div className="mb-4">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="seu.email@instituicao.edu.br"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg cursor-pointer"
                  >
                    Enviar Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
