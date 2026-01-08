'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { jobsApi, mealsApi, JobResponse } from '@/lib/api';
import { Salad, ArrowRight } from 'lucide-react';

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
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-amber-100">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🙏</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">Ops! Tivemos um probleminha</h2>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'Desculpe pelo inconveniente! Por favor, tente novamente.'}
          </p>
          <button
            onClick={() => router.push('/home')}
            className="gradient-fresh text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
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
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <span className="text-2xl">🤔</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Perguntas Rápidas</h2>
              <p className="text-sm text-gray-500">Para uma análise mais precisa</p>
            </div>
          </div>

          <div className="space-y-6">
            {job.questions.map((q, idx) => (
              <div key={q.id} className="bg-gray-50 rounded-2xl p-4">
                <p className="font-medium text-gray-900 mb-3 flex items-start gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
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
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300'
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
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-green-400 focus:outline-none"
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
                ? 'gradient-fresh text-white hover:shadow-xl'
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
    );
  }

  const dica = dicasEMotivacao[dicaAtual];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-green-100">
        <div className="w-20 h-20 rounded-full gradient-fresh flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Salad className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Analisando sua refeição...</h2>
        <p className="text-gray-500 mb-6">Nossa IA está identificando os alimentos e calculando os nutrientes</p>
        
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-green-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dica.emoji}</span>
            <p className="text-sm text-gray-700 text-left">{dica.texto}</p>
          </div>
        </div>

        {job?.etapa_atual && (
          <div className="mt-6 text-sm text-gray-500">
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
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Salad className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
