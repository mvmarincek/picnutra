'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

let globalErrorModal = {
  open: false,
  title: '',
  message: '',
  listeners: new Set<() => void>()
};

function setGlobalError(title: string, message: string) {
  globalErrorModal.open = true;
  globalErrorModal.title = title;
  globalErrorModal.message = message;
  globalErrorModal.listeners.forEach(fn => fn());
}

function clearGlobalError() {
  globalErrorModal.open = false;
  globalErrorModal.title = '';
  globalErrorModal.message = '';
  globalErrorModal.listeners.forEach(fn => fn());
}

function subscribeToGlobalError(fn: () => void): () => void {
  globalErrorModal.listeners.add(fn);
  return () => {
    globalErrorModal.listeners.delete(fn);
  };
}

function useGlobalErrorModal() {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    return subscribeToGlobalError(() => forceUpdate(n => n + 1));
  }, []);
  
  return {
    open: globalErrorModal.open,
    title: globalErrorModal.title,
    message: globalErrorModal.message
  };
}

function ErrorModal() {
  const { open, title, message } = useGlobalErrorModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white border border-red-100"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-red-500 to-rose-500 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {title}
            </h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">
            {message}
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => clearGlobalError()}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const errorState = useGlobalErrorModal();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (globalErrorModal.open) {
      return;
    }
    
    setLoading(true);

    try {
      await login(email, password);
      router.push('/home');
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Erro ao fazer login';
      
      let title = 'Erro ao fazer login';
      let message = errorMessage;
      
      if (errorMessage.toLowerCase().includes('senha') || errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('incorrect') || errorMessage.toLowerCase().includes('invalid')) {
        title = 'Senha incorreta';
        message = 'A senha informada está incorreta. Verifique e tente novamente.';
      } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('user') || errorMessage.toLowerCase().includes('not found')) {
        title = 'Email não encontrado';
        message = 'Não encontramos uma conta com este email. Verifique o email ou crie uma nova conta.';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('conexão') || errorMessage.toLowerCase().includes('fetch')) {
        title = 'Erro de conexão';
        message = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
      } else if (errorMessage.toLowerCase().includes('expirada') || errorMessage.toLowerCase().includes('expired')) {
        title = 'Sessão expirada';
        message = 'Sua sessão expirou. Faça login novamente.';
      }
      
      setGlobalError(title, message);
    }
  }, [email, password, login, router]);

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
          <p className="text-gray-500 mt-2">Entre na sua conta</p>
        </div>

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
                disabled={loading || errorState.open}
              />
            </div>
          </div>

          <div className="mb-6">
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
                placeholder="Sua senha"
                required
                disabled={loading || errorState.open}
              />
            </div>
            <div className="text-right mt-2">
              <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Esqueci minha senha
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || errorState.open}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center mt-6 text-gray-500">
            Nao tem conta?{' '}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>

      <ErrorModal />
    </div>
  );
}
