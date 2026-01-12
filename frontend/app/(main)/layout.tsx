'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Home, History, Sparkles, User, LogOut, Crown } from 'lucide-react';
import Footer from '@/components/Footer';
import BowlLogo from '@/components/BowlLogo';
import InstallPWAButton from '@/components/InstallPWAButton';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200/50">
            <BowlLogo className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/home', icon: Home, label: 'Analisar' },
    { href: '/history', icon: History, label: 'Historico' },
    { href: '/billing', icon: Sparkles, label: 'Creditos' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-teal-50/30 to-white pb-24">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-emerald-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {pathname === '/home' ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-200/50">
                <BowlLogo className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Nutrivision
              </span>
              {user.plan === 'pro' && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-500 px-2 py-1 rounded-full shadow-sm ml-1">
                  <Crown className="w-3 h-3 text-white" />
                  <span className="text-xs font-medium text-white">PRO</span>
                </div>
              )}
            </div>
          ) : (
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-200/50">
                <BowlLogo className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Nutrivision
              </span>
              {user.plan === 'pro' && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-500 px-2 py-1 rounded-full shadow-sm ml-1">
                  <Crown className="w-3 h-3 text-white" />
                  <span className="text-xs font-medium text-white">PRO</span>
                </div>
              )}
            </Link>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-emerald-700">
                {user.credit_balance} creditos
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
        <div className="mb-4">
          <InstallPWAButton />
        </div>
        {children}
      </main>

      <Footer />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-emerald-100 shadow-lg">
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
                      ? 'text-emerald-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    isActive ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : ''
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-emerald-600' : ''
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
