'use client';

import Link from 'next/link';
import { Sparkles, Heart, TrendingUp, Shield, Apple, Salad, Flame, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

const motivationalQuotes = [
  "Cada refeição é uma oportunidade de nutrir seu corpo",
  "Pequenas escolhas diárias criam grandes transformações",
  "Alimentação consciente é autocuidado em ação"
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 border-b border-green-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-fresh flex items-center justify-center">
              <Salad className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
              Nutri-Vision
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-green-600 font-medium">
              Entrar
            </Link>
            <Link 
              href="/register" 
              className="gradient-fresh text-white px-5 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-green-200 transition-all"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="gradient-hero pt-28 pb-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Powered by AI - Análise em segundos</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transforme sua relação com a 
              <span className="bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent"> alimentação</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Fotografe sua refeição e descubra exatamente o que está nutrindo seu corpo. 
              Receba orientações personalizadas para alcançar seus objetivos de saúde.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link 
                href="/register"
                className="group gradient-fresh text-white text-lg px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-green-200 transition-all flex items-center gap-2"
              >
                Começar Jornada Gratuita
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>36 créditos grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Resultados em segundos</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex justify-center gap-4">
            <div className="animate-float" style={{ animationDelay: '0s' }}>
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shadow-lg">
                <Apple className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center shadow-lg">
                <Salad className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div className="animate-float" style={{ animationDelay: '1s' }}>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que cuidar da sua alimentação?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Uma alimentação equilibrada é a base para uma vida plena e saudável
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-3xl card-hover">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <Flame className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mais Energia</h3>
              <p className="text-gray-600 leading-relaxed">
                Alimentos nutritivos fornecem combustível de qualidade para seu dia a dia, 
                aumentando disposição e foco.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-3xl card-hover">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Saúde Duradoura</h3>
              <p className="text-gray-600 leading-relaxed">
                Previna doenças crônicas e fortaleça seu sistema imunológico com 
                escolhas alimentares inteligentes.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl card-hover">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bem-estar Mental</h3>
              <p className="text-gray-600 leading-relaxed">
                A alimentação impacta diretamente seu humor e clareza mental. 
                Cuide do corpo, cuide da mente.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-green-50 via-white to-teal-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-gray-600">Simples como 1, 2, 3</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-warm flex items-center justify-center shadow-lg shadow-orange-200">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Fotografe</h3>
              <p className="text-gray-600">
                Tire uma foto do seu prato, lanche ou bebida
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-fresh flex items-center justify-center shadow-lg shadow-green-200">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Analise</h3>
              <p className="text-gray-600">
                Nossa IA identifica alimentos e calcula nutrientes
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-vitality flex items-center justify-center shadow-lg shadow-purple-200">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Evolua</h3>
              <p className="text-gray-600">
                Receba dicas personalizadas e acompanhe seu progresso
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Invista em você
            </h2>
            <p className="text-lg text-gray-600">Escolha o plano ideal para sua jornada</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 text-center card-hover">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl">🌱</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Inicial</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">12</p>
              <p className="text-gray-500 mb-4">créditos</p>
              <p className="text-2xl font-bold text-green-600">R$ 4,90</p>
              <p className="text-xs text-gray-400 mt-2">1 análise completa</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-3xl p-6 text-center card-hover relative transform scale-105 shadow-xl shadow-green-200">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                MAIS POPULAR
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl">🌿</span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Básico</h3>
              <p className="text-4xl font-bold text-white mb-1">36</p>
              <p className="text-green-100 mb-4">créditos</p>
              <p className="text-2xl font-bold text-white">R$ 12,90</p>
              <p className="text-xs text-green-100 mt-2">3 análises completas</p>
            </div>
            
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 text-center card-hover">
              <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl">🌳</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Avançado</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">60</p>
              <p className="text-gray-500 mb-4">créditos</p>
              <p className="text-2xl font-bold text-green-600">R$ 19,90</p>
              <p className="text-xs text-gray-400 mt-2">5 análises completas</p>
            </div>
            
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 text-center card-hover">
              <div className="w-12 h-12 bg-orange-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-xl">🌟</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Pro</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">120</p>
              <p className="text-gray-500 mb-4">créditos</p>
              <p className="text-2xl font-bold text-green-600">R$ 34,90</p>
              <p className="text-xs text-gray-400 mt-2">10 análises completas</p>
            </div>
          </div>
          
          <p className="text-center text-gray-500 mt-8">
            Análise simples: 1 crédito | Análise completa com sugestão visual: 12 créditos
          </p>
        </div>
      </section>

      <section className="py-20 gradient-fresh">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para transformar sua alimentação?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Comece agora com 36 créditos gratuitos e descubra uma nova forma de se alimentar
          </p>
          <Link 
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-green-600 text-lg px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all"
          >
            Criar Conta Gratuita
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-fresh flex items-center justify-center">
                  <Salad className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Nutri-Vision</span>
              </div>
              <nav className="flex flex-wrap justify-center gap-6 text-sm">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacidade
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Termos de Uso
                </Link>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  Sobre
                </Link>
                <a href="mailto:contato@nutrivision.app" className="text-gray-400 hover:text-white transition-colors">
                  Contato
                </a>
              </nav>
            </div>
            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-gray-400 text-sm">
                Esta ferramenta oferece estimativas aproximadas baseadas em imagem. Nao substitui orientacao de nutricionista ou medico.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                © {new Date().getFullYear()} Nutri-Vision. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
