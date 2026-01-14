'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { jobsApi, mealsApi, JobResponse } from '@/lib/api';
import { ArrowRight } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

type Phase = 'processing' | 'waiting_user' | 'done' | 'error';

const dicasEMotivacao = [
  { emoji: "🥗", texto: "Comer devagar ajuda na digestão e aumenta a saciedade!" },
  { emoji: "💧", texto: "Beba água antes das refeições - hidratação é essencial!" },
  { emoji: "🌈", texto: "Quanto mais cores no prato, mais nutrientes você consome!" },
  { emoji: "🥦", texto: "Vegetais crus preservam mais vitaminas que os cozidos." },
  { emoji: "💪", texto: "Proteína em cada refeição ajuda a manter a massa muscular." },
  { emoji: "🍋", texto: "Vitamina C ajuda na absorção de ferro dos vegetais." },
  { emoji: "🥑", texto: "Gorduras boas são essenciais para absorver vitaminas A, D, E e K." },
  { emoji: "🌿", texto: "Ervas frescas adicionam sabor sem calorias extras!" },
  { emoji: "🍎", texto: "Uma maçã por dia? A fibra ajuda no funcionamento intestinal." },
  { emoji: "🥚", texto: "Ovos são uma das proteínas mais completas da natureza." },
  { emoji: "⭐", texto: "Você está fazendo um ótimo trabalho cuidando da sua saúde!" },
  { emoji: "🎯", texto: "Pequenas mudanças diárias geram grandes resultados!" },
  { emoji: "🔥", texto: "Seu metabolismo agradece quando você come regularmente." },
  { emoji: "🧠", texto: "Ômega-3 encontrado em peixes é ótimo para o cérebro!" },
  { emoji: "🌅", texto: "Café da manhã nutritivo dá energia para o dia todo." },
  { emoji: "🥜", texto: "Um punhado de castanhas é um lanche perfeito e saudável." },
  { emoji: "🍵", texto: "Chás naturais são ótimos para digestão após as refeições." },
  { emoji: "🏃", texto: "Alimentação + movimento = combinação perfeita para saúde!" },
  { emoji: "😴", texto: "Dormir bem também influencia nas escolhas alimentares." },
  { emoji: "🙌", texto: "Parabéns por registrar suas refeições! Autoconhecimento é poder." },
];

function ProcessingContent() {
  const [phase, setPhase] = useState<Phase>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dicaAtual, setDicaAtual] = useState(0);
  useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const mealId = searchParams.get('mealId');
  const currentJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    setDicaAtual(Math.floor(Math.random() * dicasEMotivacao.length));
    const tipInterval = setInterval(() => {
      setDicaAtual(prev => (prev + 1) % dicasEMotivacao.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    currentJobIdRef.current = jobId;
    setPhase('processing');
    setErrorMessage(null);
    setJob(null);
    setAnswers({});

    const checkStatus = async () => {
      if (currentJobIdRef.current !== jobId) return;

      try {
        const result = await jobsApi.get(parseInt(jobId));
        
        if (currentJobIdRef.current !== jobId) return;

        setJob(result);

        if (result.status === 'completed') {
          setPhase('done');
          router.push(`/result?mealId=${mealId}`);
        } else if (result.status === 'failed') {
          setPhase('error');
          setErrorMessage(result.erro || 'Erro na análise');
        } else if (result.status === 'waiting_user') {
          setPhase('waiting_user');
        }
      } catch (err: any) {
        if (currentJobIdRef.current === jobId) {
          setPhase('error');
          setErrorMessage(err.message);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1500);

    return () => {
      clearInterval(interval);
    };
  }, [jobId, mealId, router]);

  const handleSubmitAnswers = async () => {
    if (!mealId) return;
    
    setSubmitting(true);
    setPhase('processing');
    setErrorMessage(null);

    try {
      const result = await mealsApi.submitAnswers(parseInt(mealId), answers);
      router.replace(`/processing?jobId=${result.job_id}&mealId=${mealId}`);
    } catch (err: any) {
      setPhase('error');
      setErrorMessage(err.message);
      setSubmitting(false);
    }
  };

  if (phase === 'error') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 text-center overflow-hidden">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-100">
            <span className="text-3xl">🙏</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">Ops! Tivemos um probleminha</h2>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'Desculpe pelo inconveniente! Por favor, tente novamente.'}
          </p>
          <button
            onClick={() => router.push('/home')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'waiting_user' && job?.questions) {
    const allAnswered = job.questions.every(q => answers[q.id]);
    
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden">
          <div className="relative bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl">🤔</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Perguntas Rápidas</h2>
                <p className="text-sm text-white/90">Para uma análise mais precisa</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {job.questions.map((q, idx) => (
                <div key={q.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-100">
                  <p className="font-medium text-gray-900 mb-3 flex items-start gap-2">
                    <span className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      {idx + 1}
                    </span>
                    {q.question}
                  </p>
                  {q.options ? (
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`p-3 rounded-xl text-sm font-medium transition-all ${
                            answers[q.id] === opt
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="Digite sua resposta..."
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmitAnswers}
              disabled={!allAnswered || submitting}
              className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                allAnswered && !submitting
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl hover:shadow-emerald-200 hover:scale-[1.02]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Processando...
                </>
              ) : (
                <>
                  Continuar Análise
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dica = dicasEMotivacao[dicaAtual];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 text-center overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 animate-pulse shadow-xl shadow-emerald-200">
          <BowlLogo className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Analisando sua refeição...</h2>
        <p className="text-gray-500 mb-6">Nossa IA está identificando os alimentos e calculando os nutrientes</p>
        
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-bounce shadow-md"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dica.emoji}</span>
            <p className="text-sm text-gray-700 text-left">{dica.texto}</p>
          </div>
        </div>

        {job?.etapa_atual && (
          <div className="mt-6 text-sm text-emerald-600 font-medium bg-emerald-50 px-4 py-2 rounded-full inline-block">
            {job.etapa_atual}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <BowlLogo className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
