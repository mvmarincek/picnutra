'use client';

import { useRouter } from 'next/navigation';
import { XCircle, CreditCard, Shield, HelpCircle, ArrowRight } from 'lucide-react';

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Cancelado</h1>
            <p className="text-gray-600">
              O pagamento foi cancelado e nenhuma cobrança foi realizada na sua conta.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Por que isso aconteceu?
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <p>Você cancelou o pagamento antes de concluir</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <p>O tempo para pagamento expirou</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <p>Houve um problema com o método de pagamento</p>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Seus dados estão seguros</p>
                <p className="text-sm text-green-700">Nenhuma informação de pagamento foi salva ou compartilhada.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/billing')}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Tentar Novamente
            </button>
            <button
              onClick={() => router.push('/home')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              Voltar ao Início
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Precisa de ajuda? Entre em contato pelo email picnutra-contato@picnutra.com
          </p>
        </div>
      </div>
    </div>
  );
}
