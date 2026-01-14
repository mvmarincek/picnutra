'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Lock, CheckCircle, ArrowRight } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!token) {
      setError('Token inválido');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Senha alterada!</h2>
            <p className="text-gray-500 mb-6">
              Sua senha foi redefinida com sucesso. Agora você pode fazer login com a nova senha.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Ir para o login
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-teal-200/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="w-full max-w-md relative">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <span className="text-4xl">😕</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link invalido</h2>
            <p className="text-gray-500 mb-6">
              Este link de recuperacao e invalido ou expirou.
            </p>
            <Link href="/forgot-password" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Solicitar novo link
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
          <p className="text-gray-500 mt-2">Criar nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nova senha</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all outline-none"
                placeholder="Minimo 6 caracteres"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar nova senha</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all outline-none"
                placeholder="Digite novamente"
                required
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
                Salvando...
              </>
            ) : (
              <>
                Redefinir senha
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200/50">
          <BowlLogo className="w-10 h-10 text-white" />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
