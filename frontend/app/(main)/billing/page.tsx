'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { billingApi, BillingStatus, CreditPackage } from '@/lib/api';
import { CreditCard, Star, Zap } from 'lucide-react';

export default function BillingPage() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [packages, setPackages] = useState<Record<string, CreditPackage>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { token, user, updateUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          const status = await billingApi.getStatus(token);
          setBillingStatus(status);
        }
        const pkgs = await billingApi.getPackages();
        setPackages(pkgs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleBuyCredits = async (packageId: string) => {
    if (!token) return;
    setPurchasing(packageId);

    try {
      const result = await billingApi.createCreditCheckout(token, packageId);
      window.location.href = result.checkout_url;
    } catch (err) {
      console.error(err);
      setPurchasing(null);
    }
  };

  const handleSubscribePro = async () => {
    if (!token) return;
    setPurchasing('pro');

    try {
      const result = await billingApi.createProCheckout(token);
      window.location.href = result.checkout_url;
    } catch (err) {
      console.error(err);
      setPurchasing(null);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const packageOrder = ['50', '100', '300', '1000'];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Créditos e Assinatura</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Seu saldo</p>
            <p className="text-3xl font-bold text-primary-600">{billingStatus?.credit_balance || 0}</p>
            <p className="text-sm text-gray-500">créditos</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Plano atual</p>
            <p className="font-semibold capitalize">{billingStatus?.plan || 'Free'}</p>
            {billingStatus?.pro_analyses_remaining ? (
              <p className="text-sm text-gray-500">
                {billingStatus.pro_analyses_remaining} análises Pro restantes
              </p>
            ) : null}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Custo por análise:</p>
          <div className="flex gap-4">
            <div className="flex items-center">
              <Zap className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-600">Simples: Grátis</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-primary-500 mr-1" />
              <span className="text-sm">Completa: 12 créditos</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Comprar Créditos</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {packageOrder.map((pkgId) => {
          const pkg = packages[pkgId];
          if (!pkg) return null;
          const isPopular = pkgId === '100';
          
          return (
            <div
              key={pkgId}
              className={`bg-white rounded-xl shadow-md p-6 relative ${
                isPopular ? 'border-2 border-primary-500' : ''
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold">{pkg.credits}</p>
                <p className="text-gray-600">créditos</p>
              </div>
              <p className="text-center text-2xl font-semibold text-primary-600 mb-4">
                {formatPrice(pkg.price)}
              </p>
              <p className="text-center text-sm text-gray-500 mb-4">
                {formatPrice(Math.round(pkg.price / pkg.credits * 100) / 100)}/crédito
              </p>
              <button
                onClick={() => handleBuyCredits(pkgId)}
                disabled={purchasing === pkgId}
                className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50"
              >
                {purchasing === pkgId ? 'Processando...' : 'Comprar'}
              </button>
            </div>
          );
        })}
      </div>

      {billingStatus?.plan !== 'pro' && (
        <>
          <h2 className="text-lg font-semibold mb-4">Assinatura Pro</h2>
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Star className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold">Nutri-Vision Pro</h3>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="mr-2">-</span>
                Analises completas ilimitadas
              </li>
              <li className="flex items-center">
                <span className="mr-2">-</span>
                Sem anuncios
              </li>
              <li className="flex items-center">
                <span className="mr-2">-</span>
                Acesso a todos os recursos premium
              </li>
            </ul>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">R$ 49,90</p>
                <p className="text-sm opacity-80">/mes</p>
              </div>
              <button
                onClick={handleSubscribePro}
                disabled={purchasing === 'pro'}
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
              >
                {purchasing === 'pro' ? 'Processando...' : 'Assinar Pro'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
