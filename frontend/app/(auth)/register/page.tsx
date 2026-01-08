'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Salad, Gift, Mail, CheckCircle } from 'lucide-react';

function RegisterContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

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

    setLoading(true);

    try {
      await register(email, password, referralCode || undefined);
      setRegistered(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center shadow-lg">
                <Salad className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                Nutri-Vision
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifique seu email!</h2>
            <p className="text-gray-600 mb-4">
              Enviamos um link de confirmacao para:
            </p>
            <p className="font-semibold text-green-600 mb-6">{email}</p>
            <div className="bg-green-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Clique no link do email para ativar sua conta</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Nao recebeu o email? Verifique a pasta de spam.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full gradient-fresh text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Ir para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center shadow-lg">
              <Salad className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
              Nutri-Vision
            </span>
          </Link>
          <p className="text-gray-600 mt-2">Crie sua conta grátis</p>
        </div>

        {referralCode && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-purple-800">Indicado por um amigo!</p>
              <p className="text-sm text-purple-600">Seu amigo ganhará créditos quando você se cadastrar</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Digite a senha novamente"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-fresh text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary-600 hover:underline font-medium">
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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse">
          <Salad className="w-8 h-8 text-white" />
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
