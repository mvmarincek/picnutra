'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { billingApi, BillingStatus, CreditPackage } from '@/lib/api';
import { CreditCard, Star, Zap, QrCode, Copy, Check, X } from 'lucide-react';

interface PixPaymentData {
  payment_id: string;
  pix_code: string;
  pix_qr_code_base64: string;
  value: number;
}

export default function BillingPage() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [packages, setPackages] = useState<Record<string, CreditPackage>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const { token, user, refreshUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          await refreshUser();
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pixData && token) {
      interval = setInterval(async () => {
        try {
          setCheckingPayment(true);
          const status = await billingApi.getPaymentStatus(token, pixData.payment_id);
          if (status.confirmed) {
            await refreshUser();
            const newStatus = await billingApi.getStatus(token);
            setBillingStatus(newStatus);
            setPixData(null);
            setSelectedPackage(null);
            setPaymentMethod(null);
            alert('Pagamento confirmado! Seus créditos foram adicionados.');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingPayment(false);
        }
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pixData, token, refreshUser]);

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackage(pkgId);
    setPaymentMethod(null);
    setPixData(null);
  };

  const handlePixPayment = async () => {
    if (!token || !selectedPackage) return;
    setPurchasing(selectedPackage);

    try {
      const result = await billingApi.createPixPayment(token, selectedPackage);
      setPixData(result);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar pagamento PIX');
    } finally {
      setPurchasing(null);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.pix_code) {
      navigator.clipboard.writeText(pixData.pix_code);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setSelectedPackage(null);
    setPaymentMethod(null);
    setPixData(null);
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  const packageOrder = ['12', '36', '60', '120'];

  const defaultPackages: Record<string, CreditPackage> = {
    '12': { credits: 12, price: 490 },
    '36': { credits: 36, price: 1290 },
    '60': { credits: 60, price: 1990 },
    '120': { credits: 120, price: 3490 }
  };

  const displayPackages = Object.keys(packages).length > 0 ? packages : defaultPackages;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Creditos</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Seu saldo</p>
            <p className="text-3xl font-bold text-green-600">{billingStatus?.credit_balance || 0}</p>
            <p className="text-sm text-gray-500">creditos</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Plano atual</p>
            <p className="font-semibold capitalize">{billingStatus?.plan || 'Free'}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Custo por analise:</p>
          <div className="flex gap-4">
            <div className="flex items-center">
              <Zap className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-600">Simples: 1 credito</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-sm">Completa: 12 creditos</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Comprar Creditos</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {packageOrder.map((pkgId) => {
          const pkg = displayPackages[pkgId];
          if (!pkg) return null;
          const isPopular = pkgId === '36';
          
          return (
            <button
              key={pkgId}
              onClick={() => handleSelectPackage(pkgId)}
              className={`bg-white rounded-xl shadow-md p-4 relative text-left transition-all hover:shadow-lg ${
                isPopular ? 'border-2 border-green-500' : 'border border-gray-200'
              } ${selectedPackage === pkgId ? 'ring-2 ring-green-400' : ''}`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <div className="text-center mb-3">
                <p className="text-2xl font-bold">{pkg.credits}</p>
                <p className="text-gray-600 text-sm">creditos</p>
              </div>
              <p className="text-center text-xl font-semibold text-green-600 mb-1">
                {formatPrice(pkg.price)}
              </p>
              <p className="text-center text-xs text-gray-500">
                {Math.floor(pkg.credits / 12)} analise(s) completa(s)
              </p>
            </button>
          );
        })}
      </div>

      {selectedPackage && !pixData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Forma de Pagamento</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Pacote: <strong>{displayPackages[selectedPackage]?.credits} creditos</strong> - {formatPrice(displayPackages[selectedPackage]?.price || 0)}
            </p>

            <div className="space-y-3">
              <button
                onClick={handlePixPayment}
                disabled={purchasing === selectedPackage}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                <QrCode className="w-5 h-5" />
                {purchasing === selectedPackage ? 'Gerando PIX...' : 'Pagar com PIX'}
              </button>
              
              <p className="text-center text-xs text-gray-400">
                Pagamento instantaneo - creditos liberados na hora
              </p>
            </div>
          </div>
        </div>
      )}

      {pixData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Pague com PIX</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-green-600">
                {pixData.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-xl border-2 border-green-100">
                <img
                  src={`data:image/png;base64,${pixData.pix_qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Ou copie o codigo PIX:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.pix_code}
                  className="flex-1 bg-gray-50 px-3 py-2 rounded-lg border text-xs truncate"
                />
                <button
                  onClick={handleCopyPix}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    pixCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              {checkingPayment ? (
                <p className="text-sm text-yellow-700 flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></span>
                  Verificando pagamento...
                </p>
              ) : (
                <p className="text-sm text-yellow-700">
                  Aguardando pagamento... A pagina atualizara automaticamente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
