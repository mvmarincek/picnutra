'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi } from '@/lib/api';
import { Upload, UtensilsCrossed, Cake, Coffee, Target, Heart, Crown, Zap, Sparkles, ArrowRight } from 'lucide-react';
import AdBanner from '@/components/AdBanner';
import PageAds from '@/components/PageAds';

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
  const [mealType, setMealType] = useState('prato');
  const [mode, setMode] = useState<'simple' | 'full'>('simple');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [tip, setTip] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMotivationalMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  const clearImage = () => {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setError('');
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !token) return;

    const isFreeSimple = user?.plan === 'free' && mode === 'simple';
    const cost = mode === 'full' ? 12 : 5;
    
    if (!isFreeSimple && user && user.credit_balance < cost && user.pro_analyses_remaining <= 0) {
      setError(`Créditos insuficientes. Você precisa de ${cost} créditos.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadResult = await mealsApi.upload(token, file, mealType);
      const analyzeResult = await mealsApi.analyze(token, uploadResult.meal_id, mode);
      
      router.push(`/processing?jobId=${analyzeResult.job_id}&mealId=${uploadResult.meal_id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar análise');
      setLoading(false);
    }
  };

  const cost = mode === 'full' ? 12 : 5;

  return (
    <div className="max-w-lg mx-auto">
      <PageAds slot="HOME_BANNER" position="top" />

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

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-sm flex items-start gap-3">
            <span className="text-lg">😕</span>
            <span>{error}</span>
          </div>
        )}

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

        {preview ? (
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full"
                onError={() => {
                  clearImage();
                  setError('Formato de imagem não suportado. Tente outro arquivo.');
                }}
              />
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              Imagem pronta para análise
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-dashed border-green-200 rounded-2xl p-8 text-center">
              <p className="text-gray-600 mb-4">
                Tire uma foto ou selecione da galeria
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 gradient-fresh text-white px-6 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-green-200 transition-all"
              >
                <Upload className="w-5 h-5" />
                Selecionar Imagem
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            file && !loading
              ? 'gradient-fresh text-white hover:shadow-xl hover:shadow-green-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Analisando...
            </>
          ) : (
            <>
              Analisar Refeição
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {user?.plan === 'free' && mode === 'simple' 
            ? 'Análise rápida gratuita' 
            : `Custo: ${cost} créditos • Saldo: ${user?.credit_balance} créditos`
          }
        </p>
      </div>

      <PageAds slot="HOME_BANNER" position="bottom" />

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
        <p className="text-sm text-amber-800 flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>{tip}</span>
        </p>
      </div>
    </div>
  );
}
