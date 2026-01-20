'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/home" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
          <p className="text-sm text-gray-500 mb-6">Última atualização: Janeiro de 2025</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Aceitação dos Termos</h2>
              <p>
                Ao utilizar o PicNutra, você concorda com estes Termos de Uso. Se não concordar 
                com qualquer parte destes termos, não utilize o aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Descrição do Serviço</h2>
              <p>
                O PicNutra é um aplicativo que utiliza inteligência artificial para fornecer 
                <strong> estimativas nutricionais aproximadas</strong> com base em imagens de refeições. 
                O serviço é oferecido para fins informativos e educacionais.
              </p>
            </section>

            <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-amber-800 mb-2">3. Aviso Legal Importante</h2>
              <p className="text-amber-900">
                <strong>O PicNutra NÃO é um serviço médico ou de nutrição clínica.</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-amber-800">
                <li>As análises são <strong>estimativas baseadas em imagem</strong> e podem conter imprecisões</li>
                <li>Os valores nutricionais são <strong>aproximações</strong>, não medições exatas</li>
                <li>Este serviço <strong>não substitui</strong> avaliação profissional de nutricionistas ou médicos</li>
                <li>Não utilize as informações para diagnóstico ou tratamento de condições de saúde</li>
                <li>Consulte sempre um profissional de saúde para orientação nutricional personalizada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Planos e Créditos</h2>
              <h3 className="font-medium text-gray-800 mt-3 mb-1">Plano Gratuito (Free)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Análises rápidas ilimitadas (calorias e macros básicos)</li>
                <li>Exibição de anúncios</li>
                <li>Histórico limitado</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-3 mb-1">Plano PRO</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Análises completas com sugestões visuais</li>
                <li>Sem anúncios</li>
                <li>Histórico completo</li>
                <li>Créditos mensais inclusos</li>
              </ul>

              <h3 className="font-medium text-gray-800 mt-3 mb-1">Créditos</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Análise rápida: 5 créditos</li>
                <li>Análise completa: 12 créditos</li>
                <li>Créditos podem ser adquiridos em pacotes</li>
                <li>Créditos não expiram</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Pagamentos e Cancelamento</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pagamentos são processados de forma segura via Asaas (PIX ou cartão)</li>
                <li>Assinaturas PRO são cobradas mensalmente</li>
                <li>Você pode cancelar sua assinatura a qualquer momento</li>
                <li>Ao cancelar, você mantém acesso até o fim do período pago</li>
                <li>Créditos avulsos não são reembolsáveis após a compra</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Uso Adequado</h2>
              <p>Ao usar o PicNutra, você concorda em:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Enviar apenas imagens de alimentos para análise</li>
                <li>Não utilizar o serviço para fins ilegais</li>
                <li>Não tentar burlar limitações ou sistemas de segurança</li>
                <li>Não compartilhar sua conta com terceiros</li>
                <li>Manter suas credenciais de acesso seguras</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Limitação de Responsabilidade</h2>
              <p>
                O PicNutra é fornecido "como está", sem garantias de qualquer tipo. 
                Não nos responsabilizamos por:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Decisões tomadas com base nas estimativas fornecidas</li>
                <li>Imprecisões nas análises nutricionais</li>
                <li>Indisponibilidade temporária do serviço</li>
                <li>Perdas decorrentes do uso ou impossibilidade de uso do aplicativo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo do PicNutra, incluindo design, código, textos e marca, 
                é protegido por direitos autorais. É proibida a reprodução sem autorização.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Alterações nos Termos</h2>
              <p>
                Podemos atualizar estes termos periodicamente. Continuando a usar o aplicativo 
                após alterações, você aceita os novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contato</h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> picnutra-contato@picnutra.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
