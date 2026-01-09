'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, AdminStats, AdminUser, AdminPayment, UserDetails } from '@/lib/api';
import { useFeedback } from '@/contexts/FeedbackContext';
import { 
  Users, CreditCard, TrendingUp, Activity, Search, ChevronLeft, ChevronRight,
  Crown, Shield, Plus, Eye, X, Calendar, Mail, Phone, Hash
} from 'lucide-react';

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-orange-500" />
        Painel Administrativo
      </h1>

      <div className="flex gap-2 mb-6 border-b">
        {['dashboard', 'users', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'dashboard' ? 'Dashboard' : tab === 'users' ? 'Usuarios' : 'Pagamentos'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Usuarios</p>
                <p className="text-xl font-bold">{stats.users.total}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">+{stats.users.new_today} hoje | +{stats.users.new_month} mes</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Usuarios PRO</p>
                <p className="text-xl font-bold">{stats.users.pro}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stats.users.verified} verificados</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita Total</p>
                <p className="text-xl font-bold">{formatPrice(stats.revenue.total * 100)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{formatPrice(stats.revenue.month * 100)} este mes</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Analises</p>
                <p className="text-xl font-bold">{stats.meals.total}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stats.meals.today} hoje</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por email, nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setUserPage(1); }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todos planos</option>
              <option value="free">Free</option>
              <option value="pro">PRO</option>
            </select>
            <button onClick={searchUsers} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Buscar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creditos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.is_admin && <Shield className="w-4 h-4 text-orange-500" />}
                        <div>
                          <p className="font-medium">{u.email}</p>
                          {u.name && <p className="text-xs text-gray-500">{u.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.plan === 'pro' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.plan === 'pro' ? `${u.pro_analyses_remaining} analises` : `${u.credit_balance} creditos`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => viewUserDetails(u.id)} className="p-1 hover:bg-gray-100 rounded" title="Ver detalhes">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => { setAddCreditsUserId(u.id); setShowAddCreditsModal(true); }} className="p-1 hover:bg-gray-100 rounded" title="Adicionar creditos">
                          <Plus className="w-4 h-4 text-green-600" />
                        </button>
                        <button onClick={() => handleSetPro(u.id)} className="p-1 hover:bg-gray-100 rounded" title="Ativar PRO">
                          <Crown className="w-4 h-4 text-yellow-600" />
                        </button>
                        <button onClick={() => handleToggleAdmin(u.id)} className="p-1 hover:bg-gray-100 rounded" title="Toggle Admin">
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
              className="flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-sm text-gray-500">Pagina {userPage} de {userPages}</span>
            <button
              onClick={() => setUserPage(p => Math.min(userPages, p + 1))}
              disabled={userPage === userPages}
              className="flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-50"
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
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todos status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{p.id}</td>
                    <td className="px-4 py-3 text-sm">{p.user_email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{p.billing_type} - {p.payment_type}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(p.amount * 100)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
              disabled={paymentPage === 1}
              className="flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-sm text-gray-500">Pagina {paymentPage} de {paymentPages}</span>
            <button
              onClick={() => setPaymentPage(p => Math.min(paymentPages, p + 1))}
              disabled={paymentPage === paymentPages}
              className="flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-50"
            >
              Proxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Detalhes do Usuario</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{selectedUser.user.email}</span>
              </div>
              {selectedUser.user.cpf && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.user.cpf}</span>
                </div>
              )}
              {selectedUser.user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Cadastro: {formatDate(selectedUser.user.created_at)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{selectedUser.user.credit_balance}</p>
                <p className="text-xs text-gray-500">Creditos</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{selectedUser.meals_count}</p>
                <p className="text-xs text-gray-500">Analises</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{selectedUser.referrals_count}</p>
                <p className="text-xs text-gray-500">Indicacoes</p>
              </div>
            </div>

            <h4 className="font-semibold mb-2">Pagamentos Recentes</h4>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {selectedUser.payments.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum pagamento</p>
              ) : selectedUser.payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-2 text-sm">
                  <span>{p.description}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${p.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {formatPrice(p.amount * 100)} - {p.status}
                  </span>
                </div>
              ))}
            </div>

            <h4 className="font-semibold mb-2">Transacoes de Creditos</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedUser.transactions.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma transacao</p>
              ) : selectedUser.transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-2 text-sm">
                  <span>{t.description}</span>
                  <span className={t.credits_added > 0 ? 'text-green-600' : 'text-red-600'}>
                    {t.credits_added > 0 ? '+' : ''}{t.credits_added || -t.credits_used}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddCreditsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Adicionar Creditos</h3>
              <button onClick={() => setShowAddCreditsModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={addCreditsReason}
                  onChange={(e) => setAddCreditsReason(e.target.value)}
                  placeholder="Ex: Compensacao por erro"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={handleAddCredits}
                disabled={!addCreditsAmount || !addCreditsReason}
                className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
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
