'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/home" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
          <p className="text-sm text-gray-500 mb-6">Última atualização: Janeiro de 2025</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Introdução</h2>
              <p>
                O PicNutra é um aplicativo de estimativa nutricional que utiliza inteligência artificial 
                para analisar imagens de refeições. Esta política descreve como coletamos, usamos e protegemos 
                seus dados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Dados Coletados</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Conta:</strong> Email e senha criptografada para autenticação</li>
                <li><strong>Imagens:</strong> Fotos de refeições enviadas para análise nutricional</li>
                <li><strong>Perfil:</strong> Objetivos nutricionais, restrições alimentares e alergias (opcional)</li>
                <li><strong>Uso:</strong> Histórico de análises e interações com o aplicativo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Uso das Imagens</h2>
              <p>
                As imagens enviadas são processadas exclusivamente para gerar estimativas nutricionais. 
                Elas são:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Enviadas de forma segura para nossos servidores</li>
                <li>Processadas por inteligência artificial (OpenAI)</li>
                <li>Armazenadas temporariamente para permitir visualização do histórico</li>
                <li>Nunca compartilhadas com terceiros para outros fins</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Serviços de Terceiros</h2>
              <p>Utilizamos os seguintes serviços externos:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>OpenAI:</strong> Análise de imagens e geração de estimativas nutricionais</li>
                <li><strong>Asaas:</strong> Processamento de pagamentos (PIX e cartão)</li>
                <li><strong>Resend:</strong> Envio de emails transacionais</li>
                <li><strong>Google AdSense:</strong> Exibição de anúncios para usuários do plano gratuito</li>
                <li><strong>Vercel:</strong> Hospedagem do aplicativo</li>
                <li><strong>Render:</strong> Hospedagem da API</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cookies e Armazenamento Local</h2>
              <p>
                Utilizamos localStorage para armazenar seu token de autenticação, garantindo que você 
                permaneça conectado entre sessões. Não utilizamos cookies de rastreamento próprios, 
                mas serviços de terceiros (como Google AdSense) podem utilizar cookies para personalização 
                de anúncios.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Criptografia de senhas (bcrypt)</li>
                <li>Comunicação segura (HTTPS)</li>
                <li>Autenticação via tokens JWT</li>
                <li>Acesso restrito aos dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Seus Direitos</h2>
              <p>Você tem o direito de:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Acessar seus dados pessoais</li>
                <li>Solicitar correção de informações incorretas</li>
                <li>Solicitar exclusão de sua conta e dados</li>
                <li>Exportar seus dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contato</h2>
              <p>
                Para dúvidas sobre privacidade ou solicitações relacionadas aos seus dados, 
                entre em contato conosco:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> picnutra-contato@picnutra.com
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças 
                significativas por email ou através do aplicativo.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
