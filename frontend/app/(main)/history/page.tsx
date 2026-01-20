'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi, MealListItem, MealStats, profileApi } from '@/lib/api';
import Image from 'next/image';
import { Calendar, Trash2, Camera, TrendingUp, Award, Flame, Target, Zap, Trophy, Star, ChevronRight, Share2, Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PageAds from '@/components/PageAds';

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealListItem[]>([]);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealsResult, statsResult] = await Promise.all([
          mealsApi.list(),
          mealsApi.getStats()
        ]);
        setMeals(mealsResult);
        setStats(statsResult);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (mealId: number) => {
    if (!confirm('Excluir esta análise?')) return;

    try {
      await mealsApi.delete(mealId);
      setMeals(meals.filter(m => m.id !== mealId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateShareLink = async () => {
    setGeneratingLink(true);
    try {
      const result = await profileApi.generateShareToken();
      setShareUrl(result.share_url);
      setShowShareModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case 'prato': return 'Prato';
      case 'sobremesa': return 'Sobremesa';
      case 'bebida': return 'Bebida';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Concluído', color: 'bg-green-100 text-green-700' };
      case 'analyzing': return { label: 'Analisando', color: 'bg-yellow-100 text-yellow-700' };
      case 'failed': return { label: 'Erro', color: 'bg-red-100 text-red-700' };
      default: return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce" />
        </div>
        <p className="text-emerald-700 font-medium mt-4">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Histórico de Análises</h1>
                <p className="text-emerald-100">Acompanhe sua jornada nutricional</p>
              </div>
            </div>
            <button
              onClick={handleGenerateShareLink}
              disabled={generatingLink}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Compartilhar histórico"
            >
              {generatingLink ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Share2 className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showShareModal && shareUrl && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Compartilhar Histórico</h3>
              <p className="text-gray-500 text-sm mt-1">Envie para seu nutricionista visualizar suas análises</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 flex justify-center mb-4">
              <QRCodeSVG value={shareUrl} size={160} level="M" />
            </div>

            <div className="bg-gray-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Link público:</p>
              <p className="text-sm text-gray-700 break-all font-mono">{shareUrl}</p>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Link copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copiar link
                </>
              )}
            </button>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 mt-2 text-gray-500 font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {stats && stats.total_meals > 0 && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-5 text-white mb-4 shadow-lg shadow-emerald-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Seu nível</p>
                  <p className="text-xl font-bold">{stats.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.total_meals}</p>
                <p className="text-sm opacity-90">análises</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full h-2 mb-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500" 
                style={{ width: `${stats.progress_to_next}%` }}
              />
            </div>
            <p className="text-xs opacity-80">
              {stats.level < 5 ? `${stats.next_level_at - stats.total_meals} análises para o proximo nivel` : 'Nivel maximo alcancado!'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 shadow-lg shadow-gray-100/50 border border-gray-100 text-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.streak}</p>
              <p className="text-xs text-gray-500">dias seguidos</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-lg shadow-gray-100/50 border border-gray-100 text-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.meals_this_week}</p>
              <p className="text-xs text-gray-500">esta semana</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-lg shadow-gray-100/50 border border-gray-100 text-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto mb-2">
                <Target className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.avg_calorias}</p>
              <p className="text-xs text-gray-500">kcal média</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-lg shadow-gray-100/50 border border-gray-100 text-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.days_using}</p>
              <p className="text-xs text-gray-500">dias usando</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg shadow-gray-100/50 border border-gray-100 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-xs">📊</span>
              </div>
              Médias nutricionais
            </p>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mx-auto mb-1">
                  <span className="text-sm">🥩</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{stats.avg_proteina}g</p>
                <p className="text-xs text-gray-400">prot</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mx-auto mb-1">
                  <span className="text-sm">🍞</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{stats.avg_carbo}g</p>
                <p className="text-xs text-gray-400">carbo</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mx-auto mb-1">
                  <span className="text-sm">🧈</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{stats.avg_gordura}g</p>
                <p className="text-xs text-gray-400">gord</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mx-auto mb-1">
                  <span className="text-sm">🌾</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{stats.avg_fibra}g</p>
                <p className="text-xs text-gray-400">fibra</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center mx-auto mb-1">
                  <Flame className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">{stats.avg_calorias}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
            </div>
          </div>

          {stats.best_day && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 flex items-center justify-between shadow-lg shadow-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Seu melhor dia</p>
                  <p className="text-sm text-gray-600">{stats.best_day} é o dia que você mais usa o app!</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {meals.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Comece sua jornada nutricional</h2>
          <p className="text-gray-600 mb-6">Voce ainda nao tem análises. Tire uma foto da sua refeicao e descubra informacoes nutricionais detalhadas!</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-left">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-2 shadow-md shadow-emerald-200">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Fotografe</h3>
              <p className="text-xs text-gray-600">Tire uma foto do seu prato</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-2 shadow-md shadow-cyan-200">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Analise</h3>
              <p className="text-xs text-gray-600">IA identifica nutrientes</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2 shadow-md shadow-amber-200">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Melhore</h3>
              <p className="text-xs text-gray-600">Receba dicas personalizadas</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/home')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all"
          >
            Fazer primeira análise
          </button>
        </div>
      ) : (
        <>
          <PageAds position="top" />
          <div className="space-y-4">
            {meals.map((meal, index) => {
              const status = getStatusLabel(meal.status);
              return (
                <div key={meal.id}>
                  {index > 0 && index % 3 === 0 && (
                    <div className="mb-4">
                      <PageAds position="inline" />
                    </div>
                  )}
                  <div
                    className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 overflow-hidden flex border border-gray-100 hover:shadow-xl hover:scale-[1.01] transition-all"
                  >
                    <div
                      className="relative w-24 h-24 flex-shrink-0 cursor-pointer"
                      onClick={() => meal.status === 'completed' && router.push(`/result?mealId=${meal.id}`)}
                    >
                      <Image
                        src={meal.image_url?.startsWith('http') ? meal.image_url : `${apiUrl}${meal.image_url}`}
                        alt="Refeicao"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{getMealTypeLabel(meal.meal_type)}</p>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(meal.created_at)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {meal.calorias_central && (
                          <p className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {meal.calorias_central.toFixed(0)} kcal
                          </p>
                        )}
                        <div className="flex gap-2">
                          {meal.status === 'completed' && (
                            <button
                              onClick={() => router.push(`/result?mealId=${meal.id}`)}
                              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                            >
                              Ver detalhes
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(meal.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <PageAds position="bottom" />
        </>
      )}
    </div>
  );
}
