'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    'nav.analyze': 'Analisar',
    'nav.history': 'Histórico',
    'nav.credits': 'Créditos',
    'nav.profile': 'Perfil',
    'home.title': 'Analise sua refeição',
    'home.subtitle': 'Tire uma foto e descubra os nutrientes',
    'home.takePhoto': 'Tirar foto',
    'home.selectPhoto': 'Selecionar foto',
    'home.mealType': 'Tipo de refeição',
    'home.plate': 'Prato',
    'home.dessert': 'Sobremesa',
    'home.drink': 'Bebida',
    'home.snack': 'Lanche',
    'home.simpleAnalysis': 'Análise Simples',
    'home.completeAnalysis': 'Análise Completa',
    'home.credits': 'créditos',
    'home.free': 'Grátis',
    'history.title': 'Histórico de Análises',
    'history.share': 'Compartilhe sua jornada nutricional com estatísticas detalhadas com seu nutricionista ou nutrólogo via QRCode!',
    'history.level': 'Seu nível',
    'history.analyses': 'análises',
    'history.streak': 'dias seguidos',
    'history.thisWeek': 'esta semana',
    'history.avgKcal': 'kcal média',
    'history.daysUsing': 'dias usando',
    'profile.title': 'Meu Perfil',
    'profile.objective': 'Objetivo',
    'profile.restrictions': 'Restrições',
    'profile.allergies': 'Alergias',
    'credits.title': 'Créditos',
    'credits.balance': 'Saldo atual',
    'credits.buy': 'Comprar créditos',
    'result.calories': 'calorias',
    'result.protein': 'Proteína',
    'result.carbs': 'Carboidratos',
    'result.fat': 'Gordura',
    'result.fiber': 'Fibra',
    'result.newAnalysis': 'Nova análise',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.share': 'Compartilhar',
    'common.copy': 'Copiar',
    'common.copied': 'Copiado!',
  },
  en: {
    'nav.analyze': 'Analyze',
    'nav.history': 'History',
    'nav.credits': 'Credits',
    'nav.profile': 'Profile',
    'home.title': 'Analyze your meal',
    'home.subtitle': 'Take a photo and discover the nutrients',
    'home.takePhoto': 'Take photo',
    'home.selectPhoto': 'Select photo',
    'home.mealType': 'Meal type',
    'home.plate': 'Plate',
    'home.dessert': 'Dessert',
    'home.drink': 'Drink',
    'home.snack': 'Snack',
    'home.simpleAnalysis': 'Simple Analysis',
    'home.completeAnalysis': 'Complete Analysis',
    'home.credits': 'credits',
    'home.free': 'Free',
    'history.title': 'Analysis History',
    'history.share': 'Share your nutritional journey with detailed statistics with your nutritionist via QRCode!',
    'history.level': 'Your level',
    'history.analyses': 'analyses',
    'history.streak': 'day streak',
    'history.thisWeek': 'this week',
    'history.avgKcal': 'avg kcal',
    'history.daysUsing': 'days using',
    'profile.title': 'My Profile',
    'profile.objective': 'Objective',
    'profile.restrictions': 'Restrictions',
    'profile.allergies': 'Allergies',
    'credits.title': 'Credits',
    'credits.balance': 'Current balance',
    'credits.buy': 'Buy credits',
    'result.calories': 'calories',
    'result.protein': 'Protein',
    'result.carbs': 'Carbohydrates',
    'result.fat': 'Fat',
    'result.fiber': 'Fiber',
    'result.newAnalysis': 'New analysis',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.share': 'Share',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
  },
  es: {
    'nav.analyze': 'Analizar',
    'nav.history': 'Historial',
    'nav.credits': 'Créditos',
    'nav.profile': 'Perfil',
    'home.title': 'Analiza tu comida',
    'home.subtitle': 'Toma una foto y descubre los nutrientes',
    'home.takePhoto': 'Tomar foto',
    'home.selectPhoto': 'Seleccionar foto',
    'home.mealType': 'Tipo de comida',
    'home.plate': 'Plato',
    'home.dessert': 'Postre',
    'home.drink': 'Bebida',
    'home.snack': 'Merienda',
    'home.simpleAnalysis': 'Análisis Simple',
    'home.completeAnalysis': 'Análisis Completo',
    'home.credits': 'créditos',
    'home.free': 'Gratis',
    'history.title': 'Historial de Análisis',
    'history.share': '¡Comparte tu viaje nutricional con estadísticas detalladas con tu nutricionista via QRCode!',
    'history.level': 'Tu nivel',
    'history.analyses': 'análisis',
    'history.streak': 'días seguidos',
    'history.thisWeek': 'esta semana',
    'history.avgKcal': 'kcal promedio',
    'history.daysUsing': 'días usando',
    'profile.title': 'Mi Perfil',
    'profile.objective': 'Objetivo',
    'profile.restrictions': 'Restricciones',
    'profile.allergies': 'Alergias',
    'credits.title': 'Créditos',
    'credits.balance': 'Saldo actual',
    'credits.buy': 'Comprar créditos',
    'result.calories': 'calorías',
    'result.protein': 'Proteína',
    'result.carbs': 'Carbohidratos',
    'result.fat': 'Grasa',
    'result.fiber': 'Fibra',
    'result.newAnalysis': 'Nuevo análisis',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.share': 'Compartir',
    'common.copy': 'Copiar',
    'common.copied': '¡Copiado!',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    const saved = localStorage.getItem('picnutra-language') as Language;
    if (saved && ['pt', 'en', 'es'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('picnutra-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
