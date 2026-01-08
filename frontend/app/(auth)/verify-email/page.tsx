'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Salad, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nutrivision-api-dcr0.onrender.com';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'already_verified' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificacao nao encontrado');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.already_verified) {
            setStatus('already_verified');
            setMessage('Seu email ja foi verificado anteriormente');
          } else {
            setStatus('success');
            setMessage('Email verificado com sucesso!');
          }
        } else {
          setStatus('error');
          setMessage(data.detail || 'Erro ao verificar email');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Erro de conexao. Tente novamente.');
      }
    };

    verifyEmail();
  }, [token]);

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

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verificando email...</h2>
              <p className="text-gray-600">Aguarde um momento</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email verificado!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-green-600 font-medium mb-6">
                Seus 36 creditos de bonus estao disponiveis!
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full gradient-fresh text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
              >
                Fazer login
              </button>
            </div>
          )}

          {status === 'already_verified' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email ja verificado</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full gradient-fresh text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
              >
                Fazer login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na verificacao</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full gradient-fresh text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
                >
                  Ir para login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Criar nova conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse">
          <Salad className="w-8 h-8 text-white" />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
