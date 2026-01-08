'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { profileApi, feedbackApi } from '@/lib/api';
import { Save, User, ArrowRight, Salad, Send, Lightbulb, Gift, Copy, Check, QrCode } from 'lucide-react';
import AdBanner from '@/components/AdBanner';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sugestao, setSugestao] = useState('');
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [sugestaoEnviada, setSugestaoEnviada] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const { token, user, updateUser } = useAuth();
  const router = useRouter();

  const referralLink = user?.referral_code 
    ? `https://nutrivision-drab.vercel.app/register?ref=${user.referral_code}` 
    : '';
  const appLink = 'https://nutrivision-drab.vercel.app';

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    }
  };

  const handleEnviarSugestao = async () => {
    if (!token || !sugestao.trim()) return;
    setEnviandoSugestao(true);
    
    try {
      await feedbackApi.send(token, sugestao);
      setSugestaoEnviada(true);
      setSugestao('');
      setTimeout(() => setSugestaoEnviada(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setEnviandoSugestao(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const profile = await profileApi.get(token);
        setObjetivo(profile.objetivo || '');
        setRestricoes(profile.restricoes || []);
        setAlergias((profile.alergias || []).join(', '));
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleToggleRestricao = (id: string) => {
    if (restricoes.includes(id)) {
      setRestricoes(restricoes.filter(r => r !== id));
    } else {
      setRestricoes([...restricoes, id]);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError('');

    try {
      await profileApi.update(token, {
        objetivo,
        restricoes,
        alergias: alergias.split(',').map(a => a.trim()).filter(Boolean)
      });
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse mb-4">
          <Salad className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

      <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-green-100">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div className="ml-4 flex-1">
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">Plano {user?.plan || 'Free'}</p>
            {user?.credit_balance && user.credit_balance > 0 && (
              <p className="text-xs text-green-600 font-medium">{user.credit_balance} créditos disponíveis</p>
            )}
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
            Objetivo Nutricional
          </label>
          <div className="grid grid-cols-2 gap-3">
            {objetivos.map((obj) => (
              <button
                key={obj.id}
                onClick={() => setObjetivo(obj.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  objetivo === obj.id
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-xl mb-1 block">{obj.emoji}</span>
                <span className={`text-sm font-medium ${objetivo === obj.id ? 'text-green-700' : 'text-gray-600'}`}>
                  {obj.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Restrições Alimentares
          </label>
          <div className="flex flex-wrap gap-2">
            {restricoesOptions.map((rest) => (
              <button
                key={rest.id}
                onClick={() => handleToggleRestricao(rest.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  restricoes.includes(rest.id)
                    ? 'gradient-fresh text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rest.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Alergias (separadas por vírgula)
          </label>
          <input
            type="text"
            value={alergias}
            onChange={(e) => setAlergias(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all"
            placeholder="Ex: amendoim, camarão, leite"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            saving
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'gradient-fresh text-white hover:shadow-xl hover:shadow-green-200'
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

      <p className="text-sm text-gray-500 text-center mb-6">
        Essas informações ajudam a personalizar suas análises nutricionais.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-6 border border-amber-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Tem uma sugestão?</h3>
            <p className="text-sm text-gray-500">Ajude-nos a melhorar o Nutri-Vision</p>
          </div>
        </div>

        <textarea
          value={sugestao}
          onChange={(e) => setSugestao(e.target.value)}
          placeholder="Que funcionalidade você gostaria de ver? Como podemos melhorar sua experiência?"
          className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all resize-none h-24"
        />

        {sugestaoEnviada ? (
          <div className="mt-4 py-3 rounded-2xl bg-green-50 text-green-700 text-center font-medium flex items-center justify-center gap-2">
            <span className="text-xl">🎉</span> Obrigado pela sugestão!
          </div>
        ) : (
          <button
            onClick={handleEnviarSugestao}
            disabled={enviandoSugestao || !sugestao.trim()}
            className={`w-full mt-4 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
              enviandoSugestao || !sugestao.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
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
                Enviar Sugestão
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Indique Amigos</h3>
            <p className="text-sm text-gray-500">Ganhe 12 creditos por indicacao!</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Compartilhe seu link ou QR Code. Quando seu amigo se cadastrar, voce ganha 12 creditos para analises PRO!
        </p>

        {user?.referral_code && (
          <>
            <div className="bg-gray-50 rounded-2xl p-3 mb-4">
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
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
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
              <div className="bg-white p-4 rounded-2xl border-2 border-purple-100 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(referralLink)}`}
                  alt="QR Code de Indicacao"
                  className="w-36 h-36"
                />
                <p className="text-xs text-center text-gray-500 mt-2">Escaneie para se cadastrar</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-3xl p-6 border border-green-100 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl gradient-fresh flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Acesse o App</h3>
            <p className="text-sm text-gray-500">QR Code para acesso rapido</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-2xl border-2 border-green-100 inline-block">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appLink)}`}
              alt="QR Code do App"
              className="w-36 h-36"
            />
            <p className="text-xs text-center text-gray-500 mt-2">nutrivision-drab.vercel.app</p>
          </div>
        </div>
      </div>

      {user?.plan === 'free' && (
        <div className="mt-6">
          <AdBanner slot="PROFILE_BANNER" format="horizontal" className="rounded-2xl overflow-hidden" />
        </div>
      )}
    </div>
  );
}
