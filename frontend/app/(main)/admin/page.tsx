'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminApi, AdminStats, AdminUser, AdminPayment, UserDetails } from '@/lib/api';
import { useFeedback } from '@/lib/feedback';
import { 
  Users, CreditCard, TrendingUp, Activity, Search, ChevronLeft, ChevronRight,
  Crown, Shield, Plus, Eye, X, Calendar, Mail, Phone, Hash, Trash2, RefreshCw
} from 'lucide-react';

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showError, showSuccess, clearFeedback } = useFeedback();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments'>('dashboard');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPages, setPaymentPages] = useState(1);
  
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [addCreditsUserId, setAddCreditsUserId] = useState<number | null>(null);
  const [addCreditsAmount, setAddCreditsAmount] = useState('');
  const [addCreditsReason, setAddCreditsReason] = useState('');

  useEffect(() => {
    if (!authLoading && user && !user.is_admin) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.is_admin) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, paymentsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers({ page: 1, limit: 20 }),
        adminApi.getPayments({ page: 1, limit: 20 })
      ]);
      setStats(statsData);
      setUsers(usersData.users);
      setUserPages(usersData.pages);
      setPayments(paymentsData.payments);
      setPaymentPages(paymentsData.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const result = await adminApi.getUsers({ search: searchTerm, plan: planFilter, page: userPage, limit: 20 });
      setUsers(result.users);
      setUserPages(result.pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.is_admin && activeTab === 'users') {
      searchUsers();
    }
  }, [userPage, planFilter]);

  const loadPayments = async () => {
    try {
      const result = await adminApi.getPayments({ status: paymentStatus, page: paymentPage, limit: 20 });
      setPayments(result.payments);
      setPaymentPages(result.pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.is_admin && activeTab === 'payments') {
      loadPayments();
    }
  }, [paymentPage, paymentStatus]);

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;
    try {
      await adminApi.deletePayment(paymentId);
      showSuccess('Pagamento excluido com sucesso!', 'Sucesso');
      loadPayments();
    } catch (err) {
      showError('Erro ao excluir pagamento', 'Erro');
    }
  };

  const viewUserDetails = async (userId: number) => {
    try {
      const details = await adminApi.getUserDetails(userId);
      setSelectedUser(details);
      setShowUserModal(true);
    } catch (err) {
      showError('Erro ao carregar detalhes do usuario', 'Erro');
    }
  };

  const handleAddCredits = async () => {
    if (!addCreditsUserId || !addCreditsAmount || !addCreditsReason) return;
    try {
      const result = await adminApi.addCredits(addCreditsUserId, parseInt(addCreditsAmount), addCreditsReason);
      showSuccess(`Creditos adicionados! Novo saldo: ${result.new_balance}`, 'Sucesso');
      setShowAddCreditsModal(false);
      setAddCreditsAmount('');
      setAddCreditsReason('');
      searchUsers();
    } catch (err) {
      showError('Erro ao adicionar creditos', 'Erro');
    }
  };

  const handleToggleAdmin = async (userId: number) => {
    try {
      const result = await adminApi.toggleAdmin(userId);
      showSuccess(result.is_admin ? 'Admin ativado!' : 'Admin removido!', 'Sucesso');
      searchUsers();
    } catch (err) {
      showError('Erro ao alterar admin', 'Erro');
    }
  };

  const handleSetPro = async (userId: number) => {
    try {
      const result = await adminApi.setUserPro(userId, 1);
      showSuccess(`PRO ativado ate ${formatDate(result.pro_expires_at)}`, 'Sucesso');
      searchUsers();
    } catch (err) {
      showError('Erro ao ativar PRO', 'Erro');
    }
  };

  const handleRemovePro = async (userId: number) => {
    if (!confirm('Remover PRO deste usuario?')) return;
    try {
      await adminApi.removeUserPro(userId);
      showSuccess('PRO removido!', 'Sucesso');
      searchUsers();
    } catch (err) {
      showError('Erro ao remover PRO', 'Erro');
    }
  };

  const handleResetProAnalyses = async (userId: number) => {
    if (!confirm('Resetar analises PRO para 90?')) return;
    try {
      const result = await adminApi.resetProAnalyses(userId);
      showSuccess(`Analises resetadas para ${result.pro_analyses_remaining}!`, 'Sucesso');
      searchUsers();
    } catch (err) {
      showError('Erro ao resetar analises', 'Erro');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center animate-pulse shadow-xl shadow-orange-200">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-bounce" />
        </div>
        <p className="text-orange-600 font-medium mt-4">Carregando painel...</p>
      </div>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
        <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-orange-100">Gerencie usuarios, pagamentos e metricas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-lg shadow-gray-100/50 border border-gray-100">
        {['dashboard', 'users', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-medium rounded-xl transition-all ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'dashboard' ? 'Dashboard' : tab === 'users' ? 'Usuarios' : 'Pagamentos'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-100/50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">+{stats.users.new_today} hoje | +{stats.users.new_month} mes</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-100/50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                <Crown className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Usuarios PRO</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users.pro}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">{stats.users.verified} verificados</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-100/50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.revenue.total)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">{formatPrice(stats.revenue.month)} este mes</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-100/50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-fuchsia-100 to-pink-100 rounded-xl">
                <Activity className="w-6 h-6 text-fuchsia-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Analises</p>
                <p className="text-2xl font-bold text-gray-900">{stats.meals.total}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">{stats.meals.today} hoje</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por email, nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setUserPage(1); }}
              className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all"
            >
              <option value="">Todos planos</option>
              <option value="free">Free</option>
              <option value="pro">PRO</option>
            </select>
            <button onClick={searchUsers} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-200 hover:scale-[1.02] transition-all">
              Buscar
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Plano</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Creditos</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Cadastro</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {u.is_admin && <Shield className="w-4 h-4 text-orange-500" />}
                        <div>
                          <p className="font-medium text-gray-900">{u.email}</p>
                          {u.name && <p className="text-xs text-gray-500">{u.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        u.plan === 'pro' ? 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {u.plan === 'pro' ? `${u.pro_analyses_remaining} analises` : `${u.credit_balance} creditos`}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => viewUserDetails(u.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ver detalhes">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => { setAddCreditsUserId(u.id); setShowAddCreditsModal(true); }} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors" title="Adicionar creditos">
                          <Plus className="w-4 h-4 text-emerald-600" />
                        </button>
                        {u.plan === 'pro' ? (
                          <>
                            <button onClick={() => handleResetProAnalyses(u.id)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Resetar analises para 90">
                              <RefreshCw className="w-4 h-4 text-blue-600" />
                            </button>
                            <button onClick={() => handleRemovePro(u.id)} className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Remover PRO">
                              <Crown className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleSetPro(u.id)} className="p-2 hover:bg-violet-100 rounded-lg transition-colors" title="Ativar PRO">
                            <Crown className="w-4 h-4 text-violet-600" />
                          </button>
                        )}
                        <button onClick={() => handleToggleAdmin(u.id)} className="p-2 hover:bg-orange-100 rounded-lg transition-colors" title="Toggle Admin">
                          <Shield className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setUserPage(p => Math.max(1, p - 1))}
              disabled={userPage === 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-sm text-gray-500 font-medium">Pagina {userPage} de {userPages}</span>
            <button
              onClick={() => setUserPage(p => Math.min(userPages, p + 1))}
              disabled={userPage === userPages}
              className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Proxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div>
          <div className="flex gap-2 mb-4">
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPaymentPage(1); }}
              className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all"
            >
              <option value="">Todos status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Valor</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-700">{p.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{p.user_email}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-600">{p.billing_type} - {p.payment_type}</span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        p.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700' : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => handleDeletePayment(p.id)} 
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors" 
                        title="Excluir pagamento"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
              disabled={paymentPage === 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-sm text-gray-500 font-medium">Pagina {paymentPage} de {paymentPages}</span>
            <button
              onClick={() => setPaymentPage(p => Math.min(paymentPages, p + 1))}
              disabled={paymentPage === paymentPages}
              className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Proxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                Detalhes do Usuario
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{selectedUser.user.email}</span>
              </div>
              {selectedUser.user.cpf && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedUser.user.cpf}</span>
                </div>
              )}
              {selectedUser.user.phone && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedUser.user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Cadastro: {formatDate(selectedUser.user.created_at)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center border border-emerald-100">
                <p className="text-2xl font-bold text-emerald-600">{selectedUser.user.credit_balance}</p>
                <p className="text-xs text-gray-500">Creditos</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{selectedUser.meals_count}</p>
                <p className="text-xs text-gray-500">Analises</p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 text-center border border-violet-100">
                <p className="text-2xl font-bold text-violet-600">{selectedUser.referrals_count}</p>
                <p className="text-xs text-gray-500">Indicacoes</p>
              </div>
            </div>

            <h4 className="font-semibold mb-2 text-gray-900">Pagamentos Recentes</h4>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {selectedUser.payments.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">Nenhum pagamento</p>
              ) : selectedUser.payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 text-sm">
                  <span className="text-gray-700">{p.description}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {formatPrice(p.amount * 100)} - {p.status}
                  </span>
                </div>
              ))}
            </div>

            <h4 className="font-semibold mb-2 text-gray-900">Transacoes de Creditos</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedUser.transactions.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">Nenhuma transacao</p>
              ) : selectedUser.transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 text-sm">
                  <span className="text-gray-700">{t.description}</span>
                  <span className={`font-semibold ${t.credits_added > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.credits_added > 0 ? '+' : ''}{t.credits_added || -t.credits_used}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddCreditsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                Adicionar Creditos
              </h3>
              <button onClick={() => setShowAddCreditsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  value={addCreditsAmount}
                  onChange={(e) => setAddCreditsAmount(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={addCreditsReason}
                  onChange={(e) => setAddCreditsReason(e.target.value)}
                  placeholder="Ex: Compensacao por erro"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
                />
              </div>
              <button
                onClick={handleAddCredits}
                disabled={!addCreditsAmount || !addCreditsReason}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                Adicionar Creditos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
