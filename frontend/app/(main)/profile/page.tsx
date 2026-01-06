'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { profileApi } from '@/lib/api';
import { Save, User, ArrowRight, Salad } from 'lucide-react';

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
  const { token, user } = useAuth();
  const router = useRouter();

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
          <div className="ml-4">
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">Plano {user?.plan || 'Free'}</p>
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

      <p className="text-sm text-gray-500 text-center">
        Essas informações ajudam a personalizar suas análises nutricionais.
      </p>
    </div>
  );
}
