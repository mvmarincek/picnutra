'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { billingApi, BillingStatus, CreditPackage } from '@/lib/api';
import { CreditCard, Star, Zap, QrCode, Copy, Check, X, Crown, Loader2, ChevronLeft } from 'lucide-react';
import PageAds from '@/components/PageAds';

interface PixPaymentData {
  payment_id: string;
  pix_code: string;
  pix_qr_code_base64: string;
  value: number;
}

interface CardFormData {
  card_holder_name: string;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  holder_cpf: string;
  holder_phone: string;
  postal_code: string;
  address_number: string;
}

const initialCardForm: CardFormData = {
  card_holder_name: '',
  card_number: '',
  expiry_month: '',
  expiry_year: '',
  cvv: '',
  holder_cpf: '',
  holder_phone: '',
  postal_code: '',
  address_number: ''
};

export default function BillingPage() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [packages, setPackages] = useState<Record<string, CreditPackage>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixCpf, setPixCpf] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState<CardFormData>(initialCardForm);
  const [processingCard, setProcessingCard] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proPaymentMethod, setProPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | null>(null);
  const [proPixData, setProPixData] = useState<PixPaymentData | null>(null);
  const [processingPro, setProcessingPro] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [testingPayment, setTestingPayment] = useState(false);
  const { user, refreshUser } = useAuth();
  const { showError, showSuccess, showWarning, clearFeedback } = useFeedback();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser();
        const status = await billingApi.getStatus();
        setBillingStatus(status);
        const pkgs = await billingApi.getPackages();
        setPackages(pkgs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const paymentData = pixData || proPixData;
    if (paymentData) {
      interval = setInterval(async () => {
        try {
          setCheckingPayment(true);
          const status = await billingApi.getPaymentStatus(paymentData.payment_id);
          if (status.confirmed) {
            await refreshUser();
            const newStatus = await billingApi.getStatus();
            setBillingStatus(newStatus);
            setPixData(null);
            setProPixData(null);
            setSelectedPackage(null);
            setShowProModal(false);
            setProPaymentMethod(null);
            showSuccess(
              pixData ? 'Pagamento confirmado! Seus créditos foram adicionados.' : 'Pagamento confirmado! Sua assinatura PRO foi ativada.',
              'Pagamento confirmado'
            );
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
  }, [pixData, proPixData, refreshUser]);

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackage(pkgId);
    setPixData(null);
    setShowCardForm(false);
    setCardForm(initialCardForm);
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handlePixPayment = async () => {
    if (!selectedPackage) return;
    
    const cpfDigits = pixCpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      showWarning(
        'Por favor, informe um CPF válido com 11 dígitos.',
        'CPF obrigatório',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
      return;
    }
    
    setPurchasing(selectedPackage);

    try {
      const result = await billingApi.createPixPayment(selectedPackage, cpfDigits);
      setPixData(result);
    } catch (err) {
      console.error(err);
      showError(
        'Não foi possível gerar o código PIX. Tente novamente.',
        'Erro ao gerar PIX',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setPurchasing(null);
    }
  };

  const handleCardPayment = async () => {
    if (!selectedPackage) return;
    
    if (!cardForm.card_holder_name || !cardForm.card_number || !cardForm.expiry_month || 
        !cardForm.expiry_year || !cardForm.cvv || !cardForm.holder_cpf || 
        !cardForm.holder_phone || !cardForm.postal_code || !cardForm.address_number) {
      showWarning(
        'Por favor, preencha todos os campos obrigatórios do cartão.',
        'Campos incompletos',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
      return;
    }

    setProcessingCard(true);
    try {
      await billingApi.createCardPayment({
        package: selectedPackage,
        ...cardForm
      });
      await refreshUser();
      const newStatus = await billingApi.getStatus();
      setBillingStatus(newStatus);
      setSelectedPackage(null);
      setShowCardForm(false);
      setCardForm(initialCardForm);
      showSuccess(
        'Pagamento aprovado! Seus créditos foram adicionados à sua conta.',
        'Pagamento confirmado'
      );
    } catch (err: any) {
      console.error(err);
      showError(
        err?.message || 'Não foi possível processar o pagamento com cartão. Verifique os dados e tente novamente.',
        'Erro no pagamento',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setProcessingCard(false);
    }
  };

  const handleProSubscription = async (billingType: 'PIX' | 'CREDIT_CARD') => {
    if (billingType === 'CREDIT_CARD') {
      if (!cardForm.card_holder_name || !cardForm.card_number || !cardForm.expiry_month || 
          !cardForm.expiry_year || !cardForm.cvv || !cardForm.holder_cpf || 
          !cardForm.holder_phone || !cardForm.postal_code || !cardForm.address_number) {
        showWarning(
          'Por favor, preencha todos os campos obrigatórios do cartão.',
          'Campos incompletos',
          { label: 'Entendi', onClick: () => clearFeedback() }
        );
        return;
      }
    }

    setProcessingPro(true);
    try {
      const request: any = { billing_type: billingType };
      
      if (billingType === 'CREDIT_CARD') {
        Object.assign(request, cardForm);
      }

      const result = await billingApi.createProSubscription(request);
      
      if (result.status === 'active') {
        await refreshUser();
        const newStatus = await billingApi.getStatus();
        setBillingStatus(newStatus);
        setShowProModal(false);
        setProPaymentMethod(null);
        setCardForm(initialCardForm);
        showSuccess(
          'Sua assinatura PRO foi ativada com sucesso! Aproveite os benefícios exclusivos.',
          'Assinatura PRO ativada'
        );
      } else if (result.pix_code && result.payment_id && result.pix_qr_code_base64) {
        setProPixData({
          payment_id: result.payment_id,
          pix_code: result.pix_code,
          pix_qr_code_base64: result.pix_qr_code_base64,
          value: 49.90
        });
      }
    } catch (err: any) {
      console.error(err);
      showError(
        err?.message || 'Não foi possível criar a assinatura. Tente novamente.',
        'Erro na assinatura',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setProcessingPro(false);
    }
  };

  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const executeCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      await billingApi.cancelSubscription();
      await refreshUser();
      const newStatus = await billingApi.getStatus();
      setBillingStatus(newStatus);
      showSuccess(
        'Sua assinatura foi cancelada. Você ainda terá acesso até o final do período pago.',
        'Assinatura cancelada'
      );
    } catch (err: any) {
      console.error(err);
      showError(
        err?.message || 'Não foi possível cancelar a assinatura. Tente novamente.',
        'Erro ao cancelar',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleCancelSubscription = () => {
    showWarning(
      'Ao cancelar sua assinatura PRO, você perderá acesso aos benefícios exclusivos ao final do período atual. Tem certeza?',
      'Cancelar assinatura?',
      {
        label: 'Sim, cancelar',
        onClick: () => {
          clearFeedback();
          executeCancelSubscription();
        }
      }
    );
  };

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleTestConfirmPayment = async (paymentId: string) => {
    setTestingPayment(true);
    try {
      const result = await billingApi.testConfirmPayment(paymentId);
      await refreshUser();
      const newStatus = await billingApi.getStatus();
      setBillingStatus(newStatus);
      setPixData(null);
      setProPixData(null);
      setSelectedPackage(null);
      setShowProModal(false);
      setProPaymentMethod(null);
      showSuccess(result.message, 'Teste de Pagamento');
    } catch (err: any) {
      console.error(err);
      showError(err?.message || 'Erro ao simular pagamento', 'Erro', { label: 'Entendi', onClick: () => clearFeedback() });
    } finally {
      setTestingPayment(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedPackage(null);
    setPixData(null);
    setShowCardForm(false);
    setCardForm(initialCardForm);
  };

  const handleCloseProModal = () => {
    setShowProModal(false);
    setProPaymentMethod(null);
    setProPixData(null);
    setCardForm(initialCardForm);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 16);
  };

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 8);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce" />
        </div>
        <p className="text-emerald-700 font-medium mt-4">Carregando...</p>
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
  const isPro = billingStatus?.plan === 'pro';

  const handleCardInputChange = (field: keyof CardFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    switch (field) {
      case 'card_holder_name':
        value = value.toUpperCase();
        break;
      case 'card_number':
        value = formatCardNumber(value);
        break;
      case 'expiry_month':
        value = value.replace(/\D/g, '').slice(0, 2);
        break;
      case 'expiry_year':
        value = value.replace(/\D/g, '').slice(0, 4);
        break;
      case 'cvv':
        value = value.replace(/\D/g, '').slice(0, 4);
        break;
      case 'holder_cpf':
        value = formatCPF(value);
        break;
      case 'holder_phone':
        value = formatPhone(value);
        break;
      case 'postal_code':
        value = formatCEP(value);
        break;
    }
    setCardForm(prev => ({ ...prev, [field]: value }));
  };

  const renderCardFormFields = (forSubscription: boolean) => (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Nome no cartao"
        value={cardForm.card_holder_name}
        onChange={handleCardInputChange('card_holder_name')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <input
        type="text"
        placeholder="Numero do cartao"
        value={cardForm.card_number}
        onChange={handleCardInputChange('card_number')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Mes (MM)"
          value={cardForm.expiry_month}
          onChange={handleCardInputChange('expiry_month')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
        <input
          type="text"
          placeholder="Ano (YYYY)"
          value={cardForm.expiry_year}
          onChange={handleCardInputChange('expiry_year')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
        <input
          type="text"
          placeholder="CVV"
          value={cardForm.cvv}
          onChange={handleCardInputChange('cvv')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
      </div>
      <input
        type="text"
        placeholder="CPF (somente numeros)"
        value={cardForm.holder_cpf}
        onChange={handleCardInputChange('holder_cpf')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <input
        type="text"
        placeholder="Telefone (somente numeros)"
        value={cardForm.holder_phone}
        onChange={handleCardInputChange('holder_phone')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="CEP"
          value={cardForm.postal_code}
          onChange={handleCardInputChange('postal_code')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
        <input
          type="text"
          placeholder="Numero"
          value={cardForm.address_number}
          onChange={handleCardInputChange('address_number')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
      </div>
      <button
        onClick={() => forSubscription ? handleProSubscription('CREDIT_CARD') : handleCardPayment()}
        disabled={processingCard || processingPro}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
      >
        {(processingCard || processingPro) ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {forSubscription ? 'Assinar com Cartao' : 'Pagar com Cartao'}
          </>
        )}
      </button>
    </div>
  );

  const PixDisplay = ({ data, onCopy, checking }: { data: PixPaymentData; onCopy: () => void; checking: boolean }) => (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          {data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-lg shadow-emerald-50">
          <img
            src={`data:image/png;base64,${data.pix_qr_code_base64}`}
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
            value={data.pix_code}
            className="flex-1 bg-gray-50 px-3 py-2 rounded-xl border-2 border-gray-100 text-xs truncate"
          />
          <button
            onClick={onCopy}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
              pixCopied
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
        {checking ? (
          <p className="text-sm text-amber-700 flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></span>
            Verificando pagamento...
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            Aguardando pagamento... A pagina atualizara automaticamente.
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
        <p className="text-xs text-gray-400 text-center mb-2">Modo de teste (apenas para desenvolvimento)</p>
        <button
          onClick={() => handleTestConfirmPayment(data.payment_id)}
          disabled={testingPayment}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {testingPayment ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Simulando...
            </>
          ) : (
            'Simular Pagamento Confirmado'
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{isPro ? 'Meu Plano' : 'Creditos'}</h1>
              <p className="text-emerald-100">Gerencie seu plano e créditos</p>
            </div>
          </div>
        </div>
      </div>

      {isPro && billingStatus?.has_subscription && (
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-xl shadow-purple-200/50 p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Você é PRO!</h2>
              <p className="text-sm text-white/90">Aproveite todos os benefícios exclusivos</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Análises completas restantes</span>
              <span className="font-bold text-lg">{Math.min(billingStatus.pro_analyses_remaining, 90)}/90</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all" 
                style={{ width: `${Math.min((billingStatus.pro_analyses_remaining / 90) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-white/70 mt-2">Renova todo mês automaticamente</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs">Análises simples</p>
              <p className="font-bold">Ilimitadas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs">Suporte</p>
              <p className="font-bold">Prioritário</p>
            </div>
          </div>
          
          <button
            onClick={handleCancelSubscription}
            disabled={cancelingSubscription}
            className="w-full py-3 rounded-xl bg-red-500/80 text-white text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {cancelingSubscription ? 'Cancelando...' : 'Cancelar assinatura'}
          </button>
        </div>
      )}

      {isPro && (
        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-2xl p-6 mb-6 border border-purple-200 shadow-lg shadow-purple-100/50">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Assinante PRO</h3>
              <p className="text-sm text-gray-600">Aproveite todos os benefícios exclusivos</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white/80 rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-gray-800">Análises Simples</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">Ilimitadas</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-gray-800">Análises PRO</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{Math.min(billingStatus?.pro_analyses_remaining || 90, 90)}<span className="text-sm font-normal text-gray-500">/mês</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800">Você não precisa comprar créditos! Tudo está incluído no seu plano.</p>
          </div>
        </div>
      )}

      {!isPro && (
        <>
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 p-6 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Seu saldo</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{billingStatus?.credit_balance || 0}</p>
                <p className="text-sm text-gray-500">créditos</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Plano atual</p>
                <p className="font-semibold capitalize text-gray-900">
                  {billingStatus?.plan || 'Free'}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-sm text-gray-600 mb-2">Custo por análise:</p>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm font-medium text-emerald-600">Simples: Grátis</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-amber-500 mr-1" />
                  <span className="text-sm">Completa: 12 créditos</span>
                </div>
              </div>
            </div>
          </div>

          <PageAds position="inline" />

          <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-xl shadow-purple-200/50 p-6 mb-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Plano PRO</h2>
                <p className="text-sm opacity-90">Análises simples ilimitadas</p>
              </div>
            </div>
            <p className="text-3xl font-bold mb-2">R$ 49,90<span className="text-lg font-normal">/mês</span></p>
            <ul className="text-sm mb-4 space-y-1 text-white/90">
              <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Análises simples ilimitadas</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 60 análises completas por mês</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Suporte prioritário</li>
            </ul>
            <button
              onClick={() => setShowProModal(true)}
              className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold hover:bg-purple-50 hover:scale-[1.02] transition-all shadow-lg"
            >
              Assinar PRO
            </button>
          </div>

          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            Comprar Créditos
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {packageOrder.map((pkgId) => {
              const pkg = displayPackages[pkgId];
              if (!pkg) return null;
              const isPopular = pkgId === '36';
              
              return (
                <button
                  key={pkgId}
                  onClick={() => handleSelectPackage(pkgId)}
                  className={`bg-white rounded-2xl shadow-lg p-4 relative text-left transition-all hover:shadow-xl hover:scale-[1.02] ${
                    isPopular ? 'border-2 border-emerald-400 shadow-emerald-100' : 'border border-gray-100'
                  } ${selectedPackage === pkgId ? 'ring-2 ring-emerald-400 shadow-emerald-100' : ''}`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                      Popular
                    </span>
                  )}
                  <div className="text-center mb-3">
                    <p className="text-2xl font-bold text-gray-900">{pkg.credits}</p>
                    <p className="text-gray-500 text-sm">créditos</p>
                  </div>
                  <p className="text-center text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                    {formatPrice(pkg.price)}
                  </p>
                  <p className="text-center text-xs text-gray-500">
                    {Math.floor(pkg.credits / 12)} análise(s) completa(s)
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {!isPro && selectedPackage && !pixData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Forma de Pagamento</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Pacote: <strong className="text-emerald-600">{displayPackages[selectedPackage]?.credits} créditos</strong> - {formatPrice(displayPackages[selectedPackage]?.price || 0)}
            </p>

            {!showCardForm ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF (obrigatorio para PIX)
                  </label>
                  <input
                    type="text"
                    value={pixCpf}
                    onChange={(e) => setPixCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
                  />
                </div>
                
                <button
                  onClick={handlePixPayment}
                  disabled={purchasing === selectedPackage}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  <QrCode className="w-5 h-5" />
                  {purchasing === selectedPackage ? 'Gerando PIX...' : 'Pagar com PIX'}
                </button>
                
                <div className="relative flex items-center my-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="px-3 text-xs text-gray-400">ou</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                
                <button
                  onClick={() => setShowCardForm(true)}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg shadow-purple-200"
                >
                  <CreditCard className="w-5 h-5" />
                  Pagar com Cartao
                </button>
                
                <p className="text-center text-xs text-gray-400">
                  Pagamento seguro - créditos liberados na hora
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowCardForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                {renderCardFormFields(false)}
              </>
            )}
          </div>
        </div>
      )}

      {!isPro && pixData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pague com PIX</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <PixDisplay data={pixData} onCopy={() => handleCopyPix(pixData.pix_code)} checking={checkingPayment} />
          </div>
        </div>
      )}

      {showProModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                Assinar PRO
              </h3>
              <button onClick={handleCloseProModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
              R$ 49,90<span className="text-base font-normal text-gray-500">/mes</span>
            </p>

            {!proPaymentMethod && !proPixData && (
              <div className="space-y-3">
                <button
                  onClick={() => setProPaymentMethod('PIX')}
                  disabled={processingPro}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  <QrCode className="w-5 h-5" />
                  Assinar com PIX
                </button>

                <button
                  onClick={() => setProPaymentMethod('CREDIT_CARD')}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg shadow-purple-200"
                >
                  <CreditCard className="w-5 h-5" />
                  Assinar com Cartao
                </button>

                <p className="text-center text-xs text-gray-400">
                  Cobranca mensal automatica. Cancele quando quiser.
                </p>
              </div>
            )}

            {proPaymentMethod === 'PIX' && !proPixData && (
              <>
                <button
                  onClick={() => setProPaymentMethod(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF (obrigatorio para PIX)
                    </label>
                    <input
                      type="text"
                      value={pixCpf}
                      onChange={(e) => setPixCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      const cpfDigits = pixCpf.replace(/\D/g, '');
                      if (cpfDigits.length !== 11) {
                        showWarning('Por favor, informe um CPF valido com 11 digitos.', 'CPF obrigatorio', { label: 'Entendi', onClick: () => clearFeedback() });
                        return;
                      }
                      setProcessingPro(true);
                      try {
                        const result = await billingApi.createProSubscription({ billing_type: 'PIX', holder_cpf: cpfDigits });
                        console.log('PIX subscription result:', result);
                        if (result.pix_code && result.payment_id && result.pix_qr_code_base64) {
                          setProPixData({
                            payment_id: result.payment_id,
                            pix_code: result.pix_code,
                            pix_qr_code_base64: result.pix_qr_code_base64,
                            value: 49.90
                          });
                        } else if (result.status === 'pending' && !result.pix_code) {
                          showError('O PIX ainda esta sendo gerado. Aguarde alguns segundos e tente novamente.', 'Aguarde', { label: 'Entendi', onClick: () => clearFeedback() });
                        }
                      } catch (err: any) {
                        console.error(err);
                        showError(err?.message || 'Nao foi possivel gerar o PIX. Tente novamente.', 'Erro', { label: 'Entendi', onClick: () => clearFeedback() });
                      } finally {
                        setProcessingPro(false);
                      }
                    }}
                    disabled={processingPro}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                  >
                    <QrCode className="w-5 h-5" />
                    {processingPro ? 'Gerando PIX...' : 'Gerar PIX'}
                  </button>
                </div>
              </>
            )}

            {proPaymentMethod === 'CREDIT_CARD' && !proPixData && (
              <>
                <button
                  onClick={() => setProPaymentMethod(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                {renderCardFormFields(true)}
              </>
            )}

            {proPixData && (
              <PixDisplay data={proPixData} onCopy={() => handleCopyPix(proPixData.pix_code)} checking={checkingPayment} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
