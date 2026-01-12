'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { mealsApi } from '@/lib/api';
import { normalizeImageOrientation } from '@/lib/image-utils';
import { 
  Upload, UtensilsCrossed, Cake, Coffee, Target, Crown, Zap, Sparkles, 
  ArrowRight, X, FileText, Scale, Droplet, Check, Ban, CreditCard, Camera,
  Infinity, ChefHat, Image as ImageIcon
} from 'lucide-react';
import PageAds from '@/components/PageAds';

type Phase = 'idle' | 'loading_image' | 'uploading';

const mealTypes = [
  { id: 'prato', label: 'Prato', icon: UtensilsCrossed, color: 'from-emerald-400 to-teal-400' },
  { id: 'sobremesa', label: 'Sobremesa', icon: Cake, color: 'from-pink-400 to-rose-400' },
  { id: 'bebida', label: 'Bebida', icon: Coffee, color: 'from-amber-400 to-orange-400' }
];

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mealType, setMealType] = useState('prato');
  const [mode, setMode] = useState<'simple' | 'full'>('full');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      <div className="flex items-center justify-center py-16">
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
    <div className="max-w-lg mx-auto pb-4">
      <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Nova Analise</h1>
              <p className="text-emerald-100">Descubra os nutrientes da sua refeicao</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {user?.plan === 'pro' && (
            <div className="mb-6 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Analises PRO restantes</span>
                </div>
                <span className="font-bold text-lg">{Math.min(user.pro_analyses_remaining, 90)}/90</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all" 
                  style={{ width: `${Math.min((user.pro_analyses_remaining / 90) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              </div>
              O que voce vai analisar?
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {mealTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMealType(type.id)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    mealType === type.id
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-100'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    mealType === type.id ? `bg-gradient-to-br ${type.color} shadow-md` : 'bg-gray-100'
                  }`}>
                    <type.icon className={`w-6 h-6 ${mealType === type.id ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${mealType === type.id ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              Tipo de analise
            </h3>
            <div className="space-y-3">
              {user?.plan !== 'pro' && (
                <button
                  onClick={() => setMode('simple')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    mode === 'simple'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-100'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      mode === 'simple' ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-md shadow-amber-200' : 'bg-gray-100'
                    }`}>
                      <Zap className={`w-7 h-7 ${mode === 'simple' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-lg ${mode === 'simple' ? 'text-emerald-700' : 'text-gray-700'}`}>
                          Analise Rapida
                        </span>
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          GRATIS
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Calorias, macros e observacoes nutricionais</p>
                    </div>
                  </div>
                </button>
              )}
              
              <button
                onClick={() => setMode('full')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  mode === 'full'
                    ? 'border-purple-400 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg shadow-purple-100'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    mode === 'full' ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-md shadow-purple-200' : 'bg-gray-100'
                  }`}>
                    <Sparkles className={`w-7 h-7 ${mode === 'full' ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-lg ${mode === 'full' ? 'text-purple-700' : 'text-gray-700'}`}>
                        Analise Completa
                      </span>
                      {user?.plan !== 'pro' && (
                        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                          12 creditos
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Tudo + sugestao visual de prato otimizado</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="mb-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              Informacoes adicionais
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none resize-none text-sm bg-white"
                  rows={2}
                />
              </div>
              
              {mealType === 'bebida' ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    Volume maximo do copo (ml)
                  </label>
                  <input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(e.target.value)}
                    placeholder="Ex: 250"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    Peso aproximado (gramas)
                  </label>
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    placeholder={mealType === 'sobremesa' ? "Ex: 300" : "Ex: 600"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-emerald-600" />
              </div>
              Foto da refeicao
            </h3>
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                    <Check className="w-4 h-4" />
                    Imagem pronta
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 text-center cursor-pointer hover:shadow-xl transition-all overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white font-medium mb-4">
                    Tire uma foto ou selecione da galeria
                  </p>
                  <div className="inline-flex items-center justify-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all">
                    <Upload className="w-5 h-5" />
                    Selecionar Imagem
                  </div>
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
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-200/50 hover:shadow-2xl hover:scale-[1.02]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Analisar Refeicao
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            {user?.plan === 'pro' 
              ? 'Analise PRO inclusa no seu plano'
              : user?.plan === 'free' && mode === 'simple' 
                ? 'Analise rapida gratuita' 
                : `Custo: ${cost} creditos - Saldo: ${user?.credit_balance || 0} creditos`
            }
          </p>
        </div>
      </div>

      {user?.plan !== 'pro' && (
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Crown className="w-7 h-7 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Seja PRO</h3>
                <p className="text-purple-100">90 analises completas por R$ 49,90/mes</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <Infinity className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-700">Analises ilimitadas todos os meses</span>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-700">Sugestao visual de prato otimizado</span>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Ban className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-700">Sem propagandas no app</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/billing')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-purple-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all"
            >
              <Crown className="w-5 h-5" />
              Assinar PRO
            </button>
          </div>
        </div>
      )}

      {user?.plan !== 'pro' && (
        <button
          onClick={() => router.push('/billing')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-amber-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all mb-6"
        >
          <CreditCard className="w-5 h-5" />
          Comprar Creditos
        </button>
      )}

      <PageAds position="bottom" />
    </div>
  );
}
