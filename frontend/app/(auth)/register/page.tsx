'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { Gift, Mail, CheckCircle, Lock, ArrowRight, User } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

function RegisterContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register } = useAuth();
  const { showError, showWarning, clearFeedback } = useFeedback();
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!acceptedTerms) {
      showWarning(
        'Para criar sua conta, você precisa aceitar os Termos de Uso e a Política de Privacidade.',
        'Aceite os termos',
        {
          label: 'Entendi',
          onClick: () => clearFeedback()
        }
      );
      return;
    }

    if (password !== confirmPassword) {
      showError(
        'As senhas digitadas não são iguais. Por favor, verifique e tente novamente.',
        'Senhas não coincidem',
        {
          label: 'Corrigir',
          onClick: () => {
            clearFeedback();
            setConfirmPassword('');
          }
        }
      );
      return;
    }

    if (password.length < 6) {
      showError(
        'Por segurança, sua senha precisa ter pelo menos 6 caracteres.',
        'Senha muito curta',
        {
          label: 'Corrigir',
          onClick: () => {
            clearFeedback();
            setPassword('');
            setConfirmPassword('');
          }
        }
      );
      return;
    }

    setLoading(true);

    try {
      await register(email, password, referralCode || undefined);
      setRegistered(true);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Erro ao criar conta';
      
      if (errorMessage.toLowerCase().includes('email') && (errorMessage.toLowerCase().includes('exist') || errorMessage.toLowerCase().includes('já') || errorMessage.toLowerCase().includes('already'))) {
        showError(
          'Já existe uma conta cadastrada com este email. Tente fazer login ou use outro email.',
          'Email já cadastrado',
          {
            label: 'Ir para login',
            onClick: () => {
              clearFeedback();
              router.push('/login');
            }
          }
        );
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('conexão') || errorMessage.toLowerCase().includes('fetch')) {
        showError(
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          'Erro de conexão',
          {
            label: 'Tentar novamente',
            onClick: () => {
              clearFeedback();
            }
          }
        );
      } else {
        showError(
          errorMessage,
          'Erro ao criar conta',
          {
            label: 'Tentar novamente',
            onClick: () => clearFeedback()
          }
        );
      }
    }
  };

  if (registered) {
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifique seu email!</h2>
            <p className="text-gray-500 mb-4">
              Enviamos um link de confirmação para:
            </p>
            <p className="font-semibold text-emerald-600 mb-6">{email}</p>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 mb-6 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Clique no link do email para ativar sua conta</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Não recebeu o email? Verifique a pasta de spam.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Ir para login
              <ArrowRight className="w-5 h-5" />
            </button>
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
          <p className="text-gray-500 mt-2">Crie sua conta grátis</p>
        </div>

        {referralCode && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-lg shadow-violet-100/50">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-violet-800">Indicado por um amigo!</p>
              <p className="text-sm text-violet-600">Seu amigo ganhará créditos quando você se cadastrar</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          <div className="mb-5">
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

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all outline-none"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar Senha</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all outline-none"
                placeholder="Digite a senha novamente"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                disabled={loading}
              />
              <span className="text-sm text-gray-600">
                Li e aceito os{' '}
                <Link href="/terms" target="_blank" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link href="/privacy" target="_blank" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Politica de Privacidade
                </Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                Criar Conta Gratis
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-gray-500 mt-6">
            Ja tem uma conta?{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200/50">
          <BowlLogo className="w-10 h-10 text-white" />
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
