'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOSDevice && !isInStandaloneMode) {
      setIsIOS(true);
      setIsInstallable(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setDismissed(true);
  };

  if (isInstalled || !isInstallable || dismissed) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={handleInstallClick}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Smartphone className="w-5 h-5" />
          Instalar App
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instalar Nutrivision</h3>
              <p className="text-gray-600 text-sm">Siga os passos abaixo para adicionar o app na sua tela inicial:</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">1.</span> Toque no botao <span className="font-semibold">Compartilhar</span> do Safari
                </p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">+</div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">2.</span> Selecione <span className="font-semibold">Adicionar a Tela de Inicio</span>
                </p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">OK</div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">3.</span> Toque em <span className="font-semibold">Adicionar</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
