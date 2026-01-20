'use client';

import Link from 'next/link';
import { 
  Sparkles, Heart, TrendingUp, Shield, Apple, Flame, Star, ArrowRight, 
  CheckCircle2, Camera, Brain, BarChart3, Zap, Crown, Infinity, Ban, ChefHat,
  Image as ImageIcon, Target, Award, Users, CreditCard, UserCircle, Gift, Share2, QrCode
} from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30">
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <BowlLogo className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              PicNutra
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="text-gray-600 hover:text-emerald-600 font-medium text-sm sm:text-base transition-colors">
              Entrar
            </Link>
            <Link 
              href="/register" 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base hover:shadow-lg hover:shadow-emerald-200 transition-all"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/5 rounded-full" />
        
        <div className="relative max-w-lg mx-auto px-4 pt-10 pb-8 text-center">
          <div className="mb-4 animate-pulse">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 px-5 py-2.5 rounded-full shadow-lg">
              <span className="text-2xl">🔥</span>
              <span className="text-white text-sm sm:text-base font-black uppercase tracking-wide">A Nova Onda Fit</span>
              <span className="text-2xl">💪</span>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-medium">Powered by AI</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Acelere seus resultados com controle nutricional inteligente
          </h1>
          
          <p className="text-emerald-100 text-base sm:text-lg mb-6 max-w-md mx-auto">
            Descubra os nutrientes e as calorias estimadas das suas refeições com seu celular
          </p>

          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-white/30">
                  <img 
                    src="/demo-meal-1.png" 
                    alt="Prato saudável analisado pelo PicNutra" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-gray-800">~520 kcal</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Bife grelhado, macarrão, grão-de-bico e salada</p>
                </div>
              </div>
              <div className="relative group">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-white/30">
                  <img 
                    src="/demo-meal-2.png" 
                    alt="Refeição balanceada analisada pelo PicNutra" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-gray-800">~480 kcal</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Filé mignon com batatas rústicas e molho</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-emerald-200 mt-3">
              Análises reais feitas pelo PicNutra em segundos
            </p>
          </div>
          
          <div className="mb-4 animate-pulse">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 px-5 py-2.5 rounded-full shadow-lg">
              <span className="text-white text-sm sm:text-base font-black uppercase tracking-wide">Agora você não tem mais desculpas</span>
            </div>
          </div>
          
          <Link 
            href="/register"
            className="inline-flex items-center gap-3 bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all mb-6"
          >
            <Camera className="w-6 h-6" />
            Começar Grátis
          </Link>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-100">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Análise grátis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sem cartão</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Em segundos</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-6 mb-8 border border-emerald-200">
          <p className="text-gray-700 text-center leading-relaxed">
            O PicNutra é um assistente de alimentação saudável que ajuda você a entender 
            melhor o que consome no dia a dia. Crie um histórico alimentar completo para 
            acompanhar sua evolução e compartilhar com seu nutricionista ou nutrólogo, 
            tornando suas escolhas mais conscientes e equilibradas.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            Como funciona
          </h2>
          
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">1. Tire uma foto</h3>
                <p className="text-gray-500 text-sm">Fotografe seu prato, sobremesa ou bebida</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">2. IA analisa</h3>
                <p className="text-gray-500 text-sm">Nossa inteligência artificial identifica os alimentos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">3. Receba os resultados</h3>
                <p className="text-gray-500 text-sm">Calorias, proteínas, carboidratos, gorduras e dicas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Histórico completo
          </h2>
          <p className="text-gray-700 text-base font-bold mb-4">
            Compartilhe sua jornada nutricional com estatísticas detalhadas com seu nutricionista ou nutrólogo via QRCode!
          </p>
          <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-100">
            <img 
              src="/demo-history.png" 
              alt="Histórico de análises nutricionais do PicNutra" 
              className="w-full h-auto"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-gray-800">Médias nutricionais</span>
              </div>
              <p className="text-[10px] text-gray-500">Proteínas, carboidratos, gorduras e fibras</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-800">Para profissionais</span>
              </div>
              <p className="text-[10px] text-gray-500">Print e envie ao seu nutricionista</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            Complete seu perfil
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Após o cadastro, preencha seu perfil com seus objetivos, restrições alimentares e alergias. 
            Assim o PicNutra faz sugestões personalizadas que atendem suas necessidades!
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-3 text-center border border-violet-100">
              <Target className="w-5 h-5 text-violet-600 mx-auto mb-1" />
              <p className="text-[10px] text-gray-600 font-medium">Objetivos</p>
            </div>
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-3 text-center border border-rose-100">
              <Ban className="w-5 h-5 text-rose-600 mx-auto mb-1" />
              <p className="text-[10px] text-gray-600 font-medium">Restrições</p>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 text-center border border-amber-100">
              <Shield className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-[10px] text-gray-600 font-medium">Alergias</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl shadow-xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Gift className="w-6 h-6 text-yellow-300" />
              </div>
              Indique amigos e ganhe!
            </h2>
            <p className="text-emerald-100 text-sm mb-4">
              Compartilhe seu link ou QR Code de afiliado (disponível na aba Perfil) e ganhe créditos 
              para análises completas quando seus amigos se cadastrarem!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <Share2 className="w-5 h-5 text-white mx-auto mb-1" />
                <p className="text-xs font-medium">Link de indicação</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <QrCode className="w-5 h-5 text-white mx-auto mb-1" />
                <p className="text-xs font-medium">QR Code</p>
              </div>
            </div>
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-300 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-bold">+12 créditos</span> para você a cada amigo que se cadastrar!
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Escolha seu plano</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-100/50 p-5 border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">FREE</h3>
                <p className="text-xs text-emerald-600 font-medium">Grátis</p>
              </div>
            </div>
            
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                Análise rápida
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                Calorias e macros
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                Dicas nutricionais
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                Histórico
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-2.5 h-2.5 text-amber-600" />
                </div>
                Compre créditos extras
              </li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl shadow-lg shadow-purple-200/50 p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/10 rounded-full" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">PRO</h3>
                  <p className="text-xs text-purple-200">R$ 49,90/mês</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-2.5 h-2.5 text-white" />
                  </div>
                  Análises simples ilimitadas
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-2.5 h-2.5 text-yellow-300" />
                  </div>
                  90 análises PRO/mês
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                  Imagem otimizada
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-2.5 h-2.5 text-white" />
                  </div>
                  Sugestões de prato
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Ban className="w-2.5 h-2.5 text-white" />
                  </div>
                  Sem anúncios
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <Star className="w-6 h-6 text-white" />
            </div>
            O que você recebe
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-3 text-center border border-rose-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center mx-auto mb-2 shadow-md">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Calorias</h3>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-3 text-center border border-red-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center mx-auto mb-2 shadow-md">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Proteínas</h3>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-3 text-center border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center mx-auto mb-2 shadow-md">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Carbos</h3>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-3 text-center border border-yellow-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mx-auto mb-2 shadow-md">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Gorduras</h3>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-3 text-center border border-green-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-md">
                <BowlLogo className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Fibras</h3>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 text-center border border-blue-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center mx-auto mb-2 shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Dicas</h3>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 rounded-3xl p-5 mb-8 border border-purple-200 shadow-lg shadow-purple-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900">Análise Completa</h3>
              <p className="text-sm text-purple-600">Exclusivo PRO</p>
            </div>
          </div>
          
          <p className="text-gray-700 text-sm mb-4">
            Além dos nutrientes, gera uma <strong>imagem do prato otimizado</strong> com sugestões para tornar sua refeição mais saudável.
          </p>
          
          <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-md">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-200 to-purple-200 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-7 h-7 text-purple-600" />
            </div>
            <p className="text-purple-700 font-medium text-xs">
              "Adicione mais vegetais e reduza o arroz para um prato equilibrado"
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200">
              <Heart className="w-6 h-6 text-white" />
            </div>
            Por que cuidar da alimentação?
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-md">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Mais Energia</h3>
                <p className="text-gray-500 text-xs">Alimentos nutritivos dão mais disposição para o dia</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Saúde Duradoura</h3>
                <p className="text-gray-500 text-xs">Previna doenças e fortaleça seu sistema imunológico</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-md">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Bem-estar Mental</h3>
                <p className="text-gray-500 text-xs">Alimentação impacta humor e clareza mental</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-6 mb-8 text-center shadow-xl shadow-emerald-200/50">
          <h2 className="text-xl font-bold text-white mb-2">
            Pronto para transformar sua alimentação?
          </h2>
          <p className="text-emerald-100 text-sm mb-4">
            Comece agora e descubra uma nova forma de se alimentar
          </p>
          <Link 
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
          >
            Criar Conta Gratuita
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
                <BowlLogo className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">PicNutra</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacidade
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Termos
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                Sobre
              </Link>
            </nav>
            
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                Estimativas aproximadas baseadas em imagem.
                <br/>Não substitui orientação de nutricionista.
              </p>
              <p className="text-gray-600 text-xs mt-2">
                © {new Date().getFullYear()} PicNutra
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
