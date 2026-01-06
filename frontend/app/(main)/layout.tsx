'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Home, History, Sparkles, User, LogOut, Salad } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-fresh flex items-center justify-center animate-pulse">
            <Salad className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/home', icon: Home, label: 'Analisar' },
    { href: '/history', icon: History, label: 'Histórico' },
    { href: '/billing', icon: Sparkles, label: 'Créditos' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white pb-24">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-green-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-fresh flex items-center justify-center">
              <Salad className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
              Nutri-Vision
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-green-700">
                {user.credit_balance} créditos
              </span>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-green-100 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                    isActive 
                      ? 'text-green-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    isActive ? 'bg-green-100' : ''
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-green-600' : ''
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
