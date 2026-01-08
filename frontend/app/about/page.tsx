'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Sparkles, Shield, Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/home" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl gradient-fresh flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">NutriVision</h1>
            <p className="text-gray-500 mt-1">Estimativas nutricionais com inteligência artificial</p>
          </div>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Nossa Missão
              </h2>
              <p>
                O NutriVision foi criado para ajudar pessoas a entenderem melhor o que estão comendo. 
                Utilizando inteligência artificial avançada, oferecemos estimativas nutricionais 
                aproximadas a partir de fotos de refeições, tornando a consciência alimentar mais 
                acessível e prática.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Como Funciona
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Você tira uma foto da sua refeição</li>
                <li>Nossa IA analisa a imagem e identifica os alimentos</li>
                <li>Geramos estimativas de calorias, proteínas, carboidratos e gorduras</li>
                <li>Você recebe dicas e sugestões para melhorar suas escolhas</li>
              </ol>
            </section>

            <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Aviso Importante
              </h2>
              <p className="text-amber-900 text-sm">
                O NutriVision fornece <strong>estimativas aproximadas</strong> baseadas em análise de imagem. 
                Os valores apresentados são médias e podem variar conforme ingredientes, porções e preparo. 
                <strong> Este serviço não substitui orientação profissional de nutricionistas ou médicos.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Tecnologia</h2>
              <p>
                Utilizamos modelos de inteligência artificial de última geração para análise de imagens, 
                combinados com bases de dados nutricionais para gerar estimativas. Nossa tecnologia 
                está em constante evolução para aprimorar nossas estimativas.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Contato
              </h2>
              <p>
                Dúvidas, sugestões ou problemas? Entre em contato conosco:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> contato@nutrivision.app
              </p>
            </section>

            <section className="pt-4 border-t border-gray-100">
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <Link href="/privacy" className="hover:text-green-600">Política de Privacidade</Link>
                <Link href="/terms" className="hover:text-green-600">Termos de Uso</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
