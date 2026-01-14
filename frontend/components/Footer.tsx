import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-gray-600 hover:text-green-600 transition-colors">
              Privacidade
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-green-600 transition-colors">
              Sobre
            </Link>
            <a href="mailto:nutrivision-contato@ai8hub.com" className="text-gray-600 hover:text-green-600 transition-colors">
              Contato
            </a>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Nutri-Vision oferece estimativas aproximadas baseadas em imagem. Não substitui orientação profissional.
          </p>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Nutri-Vision. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
