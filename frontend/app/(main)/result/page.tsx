'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi, MealDetail } from '@/lib/api';
import { CheckCircle, AlertTriangle, Lightbulb, ArrowRight, Sparkles, Trophy, Heart, Flame, Zap, Target, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import PageAds from '@/components/PageAds';
import BowlLogo from '@/components/BowlLogo';

const celebrationMessages = [
  "Excelente escolha! Continue assim!",
  "Parabéns por cuidar da sua alimentação!",
  "Você está no caminho certo!",
  "Ótimo trabalho em conhecer seus alimentos!"
];

function ResultContent() {
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [celebration, setCelebration] = useState('');
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealId = searchParams.get('mealId');

  useEffect(() => {
    setCelebration(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
  }, []);

  useEffect(() => {
    if (!mealId) return;

    const fetchMeal = async () => {
      try {
        const result = await mealsApi.get(parseInt(mealId));
        setMeal(result);
        await refreshUser();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [mealId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200">
            <BowlLogo className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce" />
        </div>
        <p className="text-emerald-700 font-medium mt-4">Carregando resultado...</p>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <span className="text-4xl">😕</span>
        </div>
        <p className="text-rose-600 font-medium mb-4 text-lg">{error || 'Refeição não encontrada'}</p>
        <button 
          onClick={() => router.push('/home')} 
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const analysis = meal.analysis;
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <p className="text-gray-600 mb-4">Análise não disponível</p>
        <button 
          onClick={() => router.push('/home')} 
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nutrivision-api-dcr0.onrender.com';

  const getConfiancaInfo = (confianca: string) => {
    switch (confianca) {
      case 'alto': return { color: 'from-emerald-500 to-green-500', label: 'Alta', icon: Target };
      case 'medio': return { color: 'from-amber-500 to-orange-500', label: 'Média', icon: TrendingUp };
      default: return { color: 'from-orange-500 to-rose-500', label: 'Aproximada', icon: Zap };
    }
  };

  const confiancaInfo = getConfiancaInfo(analysis.confianca);

  return (
    <div className="pb-8 -mx-4 -mt-6">
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-5 mb-6 overflow-hidden shadow-xl shadow-emerald-200/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{celebration}</p>
              <p className="text-emerald-100 text-sm">Análise concluída com sucesso</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
          <div className="relative h-56">
            <Image
              src={`${apiUrl}${meal.image_url}`}
              alt="Refeição"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${confiancaInfo.color} text-white text-sm font-medium shadow-lg`}>
                <confiancaInfo.icon className="w-4 h-4" />
                Confiança {confiancaInfo.label}
              </div>
            </div>
          </div>

          <div className="p-6">
            <PageAds position="inline" />
            
            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-6 mb-6 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3">
                  <Flame className="w-8 h-8 text-yellow-300" />
                </div>
                <p className="text-6xl font-black text-white drop-shadow-lg">
                  {analysis.calorias.central.toFixed(0)}
                </p>
                <p className="text-emerald-100 font-medium">quilocalorias</p>
                <p className="text-emerald-200/70 text-sm mt-1">
                  Faixa: {analysis.calorias.min.toFixed(0)} - {analysis.calorias.max.toFixed(0)} kcal
                </p>
              </div>

              <div className="relative grid grid-cols-4 gap-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <div className="w-10 h-10 bg-rose-400/30 rounded-xl mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">🥩</span>
                  </div>
                  <p className="font-bold text-white text-lg">{analysis.macros.proteina_g.toFixed(0)}g</p>
                  <p className="text-emerald-100 text-xs">Proteína</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <div className="w-10 h-10 bg-amber-400/30 rounded-xl mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">🍞</span>
                  </div>
                  <p className="font-bold text-white text-lg">{analysis.macros.carbo_g.toFixed(0)}g</p>
                  <p className="text-emerald-100 text-xs">Carbos</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <div className="w-10 h-10 bg-yellow-400/30 rounded-xl mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">🧈</span>
                  </div>
                  <p className="font-bold text-white text-lg">{analysis.macros.gordura_g.toFixed(0)}g</p>
                  <p className="text-emerald-100 text-xs">Gordura</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <div className="w-10 h-10 bg-green-400/30 rounded-xl mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">🥬</span>
                  </div>
                  <p className="font-bold text-white text-lg">{(analysis.macros.fibra_g || 0).toFixed(0)}g</p>
                  <p className="text-emerald-100 text-xs">Fibra</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-base">🍽️</span>
                </div>
                Alimentos e Porções
              </h3>
              <div className="space-y-2">
                {analysis.porcoes_estimadas.map((porcao, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                    <span className="font-medium text-gray-800">{porcao.item}</span>
                    <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">
                      ~{porcao.peso_g_ml_central.toFixed(0)}g
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {analysis.beneficios.length > 0 && (
              <div className="mb-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-5 border border-emerald-100">
                <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  Pontos Positivos
                </h3>
                <ul className="space-y-3">
                  {analysis.beneficios.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                      <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </span>
                      <span className="text-emerald-800">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.pontos_de_atencao.length > 0 && (
              <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100">
                <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  Fique Atento
                </h3>
                <ul className="space-y-3">
                  {analysis.pontos_de_atencao.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                      <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </span>
                      <span className="text-amber-800">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recomendacoes_praticas.length > 0 && (
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  Dicas do Nutrivision
                </h3>
                <ul className="space-y-3">
                  {analysis.recomendacoes_praticas.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                      <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{idx + 1}</span>
                      </span>
                      <span className="text-blue-800">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.incertezas.length > 0 && (
              <details className="mb-4 bg-gray-50 rounded-2xl p-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 font-medium">
                  Ver fontes de incerteza
                </summary>
                <ul className="mt-3 text-sm text-gray-500 space-y-1">
                  {analysis.incertezas.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>

        {analysis.sugestao_melhorada_texto && (
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Versão Turbinada</h3>
                  <p className="text-purple-100">Sugestão para melhorar seu prato</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-5 leading-relaxed text-base">{analysis.sugestao_melhorada_texto}</p>

              {analysis.mudancas_sugeridas && analysis.mudancas_sugeridas.length > 0 && (
                <div className="mb-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-purple-100">
                  <p className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <BowlLogo className="w-5 h-5" />
                    Mudanças sugeridas
                  </p>
                  <ul className="space-y-2">
                    {analysis.mudancas_sugeridas.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-purple-700 bg-white/60 rounded-xl p-3">
                        <span className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-3 h-3 text-white" />
                        </span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.calorias_nova_versao && (
                <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-5 mb-5">
                  <p className="font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-300" />
                    Novos valores nutricionais
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                      <p className="font-bold text-white text-xl">{analysis.calorias_nova_versao.central.toFixed(0)}</p>
                      <p className="text-purple-100 text-xs">kcal</p>
                    </div>
                    {analysis.macros_nova_versao && (
                      <>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                          <p className="font-bold text-white text-xl">{analysis.macros_nova_versao.proteina_g.toFixed(0)}g</p>
                          <p className="text-purple-100 text-xs">Proteína</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                          <p className="font-bold text-white text-xl">{analysis.macros_nova_versao.carbo_g.toFixed(0)}g</p>
                          <p className="text-purple-100 text-xs">Carboidratos</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                          <p className="font-bold text-white text-xl">{analysis.macros_nova_versao.gordura_g.toFixed(0)}g</p>
                          <p className="text-purple-100 text-xs">Gordura</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {analysis.sugestao_melhorada_imagem_url && (
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={analysis.sugestao_melhorada_imagem_url}
                    alt="Versão melhorada"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-5 mb-4 text-center shadow-lg shadow-emerald-200/50">
          <p className="text-white font-semibold flex items-center justify-center gap-2 text-lg">
            <Heart className="w-6 h-6 text-rose-300" />
            Continue cuidando da sua saúde!
          </p>
          <p className="text-emerald-100 text-sm mt-1">Cada refeição conta na sua jornada</p>
        </div>

        <p className="text-xs text-gray-400 text-center mb-4 px-4">
          Esta análise é informativa e não substitui orientação de nutricionista ou médico.
        </p>

        <PageAds position="bottom" />

        <button
          onClick={() => router.push('/home')}
          className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all mt-4 text-lg"
        >
          Nova análise <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200">
            <BowlLogo className="w-10 h-10 text-white" />
          </div>
        </div>
        <p className="text-emerald-700 font-medium mt-4">Carregando...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
