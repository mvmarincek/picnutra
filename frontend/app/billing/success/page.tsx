'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Sparkles, Camera, TrendingUp, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/billing');
    }, 8000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
            <p className="text-gray-600">
              Seus créditos foram adicionados à sua conta com sucesso.
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              O que você pode fazer agora:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Análises Completas</p>
                  <p className="text-sm text-gray-600">Fotografe suas refeições e receba análises nutricionais detalhadas</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sugestões de Melhoria</p>
                  <p className="text-sm text-gray-600">Receba dicas personalizadas para melhorar sua alimentação</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/home')}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Fazer uma Análise
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/billing')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
            >
              Ver meus créditos
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            Redirecionando automaticamente em alguns segundos...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
