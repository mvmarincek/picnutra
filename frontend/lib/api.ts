const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nutrivision-api-dcr0.onrender.com';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
  isFormData?: boolean;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token, isFormData = false } = options;
  
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!isFormData && body) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(error.detail || 'Erro na requisição');
  }
  
  return response.json();
}

export interface User {
  id: number;
  email: string;
  plan: string;
  credit_balance: number;
  pro_analyses_remaining: number;
  referral_code?: string;
  email_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Profile {
  id: number;
  user_id: number;
  objetivo: string | null;
  restricoes: string[];
  alergias: string[];
  avatar_url: string | null;
  created_at: string;
}

export interface MealUploadResponse {
  meal_id: number;
  image_url: string;
}

export interface JobResponse {
  id: number;
  status: string;
  etapa_atual: string | null;
  questions: { id: string; question: string; options?: string[] }[] | null;
  resultado_final: AnalysisResult | null;
  erro: string | null;
}

export interface CaloriasInfo {
  central: number;
  min: number;
  max: number;
}

export interface MacrosInfo {
  proteina_g: number;
  carbo_g: number;
  gordura_g: number;
  fibra_g?: number;
}

export interface ItemIdentificado {
  nome: string;
  alternativas: string[];
  confianca: string;
}

export interface PorcaoEstimada {
  item: string;
  peso_g_ml_central: number;
  faixa_min: number;
  faixa_max: number;
  confianca: string;
}

export interface AnalysisResult {
  itens_identificados: ItemIdentificado[];
  porcoes_estimadas: PorcaoEstimada[];
  calorias: CaloriasInfo;
  macros: MacrosInfo;
  confianca: string;
  incertezas: string[];
  beneficios: string[];
  pontos_de_atencao: string[];
  recomendacoes_praticas: string[];
  aviso?: string;
  sugestao_melhorada_texto?: string;
  sugestao_melhorada_imagem_url?: string;
  mudancas_sugeridas?: string[];
  calorias_nova_versao?: CaloriasInfo;
  macros_nova_versao?: MacrosInfo;
}

export interface MealListItem {
  id: number;
  image_url: string;
  meal_type: string;
  status: string;
  mode: string;
  created_at: string;
  calorias_central: number | null;
}

export interface MealDetail {
  id: number;
  image_url: string;
  meal_type: string;
  status: string;
  mode: string;
  created_at: string;
  analysis: {
    id: number;
    meal_id: number;
    itens_identificados: ItemIdentificado[];
    porcoes_estimadas: PorcaoEstimada[];
    calorias: CaloriasInfo;
    macros: MacrosInfo;
    confianca: string;
    incertezas: string[];
    beneficios: string[];
    pontos_de_atencao: string[];
    recomendacoes_praticas: string[];
    sugestao_melhorada_texto?: string;
    sugestao_melhorada_imagem_url?: string;
    mudancas_sugeridas?: string[];
    calorias_nova_versao?: CaloriasInfo;
    macros_nova_versao?: MacrosInfo;
    created_at: string;
  } | null;
}

export interface BillingStatus {
  plan: string;
  credit_balance: number;
  pro_analyses_remaining: number;
  stripe_customer_id: string | null;
}

export interface CreditPackage {
  credits: number;
  price: number;
}

export const authApi = {
  register: (email: string, password: string, referral_code?: string) =>
    api<TokenResponse>('/auth/register', { method: 'POST', body: { email, password, referral_code } }),
  
  login: (email: string, password: string) =>
    api<TokenResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  
  forgotPassword: (email: string) =>
    api<{ exists: boolean; message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  
  resetPassword: (token: string, new_password: string) =>
    api<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token, new_password } }),
  
  downgradeToFree: (token: string) =>
    api<User>('/auth/downgrade-to-free', { method: 'POST', token }),
  
  resendVerification: (email: string) =>
    api<{ message: string; already_verified?: boolean }>('/auth/resend-verification', { method: 'POST', body: { email } }),
  
  checkEmailVerified: (token: string) =>
    api<{ email_verified: boolean }>('/auth/check-email-verified', { token }),
  
  getMe: (token: string) =>
    api<User>('/auth/me', { token })
};

export const profileApi = {
  get: (token: string) =>
    api<Profile>('/profile', { token }),
  
  update: (token: string, data: { objetivo?: string; restricoes?: string[]; alergias?: string[] }) =>
    api<Profile>('/profile', { method: 'POST', body: data, token }),
  
  uploadAvatar: (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api<Profile>('/profile/avatar', { method: 'POST', body: formData, token, isFormData: true });
  }
};

export const mealsApi = {
  upload: (token: string, file: File, mealType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('meal_type', mealType);
    return api<MealUploadResponse>('/meals/upload-image', { method: 'POST', body: formData, token, isFormData: true });
  },
  
  analyze: (token: string, mealId: number, mode: string) =>
    api<{ job_id: number }>(`/meals/${mealId}/analyze`, { method: 'POST', body: { mode }, token }),
  
  submitAnswers: (token: string, mealId: number, answers: Record<string, string>) =>
    api<{ job_id: number }>(`/meals/${mealId}/answers`, { method: 'POST', body: { answers }, token }),
  
  list: (token: string) =>
    api<MealListItem[]>('/meals', { token }),
  
  get: (token: string, mealId: number) =>
    api<MealDetail>(`/meals/${mealId}`, { token }),
  
  delete: (token: string, mealId: number) =>
    api<{ message: string }>(`/meals/${mealId}`, { method: 'DELETE', token })
};

export const jobsApi = {
  get: (token: string, jobId: number) =>
    api<JobResponse>(`/jobs/${jobId}`, { token })
};

export const billingApi = {
  getStatus: (token: string) =>
    api<BillingStatus>('/billing/status', { token }),
  
  getPackages: () =>
    api<Record<string, CreditPackage>>('/billing/packages'),
  
  createCreditCheckout: (token: string, packageId: string) =>
    api<{ checkout_url: string }>('/billing/create-credit-checkout', { method: 'POST', body: { package: packageId }, token }),
  
  createProCheckout: (token: string) =>
    api<{ checkout_url: string }>('/billing/create-pro-subscription-checkout', { method: 'POST', token })
};

export const creditsApi = {
  getBalance: (token: string) =>
    api<{ credit_balance: number; pro_analyses_remaining: number }>('/credits/balance', { token })
};

export const feedbackApi = {
  send: (token: string, mensagem: string) =>
    api<{ success: boolean; message: string }>('/feedback', {
      method: 'POST',
      token,
      body: { mensagem }
    })
};
