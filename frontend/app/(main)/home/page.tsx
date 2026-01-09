'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { mealsApi } from '@/lib/api';
import { normalizeImageOrientation } from '@/lib/image-utils';
import { Upload, UtensilsCrossed, Cake, Coffee, Target, Heart, Crown, Zap, Sparkles, ArrowRight, X, FileText, Scale, Droplet, ChevronDown, ChevronUp } from 'lucide-react';
import PageAds from '@/components/PageAds';

type Phase = 'idle' | 'loading_image' | 'uploading';

const mealTypes = [
  { id: 'prato', label: 'Prato', icon: UtensilsCrossed, color: 'from-green-400 to-teal-400' },
  { id: 'sobremesa', label: 'Sobremesa', icon: Cake, color: 'from-pink-400 to-rose-400' },
  { id: 'bebida', label: 'Bebida', icon: Coffee, color: 'from-amber-400 to-orange-400' }
];

const motivationalMessages = [
  "Cada escolha conta! Vamos descobrir juntos os nutrientes do seu prato.",
  "Conhecimento é poder! Entenda o que você está alimentando seu corpo.",
  "Você está no caminho certo! Consciência alimentar é o primeiro passo.",
  "Parabéns por cuidar da sua saúde! Vamos analisar sua refeição.",
  "Sua jornada de bem-estar começa com pequenas escolhas diárias."
];

const tips = [
  "Dica: Pratos coloridos geralmente são mais nutritivos!",
  "Sabia? Mastigar devagar melhora a digestão e saciedade.",
  "Lembre-se: Hidratação é fundamental para o metabolismo.",
  "Fato: Proteínas ajudam a manter a saciedade por mais tempo."
];

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mealType, setMealType] = useState('prato');
  const [mode, setMode] = useState<'simple' | 'full'>('simple');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [tip, setTip] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { showError, showWarning, clearFeedback } = useFeedback();
  const router = useRouter();

  useEffect(() => {
    setMotivationalMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhase('loading_image');
    clearFeedback();
    setImageFile(null);
    setImagePreview(null);

    try {
      const { normalizedFile, previewBase64 } = await normalizeImageOrientation(file);
      setImageFile(normalizedFile);
      setImagePreview(previewBase64);
      setPhase('idle');
    } catch {
      setPhase('idle');
      showError(
        'Não foi possível processar a imagem. O formato pode não ser suportado. Tente outra foto.',
        'Erro ao processar imagem',
        {
          label: 'Tentar outra foto',
          onClick: () => {
            clearFeedback();
            fileInputRef.current?.click();
          }
        }
      );
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setPhase('idle');
    clearFeedback();
    setUserNotes('');
    setWeightGrams('');
    setVolumeMl('');
    setShowOptionalFields(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    const isFreeSimple = user?.plan === 'free' && mode === 'simple';
    const cost = mode === 'full' ? 12 : 5;
    
    if (!isFreeSimple && user && user.credit_balance < cost && user.pro_analyses_remaining <= 0) {
      showWarning(
        `Você precisa de ${cost} créditos para esta análise, mas possui apenas ${user.credit_balance}. Compre mais créditos para continuar.`,
        'Créditos insuficientes',
        {
          label: 'Comprar créditos',
          onClick: () => {
            clearFeedback();
            router.push('/credits');
          }
        }
      );
      return;
    }

    setPhase('uploading');
    clearFeedback();

    try {
      const uploadOptions: { userNotes?: string; weightGrams?: number; volumeMl?: number } = {};
      if (userNotes.trim()) {
        uploadOptions.userNotes = userNotes.trim();
      }
      if (mealType === 'bebida' && volumeMl) {
        uploadOptions.volumeMl = parseFloat(volumeMl);
      } else if (weightGrams) {
        uploadOptions.weightGrams = parseFloat(weightGrams);
      }
      const uploadResult = await mealsApi.upload(imageFile, mealType, uploadOptions);
      const analyzeResult = await mealsApi.analyze(uploadResult.meal_id, mode);
      router.push(`/processing?jobId=${analyzeResult.job_id}&mealId=${uploadResult.meal_id}`);
    } catch (err: any) {
      setPhase('idle');
      const errorMessage = err.message || 'Erro ao iniciar análise';
      
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('conexão') || errorMessage.toLowerCase().includes('fetch')) {
        showError(
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
          'Erro de conexão',
          {
            label: 'Tentar novamente',
            onClick: () => {
              clearFeedback();
              handleAnalyze();
            }
          }
        );
      } else if (errorMessage.toLowerCase().includes('crédito') || errorMessage.toLowerCase().includes('credit') || errorMessage.toLowerCase().includes('402')) {
        showWarning(
          'Você não possui créditos suficientes para esta análise. Compre mais créditos para continuar.',
          'Créditos insuficientes',
          {
            label: 'Comprar créditos',
            onClick: () => {
              clearFeedback();
              router.push('/credits');
            }
          }
        );
      } else {
        showError(
          errorMessage,
          'Erro ao iniciar análise',
          {
            label: 'Tentar novamente',
            onClick: () => clearFeedback()
          }
        );
      }
    }
  };

  const cost = mode === 'full' ? 12 : 5;

  if (phase === 'loading_image') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-green-100">
          <div className="w-20 h-20 rounded-full gradient-fresh flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processando imagem...</h2>
          <p className="text-gray-500 mb-6">Aguarde um momento</p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-green-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'uploading') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-green-100">
          <div className="w-20 h-20 rounded-full gradient-fresh flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enviando imagem...</h2>
          <p className="text-gray-500 mb-6">Aguarde enquanto preparamos sua análise</p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-green-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-teal-100 px-4 py-2 rounded-full mb-4">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-medium text-green-700">{motivationalMessage}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-green-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl gradient-fresh flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nova Análise</h1>
            <p className="text-sm text-gray-500">Descubra os nutrientes da sua refeição</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            O que você vai analisar?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {mealTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setMealType(type.id)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  mealType === type.id
                    ? 'border-green-400 bg-green-50 shadow-md'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mealType === type.id ? `bg-gradient-to-br ${type.color}` : 'bg-gray-100'
                }`}>
                  <type.icon className={`w-5 h-5 ${mealType === type.id ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <span className={`text-sm font-medium ${mealType === type.id ? 'text-green-700' : 'text-gray-600'}`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Tipo de análise
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('simple')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                mode === 'simple'
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-5 h-5 ${mode === 'simple' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <span className={`font-semibold ${mode === 'simple' ? 'text-green-700' : 'text-gray-700'}`}>
                  Rápida
                </span>
              </div>
              <p className="text-xs text-gray-500">Calorias e macros</p>
              {user?.plan === 'free' ? (
                <div className="mt-2 inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                  Grátis
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  5 créditos
                </div>
              )}
            </button>
            <button
              onClick={() => setMode('full')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                mode === 'full'
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                PRO
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`w-5 h-5 ${mode === 'full' ? 'text-purple-500' : 'text-gray-400'}`} />
                <span className={`font-semibold ${mode === 'full' ? 'text-purple-700' : 'text-gray-700'}`}>
                  Completa
                </span>
              </div>
              <p className="text-xs text-gray-500">+ Sugestão visual</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                12 créditos
              </div>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="font-medium">Informacoes adicionais (opcional)</span>
          </button>
          
          {showOptionalFields && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Observacoes
                </label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Ex: arroz integral, frango grelhado sem pele..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none resize-none text-sm"
                  rows={2}
                />
              </div>
              
              {mealType === 'bebida' ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    Volume maximo do copo (ml)
                  </label>
                  <input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(e.target.value)}
                    placeholder="Ex: 300"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    Peso aproximado (gramas)
                  </label>
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    placeholder="Ex: 250"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full"
              />
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-center text-sm text-gray-500 mt-3 pb-2">
                Imagem pronta para análise
              </p>
            </div>
          ) : (
            <div 
              className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-dashed border-green-200 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-gray-600 mb-4">
                Tire uma foto ou selecione da galeria
              </p>
              <div className="inline-flex items-center justify-center gap-2 gradient-fresh text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all">
                <Upload className="w-5 h-5" />
                Selecionar Imagem
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!imageFile}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            imageFile
              ? 'gradient-fresh text-white hover:shadow-xl hover:shadow-green-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Analisar Refeição
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {user?.plan === 'free' && mode === 'simple' 
            ? 'Análise rápida gratuita' 
            : `Custo: ${cost} créditos • Saldo: ${user?.credit_balance} créditos`
          }
        </p>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
        <p className="text-sm text-amber-800 flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>{tip}</span>
        </p>
      </div>

      <PageAds position="bottom" />
    </div>
  );
}
