'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { profileApi, feedbackApi, billingApi, mealsApi, MealStats } from '@/lib/api';
import { Save, User, ArrowRight, Send, Lightbulb, Gift, Copy, Check, QrCode, Camera, Crown, Loader2, Flame, TrendingUp, Calendar, Trophy } from 'lucide-react';
import PageAds from '@/components/PageAds';
import BowlLogo from '@/components/BowlLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const objetivos = [
  { id: 'emagrecer', label: 'Emagrecer', emoji: '🏃' },
  { id: 'manter', label: 'Manter peso', emoji: '⚖️' },
  { id: 'ganhar_massa', label: 'Ganhar massa muscular', emoji: '💪' },
  { id: 'saude_geral', label: 'Saúde geral', emoji: '❤️' }
];

const restricoesOptions = [
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'sem_lactose', label: 'Sem lactose' },
  { id: 'sem_gluten', label: 'Sem glúten' },
  { id: 'low_carb', label: 'Low carb' },
  { id: 'sem_acucar', label: 'Sem açúcar' }
];

export default function ProfilePage() {
  const [objetivo, setObjetivo] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [alergias, setAlergias] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sugestao, setSugestao] = useState('');
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [sugestaoEnviada, setSugestaoEnviada] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [stats, setStats] = useState<MealStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();
  const { showError, showSuccess, clearFeedback } = useFeedback();
  const router = useRouter();

  const referralLink = user?.referral_code 
    ? `https://nutrivision.ai8hub.com/register?ref=${user.referral_code}` 
    : '';
  const appLink = 'https://nutrivision.ai8hub.com';

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAvatar(true);
    try {
      const profile = await profileApi.uploadAvatar(file);
      setAvatarUrl(profile.avatar_url);
      showSuccess('Foto de perfil atualizada com sucesso!', 'Foto atualizada');
    } catch (err: any) {
      showError(
        'Não foi possível enviar a foto. Tente novamente.',
        'Erro ao enviar foto',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    
    setCancelingSubscription(true);
    try {
      await billingApi.cancelSubscription();
      await refreshUser();
      setConfirmingCancel(false);
      showSuccess(
        'Sua assinatura foi cancelada. Você voltou para o plano Free.',
        'Assinatura cancelada'
      );
    } catch (err: any) {
      showError(
        err?.message || 'Não foi possível cancelar a assinatura. Tente novamente.',
        'Erro ao cancelar',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleEnviarSugestao = async () => {
    if (!sugestao.trim()) return;
    setEnviandoSugestao(true);
    
    try {
      await feedbackApi.send(sugestao);
      setSugestaoEnviada(true);
      setSugestao('');
      showSuccess('Obrigado pelo seu feedback! Sua sugestão foi enviada.', 'Sugestão enviada');
    } catch (err) {
      showError(
        'Não foi possível enviar sua sugestão. Tente novamente mais tarde.',
        'Erro ao enviar',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setEnviandoSugestao(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await refreshUser();
        const [profile, statsData] = await Promise.all([
          profileApi.get(),
          mealsApi.getStats()
        ]);
        setObjetivo(profile.objetivo || '');
        setRestricoes(profile.restricoes || []);
        setAlergias((profile.alergias || []).join(', '));
        setAvatarUrl(profile.avatar_url || null);
        setStats(statsData);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleToggleRestricao = (id: string) => {
    if (restricoes.includes(id)) {
      setRestricoes(restricoes.filter(r => r !== id));
    } else {
      setRestricoes([...restricoes, id]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    clearFeedback();

    try {
      await profileApi.update({
        objetivo,
        restricoes,
        alergias: alergias.split(',').map(a => a.trim()).filter(Boolean)
      });
      showSuccess(
        'Seu perfil foi salvo com sucesso!',
        'Perfil atualizado',
        {
          label: 'Continuar',
          onClick: () => {
            clearFeedback();
            router.push('/home');
          }
        }
      );
    } catch (err: any) {
      showError(
        err.message || 'Não foi possível salvar o perfil. Tente novamente.',
        'Erro ao salvar',
        { label: 'Tentar novamente', onClick: () => clearFeedback() }
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200">
            <BowlLogo className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce" />
        </div>
        <p className="text-emerald-700 font-medium mt-4">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
              <p className="text-emerald-100">Configure suas preferencias</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="relative w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center group shadow-lg"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl.startsWith('data:') ? avatarUrl : `${API_URL}${avatarUrl}`}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setAvatarUrl(null);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </button>
            <div className="ml-4 flex-1">
              <p className="font-semibold text-gray-900">{user?.email}</p>
              <p className="text-sm text-gray-500 capitalize">Plano {user?.plan || 'Free'}</p>
              {user?.credit_balance !== undefined && user.credit_balance > 0 && (
                <p className="text-xs text-emerald-600 font-medium">{user.credit_balance} creditos disponiveis</p>
              )}
            </div>
          </div>

          {stats && stats.total_meals > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Suas Estatisticas</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{stats.total_meals}</p>
                  <p className="text-xs text-gray-500">analises</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{stats.streak}</p>
                  <p className="text-xs text-gray-500">dias seguidos</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{stats.days_using}</p>
                  <p className="text-xs text-gray-500">dias usando</p>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Nivel: <span className="font-semibold text-gray-900">{stats.title}</span></span>
                  <span className="text-xs text-gray-500">{stats.total_meals}/{stats.next_level_at}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full h-2 transition-all duration-500" 
                    style={{ width: `${stats.progress_to_next}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <PageAds position="inline" />

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-xs">🎯</span>
              </div>
              Objetivo Nutricional
            </label>
            <div className="grid grid-cols-2 gap-3">
              {objetivos.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => setObjetivo(obj.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    objetivo === obj.id
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-100'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl mb-1 block">{obj.emoji}</span>
                  <span className={`text-sm font-medium ${objetivo === obj.id ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {obj.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-xs">🍽️</span>
              </div>
              Restricoes Alimentares
            </label>
            <div className="flex flex-wrap gap-2">
              {restricoesOptions.map((rest) => (
                <button
                  key={rest.id}
                  onClick={() => handleToggleRestricao(rest.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    restricoes.includes(rest.id)
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rest.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center">
                <span className="text-xs">⚠️</span>
              </div>
              Alergias (separadas por virgula)
            </label>
            <input
              type="text"
              value={alergias}
              onChange={(e) => setAlergias(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
              placeholder="Ex: amendoim, camarao, leite"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl hover:shadow-emerald-200 hover:scale-[1.02]'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar e Continuar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center mb-6">
        Essas informacoes ajudam a personalizar suas analises nutricionais.
      </p>

      {user?.plan === 'pro' && (
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl shadow-xl shadow-purple-200/50 p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Assinatura PRO Ativa</h3>
              <p className="text-sm text-white/80">Analises ilimitadas e beneficios exclusivos</p>
            </div>
          </div>
          
          {confirmingCancel ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-sm mb-4">
                Tem certeza? Ao cancelar, voce perdera acesso aos beneficios PRO e voltara ao plano Free.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingCancel(false)}
                  className="flex-1 py-2 rounded-xl bg-white/20 font-medium hover:bg-white/30 transition-all"
                >
                  Manter PRO
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                  className="flex-1 py-2 rounded-xl bg-red-500 font-medium hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelingSubscription ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Confirmar cancelamento'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCancelSubscription}
              className="w-full py-3 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 p-6 border border-amber-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Tem uma sugestao?</h3>
            <p className="text-sm text-gray-500">Ajude-nos a melhorar o Nutrivision</p>
          </div>
        </div>

        <textarea
          value={sugestao}
          onChange={(e) => setSugestao(e.target.value)}
          placeholder="Que funcionalidade voce gostaria de ver? Como podemos melhorar sua experiencia?"
          className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all resize-none h-24"
        />

        {sugestaoEnviada ? (
          <div className="mt-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-center font-medium flex items-center justify-center gap-2 border border-emerald-100">
            <span className="text-xl">🎉</span> Obrigado pela sugestao!
          </div>
        ) : (
          <button
            onClick={handleEnviarSugestao}
            disabled={enviandoSugestao || !sugestao.trim()}
            className={`w-full mt-4 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
              enviandoSugestao || !sugestao.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200 hover:scale-[1.02]'
            }`}
          >
            {enviandoSugestao ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Sugestao
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 p-6 border border-purple-100 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Indique Amigos</h3>
            <p className="text-sm text-gray-500">Ganhe 12 creditos por indicacao!</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Compartilhe seu link ou QR Code. Quando seu amigo se cadastrar, voce ganha 12 creditos para analises PRO!
        </p>

        {user?.referral_code ? (
          <>
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-3 mb-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Seu link de indicacao:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-white px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    linkCopiado
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-200'
                  }`}
                >
                  {linkCopiado ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl border-2 border-purple-100 inline-block shadow-lg shadow-purple-50">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(referralLink)}`}
                  alt="QR Code de Indicacao"
                  className="w-36 h-36"
                />
                <p className="text-xs text-center text-gray-500 mt-2">Escaneie para se cadastrar</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500">Carregando seu codigo de indicacao...</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100 mt-6 shadow-lg shadow-emerald-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Acesse o App</h3>
            <p className="text-sm text-gray-500">QR Code para acesso rapido</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 inline-block shadow-lg shadow-emerald-50">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appLink)}`}
              alt="QR Code do App"
              className="w-36 h-36"
            />
            <p className="text-xs text-center text-gray-500 mt-2">nutrivision.ai8hub.com</p>
          </div>
        </div>
      </div>

      <PageAds position="bottom" />
    </div>
  );
}
