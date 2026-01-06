'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { jobsApi, mealsApi, JobResponse } from '@/lib/api';
import { Loader2, Salad, ArrowRight } from 'lucide-react';

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
  const [job, setJob] = useState<JobResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [dicaAtual, setDicaAtual] = useState(0);
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const mealId = searchParams.get('mealId');

  useEffect(() => {
    setDicaAtual(Math.floor(Math.random() * dicasEMotivacao.length));
    const interval = setInterval(() => {
      setDicaAtual(prev => (prev + 1) % dicasEMotivacao.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const pollJob = useCallback(async () => {
    if (!token || !jobId || !pollingActive) return;

    try {
      const result = await jobsApi.get(token, parseInt(jobId));
      setJob(result);

      if (result.status === 'completed') {
        setPollingActive(false);
        router.push(`/result?mealId=${mealId}`);
      } else if (result.status === 'failed') {
        setPollingActive(false);
        setError(result.erro || 'Erro na análise');
      } else if (result.status === 'waiting_user') {
        setPollingActive(false);
      } else {
        setTimeout(() => pollJob(), 2000);
      }
    } catch (err: any) {
      setError(err.message);
      setPollingActive(false);
    }
  }, [token, jobId, mealId, router, pollingActive]);

  useEffect(() => {
    setPollingActive(true);
    setJob(null);
    setAnswers({});
    setError('');
    pollJob();
  }, [jobId]);

  const handleSubmitAnswers = async () => {
    if (!token || !mealId) return;
    setSubmitting(true);
    setError('');

    try {
      const result = await mealsApi.submitAnswers(token, parseInt(mealId), answers);
      setAnswers({});
      setJob(null);
      setPollingActive(true);
      
      const newUrl = `/processing?jobId=${result.job_id}&mealId=${mealId}`;
      window.history.replaceState(null, '', newUrl);
      
      const pollNewJob = async () => {
        try {
          const jobResult = await jobsApi.get(token, result.job_id);
          setJob(jobResult);

          if (jobResult.status === 'completed') {
            router.push(`/result?mealId=${mealId}`);
          } else if (jobResult.status === 'failed') {
            setError(jobResult.erro || 'Erro na análise');
            setSubmitting(false);
          } else if (jobResult.status === 'waiting_user') {
            setSubmitting(false);
          } else {
            setTimeout(pollNewJob, 2000);
          }
        } catch (err: any) {
          setError(err.message);
          setSubmitting(false);
        }
      };
      
      pollNewJob();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-amber-100">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🙏</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">Ops! Tivemos um probleminha</h2>
          <p className="text-gray-600 mb-6">
            Desculpe pelo inconveniente! Isso pode acontecer em alguns casos. 
            Por favor, tente novamente - geralmente funciona na segunda tentativa.
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

  if (job?.status === 'waiting_user' && job.questions) {
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
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setAnswers({ ...answers, [q.id]: option })}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          answers[q.id] === option
                            ? 'border-green-400 bg-green-50 text-green-700 font-medium'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                    placeholder="Digite sua resposta"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitAnswers}
            disabled={submitting || !allAnswered}
            className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              submitting || !allAnswered
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'gradient-fresh text-white hover:shadow-xl hover:shadow-green-200'
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

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-green-100">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse">
          <Salad className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-900">Analisando sua refeição...</h2>
        <p className="text-gray-500 mb-6">{job?.etapa_atual || 'Iniciando análise...'}</p>
        
        <div className="flex justify-center gap-1 mb-6">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 transition-all duration-500">
          <div className="text-3xl mb-2">{dicasEMotivacao[dicaAtual].emoji}</div>
          <p className="text-gray-700 font-medium">{dicasEMotivacao[dicaAtual].texto}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-green-100">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse">
            <Salad className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Carregando...</h2>
        </div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
