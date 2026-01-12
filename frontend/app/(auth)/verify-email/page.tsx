'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

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

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verificando email...</h2>
              <p className="text-gray-500">Aguarde um momento</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email verificado!</h2>
              <p className="text-gray-500 mb-4">{message}</p>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 mb-6 border border-emerald-100">
                <p className="text-emerald-700 font-semibold">
                  Seus 36 creditos de bonus estao disponiveis!
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Fazer login
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'already_verified' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email ja verificado</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Fazer login
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-200">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na verificacao</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  Ir para login
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200/50">
          <BowlLogo className="w-10 h-10 text-white" />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
