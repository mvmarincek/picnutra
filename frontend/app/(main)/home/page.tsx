'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { mealsApi } from '@/lib/api';
import { normalizeImageOrientation } from '@/lib/image-utils';
import { 
  Upload, UtensilsCrossed, Cake, Coffee, Target, Heart, Crown, Zap, Sparkles, 
  ArrowRight, X, FileText, Scale, Droplet, Check, Ban, CreditCard, Camera,
  TrendingUp, Brain, Image as ImageIcon, Salad, ChefHat, Star, Infinity,
  History, BarChart3, Leaf, Apple, Flame
} from 'lucide-react';
import PageAds from '@/components/PageAds';

type Phase = 'idle' | 'loading_image' | 'uploading';

const mealTypes = [
  { id: 'prato', label: 'Prato', icon: UtensilsCrossed, color: 'from-emerald-400 to-teal-400', bg: 'bg-emerald-50' },
  { id: 'sobremesa', label: 'Sobremesa', icon: Cake, color: 'from-pink-400 to-rose-400', bg: 'bg-pink-50' },
  { id: 'bebida', label: 'Bebida', icon: Coffee, color: 'from-amber-400 to-orange-400', bg: 'bg-amber-50' }
];

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mealType, setMealType] = useState('prato');
  const [mode, setMode] = useState<'simple' | 'full'>('simple');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [showAnalysisSection, setShowAnalysisSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { showError, showWarning, clearFeedback } = useFeedback();
  const router = useRouter();

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
      setShowAnalysisSection(true);
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch {
      setPhase('idle');
      showError(
        'Nao foi possivel processar a imagem. O formato pode nao ser suportado. Tente outra foto.',
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
    setShowAnalysisSection(false);
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
        `Voce precisa de ${cost} creditos para esta analise, mas possui apenas ${user.credit_balance}. Compre mais creditos para continuar.`,
        'Creditos insuficientes',
        {
          label: 'Comprar creditos',
          onClick: () => {
            clearFeedback();
            router.push('/billing');
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
      const errorMessage = err.message || 'Erro ao iniciar analise';
      
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('conexao') || errorMessage.toLowerCase().includes('fetch')) {
        showError(
          'Nao foi possivel conectar ao servidor. Verifique sua conexao com a internet e tente novamente.',
          'Erro de conexao',
          {
            label: 'Tentar novamente',
            onClick: () => {
              clearFeedback();
              handleAnalyze();
            }
          }
        );
      } else if (errorMessage.toLowerCase().includes('credito') || errorMessage.toLowerCase().includes('credit') || errorMessage.toLowerCase().includes('402')) {
        showWarning(
          'Voce nao possui creditos suficientes para esta analise. Compre mais creditos para continuar.',
          'Creditos insuficientes',
          {
            label: 'Comprar creditos',
            onClick: () => {
              clearFeedback();
              router.push('/billing');
            }
          }
        );
      } else {
        showError(
          errorMessage,
          'Erro ao iniciar analise',
          {
            label: 'Tentar novamente',
            onClick: () => clearFeedback()
          }
        );
      }
    }
  };

  const cost = mode === 'full' ? 12 : 5;

  if (phase === 'loading_image' || phase === 'uploading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm w-full">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Upload className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {phase === 'loading_image' ? 'Processando imagem...' : 'Enviando imagem...'}
          </h2>
          <p className="text-gray-500 mb-6">Aguarde um momento</p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 pt-8 pb-16">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full" />
        
        <div className="relative max-w-lg mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Salad className="w-5 h-5 text-emerald-100" />
            <span className="text-white font-medium">Nutri-Vision</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">
            Descubra os nutrientes<br/>da sua refeicao
          </h1>
          <p className="text-emerald-100 text-lg mb-6">
            Tire uma foto e receba uma analise nutricional completa em segundos
          </p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-3 bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            <Camera className="w-6 h-6" />
            Analisar Refeicao
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            Como funciona
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">1. Tire uma foto</h3>
                <p className="text-gray-500 text-sm">Fotografe seu prato, sobremesa ou bebida</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">2. IA analisa</h3>
                <p className="text-gray-500 text-sm">Nossa inteligencia artificial identifica os alimentos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">3. Receba os resultados</h3>
                <p className="text-gray-500 text-sm">Calorias, proteinas, carboidratos, gorduras e dicas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-3xl shadow-lg p-5 border-2 border-emerald-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">FREE</h3>
                <p className="text-xs text-emerald-600 font-medium">Gratis para sempre</p>
              </div>
            </div>
            
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                Analise rapida
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                Calorias e macros
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                Dicas nutricionais
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                Historico completo
              </li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl shadow-lg p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold">PRO</h3>
                  <p className="text-xs text-purple-200 font-medium">R$ 14,90/mes</p>
                </div>
              </div>
              
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Infinity className="w-3 h-3 text-white" />
                  </div>
                  Analises ilimitadas
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-3 h-3 text-white" />
                  </div>
                  Imagem otimizada
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-3 h-3 text-white" />
                  </div>
                  Sugestoes de prato
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Ban className="w-3 h-3 text-white" />
                  </div>
                  Sem anuncios
                </li>
              </ul>
            </div>
          </div>
        </div>

        {user?.plan !== 'pro' && (
          <button
            onClick={() => router.push('/billing')}
            className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-6"
          >
            <Crown className="w-5 h-5" />
            Assinar PRO - R$ 14,90/mes
          </button>
        )}

        <PageAds position="inline" />

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            O que voce recebe
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-4 border border-rose-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center mb-2">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Calorias</h3>
              <p className="text-xs text-gray-500">Valor energetico total</p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 border border-red-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center mb-2">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Proteinas</h3>
              <p className="text-xs text-gray-500">Para seus musculos</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center mb-2">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Carboidratos</h3>
              <p className="text-xs text-gray-500">Energia para o dia</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mb-2">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Gorduras</h3>
              <p className="text-xs text-gray-500">Gorduras boas e ruins</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center mb-2">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Fibras</h3>
              <p className="text-xs text-gray-500">Saude intestinal</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Dicas</h3>
              <p className="text-xs text-gray-500">Melhorar sua dieta</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-6 mb-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900">Analise Completa (PRO)</h3>
              <p className="text-sm text-purple-600">Exclusivo para assinantes</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            Alem de todos os nutrientes, a analise completa gera uma <strong>imagem do prato otimizado</strong> com sugestoes para tornar sua refeicao mais saudavel e equilibrada.
          </p>
          
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-200 to-purple-200 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-10 h-10 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Receba sugestoes como:</p>
              <p className="text-purple-700 font-medium text-sm mt-1">"Adicione mais vegetais e reduza o arroz para um prato mais equilibrado"</p>
            </div>
          </div>
        </div>

        {showAnalysisSection && imagePreview && (
          <div ref={analysisRef} className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-2 border-emerald-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Nova Analise
              </h2>
              <button
                onClick={clearImage}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm font-medium">Imagem pronta para analise</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                O que voce vai analisar?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {mealTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setMealType(type.id)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                      mealType === type.id
                        ? 'border-emerald-400 bg-emerald-50 shadow-md'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      mealType === type.id ? `bg-gradient-to-br ${type.color}` : 'bg-gray-100'
                    }`}>
                      <type.icon className={`w-5 h-5 ${mealType === type.id ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${mealType === type.id ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tipo de analise
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => setMode('simple')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    mode === 'simple'
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      mode === 'simple' ? 'bg-gradient-to-br from-amber-400 to-orange-400' : 'bg-gray-100'
                    }`}>
                      <Zap className={`w-6 h-6 ${mode === 'simple' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-base ${mode === 'simple' ? 'text-emerald-700' : 'text-gray-700'}`}>
                          Analise Rapida
                        </span>
                        {user?.plan === 'free' ? (
                          <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            GRATIS
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                            5 creditos
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Calorias, macros e observacoes nutricionais</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setMode('full')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    mode === 'full'
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      mode === 'full' ? 'bg-gradient-to-br from-violet-500 to-purple-500' : 'bg-gray-100'
                    }`}>
                      <Sparkles className={`w-6 h-6 ${mode === 'full' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-base ${mode === 'full' ? 'text-purple-700' : 'text-gray-700'}`}>
                          Analise Completa
                        </span>
                        <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                          12 creditos
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Tudo + sugestao visual de prato otimizado</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Observacoes (opcional)
                </label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder={mealType === 'bebida' 
                    ? "Ex: caipirinha, mojito, suco de laranja natural..." 
                    : mealType === 'sobremesa'
                    ? "Ex: pudim de leite, brownie, sorvete de chocolate..."
                    : "Ex: arroz integral, frango grelhado sem pele..."}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none resize-none text-sm"
                  rows={2}
                />
              </div>
              
              {mealType === 'bebida' ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    Volume maximo do copo (ml) - opcional
                  </label>
                  <input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(e.target.value)}
                    placeholder="Ex: 250"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    Peso aproximado (gramas) - opcional
                  </label>
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    placeholder={mealType === 'sobremesa' ? "Ex: 300" : "Ex: 600"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
            >
              Analisar Refeicao
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              {user?.plan === 'free' && mode === 'simple' 
                ? 'Analise rapida gratuita' 
                : `Custo: ${cost} creditos - Saldo: ${user?.credit_balance || 0} creditos`
              }
            </p>
          </div>
        )}

        {!showAnalysisSection && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all mb-6"
          >
            <Camera className="w-6 h-6" />
            Comecar Analise
          </button>
        )}

        <PageAds position="bottom" />

        <div className="text-center py-6">
          <p className="text-xs text-gray-400">
            Nutri-Vision usa inteligencia artificial para estimar valores nutricionais.
            <br/>Os resultados sao aproximados e nao substituem orientacao profissional.
          </p>
        </div>
      </div>
    </div>
  );
}
