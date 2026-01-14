'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useFeedback } from '@/lib/feedback';
import { ArrowLeft, Mail, UserPlus, ArrowRight } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { showError, showSuccess, clearFeedback } = useFeedback();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setNotFound(false);
    setLoading(true);

    try {
      const result = await authApi.forgotPassword(email);
      if (result.exists === false) {
        setNotFound(true);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Erro ao enviar email';
      
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('conexão') || errorMessage.toLowerCase().includes('fetch')) {
        showError(
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          'Erro de conexão',
          {
            label: 'Tentar novamente',
            onClick: () => clearFeedback()
          }
        );
      } else {
        showError(
          errorMessage,
          'Erro ao enviar email',
          {
            label: 'Tentar novamente',
            onClick: () => clearFeedback()
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-teal-200/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-200/50">
                <BowlLogo className="w-10 h-10 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Nutrivision
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email não encontrado</h2>
            <p className="text-gray-500 mb-6">
              O email <strong className="text-gray-700">{email}</strong> não está cadastrado. Que tal criar uma conta?
            </p>
            <button
              onClick={() => router.push('/register')}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-4"
            >
              Criar conta grátis
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setNotFound(false); setEmail(''); }}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Tentar outro email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-teal-200/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-200/50">
                <BowlLogo className="w-10 h-10 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Nutrivision
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email enviado!</h2>
            <p className="text-gray-500 mb-6">
              Enviamos um link de recuperacao para <strong className="text-emerald-600">{email}</strong>. Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Link 
              href="/login" 
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Voltar para o login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-teal-200/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-200/50">
              <BowlLogo className="w-10 h-10 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Nutrivision
            </span>
          </Link>
          <p className="text-gray-500 mt-2">Recuperar senha</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          <Link href="/login" className="inline-flex items-center text-emerald-600 mb-6 hover:text-emerald-700 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>

          <p className="text-gray-500 mb-6">
            Digite seu email e enviaremos instrucoes para redefinir sua senha.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all outline-none"
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar email de recuperacao
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
