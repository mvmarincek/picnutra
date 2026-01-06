'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi, MealDetail } from '@/lib/api';
import { CheckCircle, AlertTriangle, Lightbulb, ArrowRight, Sparkles, Trophy, Heart, Flame, Salad } from 'lucide-react';
import Image from 'next/image';

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
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealId = searchParams.get('mealId');

  useEffect(() => {
    setCelebration(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
  }, []);

  useEffect(() => {
    if (!token || !mealId) return;

    const fetchMeal = async () => {
      try {
        const result = await mealsApi.get(token, parseInt(mealId));
        setMeal(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [token, mealId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse mb-4">
          <Salad className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">Carregando resultado...</p>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-red-500 mb-4">{error || 'Refeição não encontrada'}</p>
        <button 
          onClick={() => router.push('/home')} 
          className="gradient-fresh text-white px-6 py-2 rounded-full"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const analysis = meal.analysis;
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Análise não disponível</p>
        <button 
          onClick={() => router.push('/home')} 
          className="gradient-fresh text-white px-6 py-2 rounded-full"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nutrivision-api-dcr0.onrender.com';

  const getConfiancaInfo = (confianca: string) => {
    switch (confianca) {
      case 'alto': return { color: 'text-green-600 bg-green-100', label: 'Alta', emoji: '🎯' };
      case 'medio': return { color: 'text-amber-600 bg-amber-100', label: 'Média', emoji: '📊' };
      default: return { color: 'text-orange-600 bg-orange-100', label: 'Aproximada', emoji: '📐' };
    }
  };

  const confiancaInfo = getConfiancaInfo(analysis.confianca);

  const getCalorieEmoji = (calorias: number) => {
    if (calorias < 400) return '🥗';
    if (calorias < 700) return '🍽️';
    return '🍛';
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <p className="font-semibold text-green-800">{celebration}</p>
          <p className="text-sm text-green-600">Análise concluída com sucesso</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border border-green-100">
        <div className="relative h-52">
          <Image
            src={`${apiUrl}${meal.image_url}`}
            alt="Refeição"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 mb-6 border border-green-100">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-3xl">{getCalorieEmoji(analysis.calorias.central)}</span>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                {analysis.calorias.central.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">quilocalorias</p>
              <p className="text-xs text-gray-400 mt-1">
                Faixa estimada: {analysis.calorias.min.toFixed(0)} - {analysis.calorias.max.toFixed(0)} kcal
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="w-8 h-8 bg-red-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                  <span className="text-sm">🥩</span>
                </div>
                <p className="font-bold text-gray-900">{analysis.macros.proteina_g.toFixed(0)}g</p>
                <p className="text-xs text-gray-500">Proteína</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="w-8 h-8 bg-amber-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                  <span className="text-sm">🍞</span>
                </div>
                <p className="font-bold text-gray-900">{analysis.macros.carbo_g.toFixed(0)}g</p>
                <p className="text-xs text-gray-500">Carbos</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                  <span className="text-sm">🧈</span>
                </div>
                <p className="font-bold text-gray-900">{analysis.macros.gordura_g.toFixed(0)}g</p>
                <p className="text-xs text-gray-500">Gordura</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="w-8 h-8 bg-green-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                  <span className="text-sm">🥬</span>
                </div>
                <p className="font-bold text-gray-900">{(analysis.macros.fibra_g || 0).toFixed(0)}g</p>
                <p className="text-xs text-gray-500">Fibra</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">🍽️</span> Alimentos e Porções
            </h3>
            <div className="space-y-2">
              {analysis.porcoes_estimadas.map((porcao, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">{porcao.item}</span>
                  <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full">
                    ~{porcao.peso_g_ml_central.toFixed(0)}g
                  </span>
                </div>
              ))}
            </div>
          </div>

          {analysis.beneficios.length > 0 && (
            <div className="mb-6 bg-green-50 rounded-2xl p-4 border border-green-100">
              <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Pontos Positivos
              </h3>
              <ul className="space-y-2">
                {analysis.beneficios.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-green-800">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.pontos_de_atencao.length > 0 && (
            <div className="mb-6 bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Fique Atento
              </h3>
              <ul className="space-y-2">
                {analysis.pontos_de_atencao.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">!</span>
                    <span className="text-amber-800">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recomendacoes_praticas.length > 0 && (
            <div className="mb-6 bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-500" /> Dicas do Nutri-Vision
              </h3>
              <ul className="space-y-2">
                {analysis.recomendacoes_praticas.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-blue-800">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.incertezas.length > 0 && (
            <details className="mb-4">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Ver fontes de incerteza
              </summary>
              <ul className="mt-2 text-sm text-gray-500 pl-4">
                {analysis.incertezas.map((i, idx) => (
                  <li key={idx} className="list-disc">{i}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      {analysis.sugestao_melhorada_texto && (
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-vitality flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Versão Turbinada</h3>
              <p className="text-sm text-gray-500">Sugestão para melhorar seu prato</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4 leading-relaxed">{analysis.sugestao_melhorada_texto}</p>

          {analysis.mudancas_sugeridas && analysis.mudancas_sugeridas.length > 0 && (
            <div className="mb-4 bg-purple-50 rounded-xl p-4">
              <p className="font-medium text-purple-800 mb-2">Mudanças sugeridas:</p>
              <ul className="space-y-1">
                {analysis.mudancas_sugeridas.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-purple-700">
                    <span>→</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.calorias_nova_versao && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <p className="font-medium text-purple-800 mb-3">Novos valores nutricionais:</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="font-bold text-purple-600">{analysis.calorias_nova_versao.central.toFixed(0)} kcal</p>
                  <p className="text-xs text-gray-500">Calorias</p>
                </div>
                {analysis.macros_nova_versao && (
                  <>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="font-bold text-purple-600">{analysis.macros_nova_versao.proteina_g.toFixed(0)}g</p>
                      <p className="text-xs text-gray-500">Proteína</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="font-bold text-purple-600">{analysis.macros_nova_versao.carbo_g.toFixed(0)}g</p>
                      <p className="text-xs text-gray-500">Carboidratos</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="font-bold text-purple-600">{analysis.macros_nova_versao.gordura_g.toFixed(0)}g</p>
                      <p className="text-xs text-gray-500">Gordura</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {analysis.sugestao_melhorada_imagem_url && (
            <div className="mt-4">
              <img
                src={analysis.sugestao_melhorada_imagem_url}
                alt="Versão melhorada"
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-2xl p-4 mb-4 text-center">
        <p className="text-green-800 font-medium flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Continue cuidando da sua saúde! Cada refeição conta.
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center mb-4">
        Esta análise é informativa e não substitui orientação de nutricionista ou médico.
      </p>

      <button
        onClick={() => router.push('/home')}
        className="w-full gradient-fresh text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
      >
        Nova análise <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse mb-4">
          <Salad className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
